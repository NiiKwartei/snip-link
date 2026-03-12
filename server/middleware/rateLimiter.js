// ─────────────────────────────────────────────────
//  snip.link — Rate Limiting Middleware
// ─────────────────────────────────────────────────

import rateLimit from "express-rate-limit";

export const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please try again later.",
    retryAfter: "15 minutes",
  },
});

export const shortenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.SHORTEN_RATE_LIMIT_MAX) || 20,
  message: {
    error: "Too many URLs shortened. Please try again later.",
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: "Too many auth attempts. Please try again later.",
  },
});
