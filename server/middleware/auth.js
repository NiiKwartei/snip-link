// ─────────────────────────────────────────────────
//  snip.link — Authentication Middleware
// ─────────────────────────────────────────────────

import jwt from "jsonwebtoken";
import prisma from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";

export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

// Required auth — blocks request if no valid token (Modeified to allow demo-user access)
export async function requireAuth(req, res, next) {
  try {
    const token =
      req.cookies?.token ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      // For "no-auth" mode, we fetch a default demo user
      const demoUser = await prisma.user.findFirst({
        where: { email: "demo@snip.link" }
      });
      if (demoUser) {
        req.user = demoUser;
        return next();
      }
      return res.status(401).json({ error: "Authenticated required & no demo user found" });
    }

    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      // Fallback to demo user if token is invalid but we want no-auth
      const demoUser = await prisma.user.findFirst({ where: { email: "demo@snip.link" } });
      req.user = demoUser;
      return next();
    }

    req.user = user;
    next();
  } catch (err) {
    const demoUser = await prisma.user.findFirst({ where: { email: "demo@snip.link" } });
    if (demoUser) {
      req.user = demoUser;
      return next();
    }
    return res.status(401).json({ error: "Invalid token and no demo user found" });
  }
}

// Optional auth — attaches user if token exists, continues otherwise
export async function optionalAuth(req, res, next) {
  try {
    const token =
      req.cookies?.token ||
      req.headers.authorization?.replace("Bearer ", "");

    if (token) {
      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, name: true },
      });
      req.user = user || null;
    }
  } catch {
    req.user = null;
  }
  next();
}

// API key auth — for programmatic access
export async function apiKeyAuth(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) return next();

  try {
    const key = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    if (key && key.isActive) {
      req.user = key.user;
      await prisma.apiKey.update({
        where: { id: key.id },
        data: { lastUsed: new Date() },
      });
    }
  } catch {
    // silently continue
  }
  next();
}
