// ─────────────────────────────────────────────────
//  snip.link — Error Handling Middleware
// ─────────────────────────────────────────────────

export function notFoundHandler(req, res, next) {
  // Don't 404 for short code routes — they're handled by the redirect route
  if (!req.path.startsWith("/api")) return next();
  res.status(404).json({ error: "Route not found" });
}

export function errorHandler(err, req, res, next) {
  console.error("Server error:", err.stack || err.message);

  if (err.code === "P2002") {
    return res.status(409).json({
      error: "A record with that value already exists",
      field: err.meta?.target,
    });
  }

  if (err.name === "ZodError") {
    return res.status(400).json({
      error: "Validation failed",
      details: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Invalid token" });
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message,
  });
}
