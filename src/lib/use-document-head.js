import { useEffect } from "react";

// Minimal replacement for TanStack Router's `head()` route option.
// Call at the top of a page component with the same { title, meta } shape
// that used to be passed to `head: () => ({ meta: [...] })`.
//
// Accepts either:
//   useDocumentHead({ title: "Page — Site" })
// or the old-style meta array where the first entry may carry the title:
//   useDocumentHead({ meta: [{ title: "..." }, { name: "description", content: "..." }] })
export function useDocumentHead({ title, meta = [] } = {}) {
  useEffect(() => {
    const resolvedTitle = title ?? meta.find((m) => m.title)?.title;
    if (resolvedTitle) {
      document.title = resolvedTitle;
    }

    const metaTags = meta.filter((m) => m.name && m.content);
    const created = [];

    for (const { name, content } of metaTags) {
      let tag = document.head.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        document.head.appendChild(tag);
        created.push(tag);
      }
      tag.setAttribute("content", content);
    }

    return () => {
      for (const tag of created) {
        tag.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, JSON.stringify(meta)]);
}
