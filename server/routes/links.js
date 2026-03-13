// ─────────────────────────────────────────────────
//  snip.link — Link Routes (CRUD + QR Code)
// ─────────────────────────────────────────────────

import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import QRCode from "qrcode";
import validator from "validator";
import prisma from "../config/db.js";
import { requireAuth, optionalAuth, apiKeyAuth } from "../middleware/auth.js";
import { shortenLimiter } from "../middleware/rateLimiter.js";

const router = Router();

const SHORT_CODE_LENGTH = parseInt(process.env.SHORT_CODE_LENGTH) || 6;
const BASE_URL = process.env.BASE_URL || "http://localhost:3001";

// Blocked aliases that conflict with routes
const RESERVED_ALIASES = new Set([
  "api", "auth", "login", "register", "dashboard", "admin",
  "settings", "analytics", "health", "links", "app", "static",
  "assets", "favicon", "robots", "sitemap",
]);

const createLinkSchema = z.object({
  url: z.string().url("Invalid URL"),
  customAlias: z
    .string()
    .regex(/^[a-zA-Z0-9_-]+$/, "Alias can only contain letters, numbers, hyphens, underscores")
    .min(3)
    .max(30)
    .optional(),
  title: z.string().max(200).optional(),
  expiresAt: z.string().datetime().optional(),
  password: z.string().min(1).optional(),
  maxClicks: z.number().int().positive().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

const updateLinkSchema = z.object({
  title: z.string().max(200).optional(),
  originalUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  password: z.string().min(1).nullable().optional(),
  maxClicks: z.number().int().positive().nullable().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

// ─── Create Short Link ─────────────────────────────
router.post("/", apiKeyAuth, optionalAuth, shortenLimiter, async (req, res, next) => {
  try {
    const data = createLinkSchema.parse(req.body);

    // Validate URL is not malicious
    if (!validator.isURL(data.url, { require_protocol: true })) {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    // Determine short code
    let shortCode = data.customAlias || nanoid(SHORT_CODE_LENGTH);

    if (data.customAlias) {
      if (RESERVED_ALIASES.has(data.customAlias.toLowerCase())) {
        return res.status(400).json({ error: "This alias is reserved" });
      }
      const exists = await prisma.link.findUnique({ where: { shortCode: data.customAlias } });
      if (exists) {
        return res.status(409).json({ error: "Alias already taken" });
      }
      shortCode = data.customAlias;
    }

    const link = await prisma.link.create({
      data: {
        shortCode,
        originalUrl: data.url,
        title: data.title || null,
        userId: req.user?.id || null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        password: data.password || null,
        maxClicks: data.maxClicks || null,
        tags: data.tags?.join(",") || "",
      },
    });

    res.status(201).json({
      id: link.id,
      shortCode: link.shortCode,
      shortUrl: `${BASE_URL}/${link.shortCode}`,
      originalUrl: link.originalUrl,
      title: link.title,
      createdAt: link.createdAt,
      expiresAt: link.expiresAt,
    });
  } catch (err) {
    next(err);
  }
});

// ─── List User's Links ─────────────────────────────
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const search = req.query.search || "";
    const sortBy = req.query.sort || "createdAt";
    const order = req.query.order === "asc" ? "asc" : "desc";

    const where = {
      userId: req.user.id,
      ...(search && {
        OR: [
          { shortCode: { contains: search } },
          { originalUrl: { contains: search } },
          { title: { contains: search } },
        ],
      }),
    };

    const [links, total] = await Promise.all([
      prisma.link.findMany({
        where,
        include: { _count: { select: { clicks: true } } },
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.link.count({ where }),
    ]);

    res.json({
      links: links.map((l) => ({
        ...l,
        tags: l.tags ? l.tags.split(",") : [],
        shortUrl: `${BASE_URL}/${l.shortCode}`,
        totalClicks: l._count.clicks,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── Get Single Link ────────────────────────────────
router.get("/:shortCode", requireAuth, async (req, res, next) => {
  try {
    const link = await prisma.link.findUnique({
      where: { shortCode: req.params.shortCode },
      include: { _count: { select: { clicks: true } } },
    });

    if (!link) {
      return res.status(404).json({ error: "Link not found" });
    }

    if (link.userId && link.userId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({
      ...link,
      tags: link.tags ? link.tags.split(",") : [],
      shortUrl: `${BASE_URL}/${link.shortCode}`,
      totalClicks: link._count.clicks,
    });
  } catch (err) {
    next(err);
  }
});

// ─── Update Link ────────────────────────────────────
router.patch("/:shortCode", requireAuth, async (req, res, next) => {
  try {
    const data = updateLinkSchema.parse(req.body);

    const link = await prisma.link.findUnique({
      where: { shortCode: req.params.shortCode },
    });

    if (!link) return res.status(404).json({ error: "Link not found" });
    if (link.userId !== req.user.id) return res.status(403).json({ error: "Access denied" });

    const updated = await prisma.link.update({
      where: { shortCode: req.params.shortCode },
      data: {
        ...data,
        tags: data.tags ? data.tags.join(",") : link.tags,
      },
    });

    res.json({
      ...updated,
      tags: updated.tags ? updated.tags.split(",") : [],
      shortUrl: `${BASE_URL}/${updated.shortCode}`
    });
  } catch (err) {
    next(err);
  }
});

// ─── Delete Link ────────────────────────────────────
router.delete("/:shortCode", requireAuth, async (req, res, next) => {
  try {
    const link = await prisma.link.findUnique({
      where: { shortCode: req.params.shortCode },
    });

    if (!link) return res.status(404).json({ error: "Link not found" });
    if (link.userId !== req.user.id) return res.status(403).json({ error: "Access denied" });

    await prisma.link.delete({ where: { shortCode: req.params.shortCode } });
    res.json({ message: "Link deleted" });
  } catch (err) {
    next(err);
  }
});

// ─── Generate QR Code ───────────────────────────────
router.get("/:shortCode/qr", async (req, res, next) => {
  try {
    const link = await prisma.link.findUnique({
      where: { shortCode: req.params.shortCode },
    });

    if (!link) return res.status(404).json({ error: "Link not found" });

    const size = Math.min(1000, Math.max(100, parseInt(req.query.size) || 300));
    const format = req.query.format === "svg" ? "svg" : "png";

    const url = `${BASE_URL}/${link.shortCode}`;

    if (format === "svg") {
      const svg = await QRCode.toString(url, { type: "svg", width: size, margin: 2 });
      res.type("image/svg+xml").send(svg);
    } else {
      const buffer = await QRCode.toBuffer(url, { width: size, margin: 2 });
      res.type("image/png").send(buffer);
    }
  } catch (err) {
    next(err);
  }
});

export default router;
