// ─────────────────────────────────────────────────
//  snip.link — Redirect Handler + Click Tracking
// ─────────────────────────────────────────────────

import { Router } from "express";
import UAParser from "ua-parser-js";
import prisma from "../config/db.js";

const router = Router();

// Parse referrer into a clean source name
function parseReferrer(referer) {
  if (!referer) return "Direct";
  try {
    const hostname = new URL(referer).hostname.replace("www.", "");
    const map = {
      "google.com": "Google",
      "bing.com": "Bing",
      "twitter.com": "Twitter/X",
      "x.com": "Twitter/X",
      "facebook.com": "Facebook",
      "linkedin.com": "LinkedIn",
      "reddit.com": "Reddit",
      "youtube.com": "YouTube",
      "instagram.com": "Instagram",
      "t.co": "Twitter/X",
    };
    return map[hostname] || hostname;
  } catch {
    return "Unknown";
  }
}

// Get device type from UA
function getDeviceType(device) {
  if (device.type === "mobile") return "mobile";
  if (device.type === "tablet") return "tablet";
  return "desktop";
}

router.get("/:shortCode", async (req, res, next) => {
  const { shortCode } = req.params;

  // Skip API-like paths
  if (shortCode.startsWith("api") || shortCode.startsWith("_")) {
    return next();
  }

  try {
    const link = await prisma.link.findUnique({
      where: { shortCode },
      include: { _count: { select: { clicks: true } } },
    });

    if (!link || !link.isActive) {
      return next(); // fall through to 404 / SPA handler
    }

    // Check expiration
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return res.status(410).json({ error: "This link has expired" });
    }

    // Check max clicks
    if (link.maxClicks && link._count.clicks >= link.maxClicks) {
      return res.status(410).json({ error: "This link has reached its click limit" });
    }

    // Check password protection
    if (link.password) {
      const providedPassword = req.query.pw || req.headers["x-link-password"];
      if (providedPassword !== link.password) {
        return res.status(401).json({
          error: "This link is password protected",
          requiresPassword: true,
        });
      }
    }

    // ── Track click (fire-and-forget) ─────────────────
    const ua = new UAParser(req.headers["user-agent"]);
    const browser = ua.getBrowser();
    const os = ua.getOS();
    const device = ua.getDevice();

    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.headers["x-real-ip"] ||
      req.connection?.remoteAddress ||
      null;

    // Non-blocking click recording
    prisma.click
      .create({
        data: {
          linkId: link.id,
          ip: ip ? ip.replace("::ffff:", "") : null,
          userAgent: req.headers["user-agent"] || null,
          referer: req.headers.referer || req.headers.referrer || null,
          browser: browser.name || null,
          os: os.name || null,
          device: getDeviceType(device),
          country: null, // enriched via GeoIP in production
          city: null,
        },
      })
      .catch((err) => console.error("Click tracking error:", err.message));

    // ── Redirect ──────────────────────────────────────
    const status = parseInt(process.env.DEFAULT_REDIRECT_STATUS) || 301;
    return res.redirect(status, link.originalUrl);
  } catch (err) {
    next(err);
  }
});

export default router;
