import express from "express";

const router = express.Router();

/**
 * GET /api/location/detect
 * Uses ipinfo.io to detect user location from IP address.
 * Returns: { area, city, state, pincode, lat, lng, fullAddress }
 * Free tier: 50k requests/month with token, 1k/day without.
 */
router.get("/detect", async (req, res) => {
  try {
    // Get the real client IP (handles proxies)
    const clientIP =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.connection?.remoteAddress ||
      req.ip;

    // Build IPinfo URL
    const token = process.env.IPINFO_TOKEN; // optional
    let url = `https://ipinfo.io/${clientIP}/json`;
    if (token) url += `?token=${token}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`IPinfo responded with status ${response.status}`);
    }

    const data = await response.json();

    // Handle localhost / private IPs (127.0.0.1, ::1, etc.)
    if (data.bogon) {
      // Fallback: fetch without IP (returns server's public IP location)
      const fallbackUrl = token
        ? `https://ipinfo.io/json?token=${token}`
        : `https://ipinfo.io/json`;
      const fbRes = await fetch(fallbackUrl);
      const fbData = await fbRes.json();
      return res.json({
        success: true,
        data: formatIPInfo(fbData),
        source: "ipinfo-public",
      });
    }

    res.json({
      success: true,
      data: formatIPInfo(data),
      source: "ipinfo",
    });
  } catch (error) {
    console.error("Location detect error:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not detect location from IP",
      error: error.message,
    });
  }
});

function formatIPInfo(data) {
  const [lat, lng] = (data.loc || "0,0").split(",").map(Number);
  return {
    area: data.city || "",
    city: data.city || "",
    state: data.region || "",
    pincode: data.postal || "",
    country: data.country || "",
    lat,
    lng,
    fullAddress: [data.city, data.region, data.country]
      .filter(Boolean)
      .join(", "),
    ip: data.ip,
    org: data.org || "",
  };
}

export default router;
