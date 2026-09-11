// Small helper to turn a raw video URL into a renderable embed descriptor.
// Returns { type: "iframe" | "video" | "link", src }

function extractYouTubeId(url) {
  const patterns = [
    /youtu\.be\/([^?&/]+)/,
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^?&/]+)/,
    /youtube\.com\/shorts\/([^?&/]+)/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

function extractVimeoId(url) {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? m[1] : null;
}

// Gumlet embed links (https://play.gumlet.io/embed/<assetId>) are already iframe-ready
// as-is. Non-embed Gumlet URLs (e.g. a dashboard/share link containing the asset id)
// get normalized into that embed form on a best-effort basis.
function gumletEmbedSrc(url) {
  if (/play\.gumlet\.io\/embed\//.test(url)) return url;
  const m = url.match(/gumlet\.(?:io|tv|com)\/(?:.*\/)?([a-zA-Z0-9]{10,})/);
  if (m) return `https://play.gumlet.io/embed/${m[1]}`;
  return null;
}

// The "Gumlet Video ID" admin fields store a bare asset id, but admins often
// paste the full embed URL instead — this accepts either and always returns
// just the id, so building `https://play.gumlet.io/embed/<id>` never double-nests.
export function extractGumletId(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  const match = trimmed.match(/play\.gumlet\.io\/embed\/([^/?#]+)/i);
  if (match?.[1]) return match[1];
  if (/^https?:\/\//i.test(trimmed)) return "";
  return trimmed;
}

export function embedVideo(url) {
  if (!url) return { type: "link", src: url };

  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const id = extractYouTubeId(url);
    if (id) {
      return {
        type: "iframe",
        provider: "youtube",
        src: `https://www.youtube.com/embed/${id}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`,
      };
    }
  }

  if (url.includes("vimeo.com")) {
    const id = extractVimeoId(url);
    if (id) return { type: "iframe", provider: "vimeo", src: `https://player.vimeo.com/video/${id}` };
  }

  if (url.includes("gumlet")) {
    const src = gumletEmbedSrc(url);
    if (src) return { type: "iframe", provider: "gumlet", src };
  }

  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) {
    return { type: "video", src: url };
  }

  return { type: "link", src: url };
}

// Wires up an "ended" listener on an already-mounted <iframe>, using whichever
// postMessage protocol its provider speaks. Gumlet and Vimeo both implement the
// player.js protocol (must ask the player to start emitting events before it will).
// YouTube's IFrame API uses a different JSON shape (onStateChange, info===0 = ended).
// Returns a cleanup function.
export function listenForVideoEnd(iframeEl, provider, onEnded) {
  if (!iframeEl) return () => {};

  let hasPlayed = false;

  function requestEvents() {
    if (!iframeEl.contentWindow) return;
    if (provider === "youtube") {
      iframeEl.contentWindow.postMessage(
        JSON.stringify({ event: "listening", id: 1 }),
        "*",
      );
    } else {
      // player.js protocol (Gumlet, Vimeo)
      iframeEl.contentWindow.postMessage(
        JSON.stringify({ method: "addEventListener", value: "ready" }),
        "*",
      );
      iframeEl.contentWindow.postMessage(
        JSON.stringify({ method: "addEventListener", value: "play" }),
        "*",
      );
      iframeEl.contentWindow.postMessage(
        JSON.stringify({ method: "addEventListener", value: "ended" }),
        "*",
      );
    }
  }

  function handleMessage(e) {
    let data = e.data;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        return;
      }
    }
    if (!data || typeof data !== "object") return;

    if (provider === "youtube") {
      // YT IFrame API: {event: "onStateChange", info: 0} where 0 === ENDED
      if (data.event === "onStateChange" && data.info === 0) onEnded();
      if (data.event === "onReady") requestEvents();
      return;
    }

    // player.js protocol: {event: "ended"} (Vimeo/Gumlet), sometimes nested in `.value`
    if (data.event === "play" || data.value?.event === "play") {
      hasPlayed = true;
    }
    if (data.event === "ended" || data.value?.event === "ended") {
      if (hasPlayed) {
        onEnded();
      }
    }
    if (data.event === "ready") requestEvents();
  }

  window.addEventListener("message", handleMessage);
  requestEvents();
  const retry = setTimeout(requestEvents, 800); // some players miss the first request

  return () => {
    window.removeEventListener("message", handleMessage);
    clearTimeout(retry);
  };
}
