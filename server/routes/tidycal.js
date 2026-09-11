const express = require("express");
const router = express.Router();

const TIDYCAL_API_BASE = "https://tidycal.com/api";

// Simple cache for booking type slug -> ID mapping
const slugIdCache = {};

async function fetchWithAuth(url, options = {}) {
  const token = process.env.TIDYCAL_ACCESS_TOKEN;
  if (!token) {
    throw new Error("TIDYCAL_ACCESS_TOKEN is not configured on the server");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`TidyCal API error (${response.status}):`, errorText);
    throw new Error(`TidyCal API returned status ${response.status}: ${errorText}`);
  }

  return response.json();
}

async function getBookingTypeIdBySlug(slug) {
  if (slugIdCache[slug]) {
    return slugIdCache[slug];
  }

  console.log(`Resolving TidyCal booking type ID for slug: ${slug}`);
  // Paginated — { data: [...] }, not a bare array.
  const { data: bookingTypes } = await fetchWithAuth(`${TIDYCAL_API_BASE}/booking-types`);

  // The admin-pasted scheduler URL is .../<handle>/<url_slug> — url_slug is the
  // stable, human-readable identifier. `slug` on the booking type object is an
  // unrelated short code TidyCal generates and isn't what appears in the URL.
  const match = bookingTypes.find((bt) => bt.url_slug === slug || slug.endsWith(bt.url_slug));

  if (!match) {
    throw new Error(`Could not find TidyCal booking type matching slug: ${slug}`);
  }

  slugIdCache[slug] = match.id;
  return match.id;
}

// GET /api/tidycal/slots
router.get("/api/tidycal/slots", async (req, res) => {
  const { slug, starts_at, ends_at, timezone } = req.query;

  if (!slug) {
    return res.status(400).json({ error: "slug parameter is required" });
  }

  try {
    const cleanSlug = slug.replace("https://tidycal.com/", "").split("?")[0];
    const bookingTypeId = await getBookingTypeIdBySlug(cleanSlug);

    // Both bounds are required by TidyCal's API; default to a 30-day lookahead
    // window from starts_at (or now) when the caller doesn't specify ends_at.
    const startsAt = starts_at ? new Date(starts_at) : new Date();
    const endsAt = ends_at ? new Date(ends_at) : new Date(startsAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    const toApiFormat = (d) => d.toISOString().replace(/\.\d{3}Z$/, "Z");

    const slotsParams = new URLSearchParams({
      starts_at: toApiFormat(startsAt),
      ends_at: toApiFormat(endsAt),
      timezone: timezone || "UTC",
    });

    const { data: slots } = await fetchWithAuth(
      `${TIDYCAL_API_BASE}/booking-types/${bookingTypeId}/timeslots?${slotsParams}`
    );
    res.json({ slots });
  } catch (error) {
    console.error("Error fetching TidyCal slots:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tidycal/bookings
router.post("/api/tidycal/bookings", async (req, res) => {
  const { slug, starts_at, name, email, timezone, booking_questions } = req.body;

  if (!slug || !starts_at || !name || !email) {
    return res.status(400).json({ error: "Missing required fields (slug, starts_at, name, email)" });
  }

  try {
    const cleanSlug = slug.replace("https://tidycal.com/", "").split("?")[0];
    const bookingTypeId = await getBookingTypeIdBySlug(cleanSlug);

    const bookingPayload = {
      starts_at,
      name,
      email,
      timezone: timezone || "UTC",
      booking_questions: booking_questions || [],
    };

    console.log("Booking via TidyCal API with payload:", bookingPayload);
    // Single-booking response is { data: Booking }, not the booking itself.
    const { data: booking } = await fetchWithAuth(`${TIDYCAL_API_BASE}/booking-types/${bookingTypeId}/bookings`, {
      method: "POST",
      body: JSON.stringify(bookingPayload),
    });

    res.json({ success: true, booking });
  } catch (error) {
    console.error("Error creating TidyCal booking:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
