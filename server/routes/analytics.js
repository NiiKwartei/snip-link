// ─────────────────────────────────────────────────
//  snip.link — Analytics Routes
// ─────────────────────────────────────────────────

import { Router } from "express";
import prisma from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// ─── Dashboard Summary ──────────────────────────────
router.get("/summary", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);

    const [totalLinks, totalClicks, todayClicks, thisWeekClicks, lastWeekClicks] =
      await Promise.all([
        prisma.link.count({ where: { userId } }),
        prisma.click.count({
          where: { link: { userId } },
        }),
        prisma.click.count({
          where: {
            link: { userId },
            timestamp: { gte: todayStart },
          },
        }),
        prisma.click.count({
          where: {
            link: { userId },
            timestamp: { gte: weekAgo },
          },
        }),
        prisma.click.count({
          where: {
            link: { userId },
            timestamp: { gte: twoWeeksAgo, lt: weekAgo },
          },
        }),
      ]);

    const weeklyGrowth =
      lastWeekClicks === 0
        ? thisWeekClicks > 0
          ? 100
          : 0
        : Math.round(((thisWeekClicks - lastWeekClicks) / lastWeekClicks) * 100);

    res.json({
      totalLinks,
      totalClicks,
      todayClicks,
      thisWeekClicks,
      weeklyGrowth,
      avgClicksPerLink: totalLinks > 0 ? Math.round(totalClicks / totalLinks) : 0,
    });
  } catch (err) {
    next(err);
  }
});

// ─── Clicks Over Time ───────────────────────────────
router.get("/timeseries", requireAuth, async (req, res, next) => {
  try {
    const days = Math.min(90, Math.max(1, parseInt(req.query.days) || 7));
    const shortCode = req.query.shortCode; // optional filter
    const userId = req.user.id;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const where = {
      timestamp: { gte: startDate },
      link: {
        userId,
        ...(shortCode && { shortCode }),
      },
    };

    const clicks = await prisma.click.findMany({
      where,
      select: { timestamp: true },
      orderBy: { timestamp: "asc" },
    });

    // Bucket by day
    const buckets = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      buckets[key] = 0;
    }
    clicks.forEach((c) => {
      const key = c.timestamp.toISOString().split("T")[0];
      if (buckets[key] !== undefined) buckets[key]++;
    });

    res.json(
      Object.entries(buckets).map(([date, count]) => ({ date, clicks: count }))
    );
  } catch (err) {
    next(err);
  }
});

// ─── Clicks By Hour ─────────────────────────────────
router.get("/hourly", requireAuth, async (req, res, next) => {
  try {
    const shortCode = req.query.shortCode;
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 7;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const clicks = await prisma.click.findMany({
      where: {
        timestamp: { gte: startDate },
        link: { userId, ...(shortCode && { shortCode }) },
      },
      select: { timestamp: true },
    });

    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, clicks: 0 }));
    clicks.forEach((c) => {
      hours[c.timestamp.getHours()].clicks++;
    });

    res.json(hours);
  } catch (err) {
    next(err);
  }
});

// ─── Breakdown (referrers, devices, browsers, countries, OS) ─
router.get("/breakdown/:field", requireAuth, async (req, res, next) => {
  try {
    const { field } = req.params;
    const allowed = ["referer", "device", "browser", "country", "os", "city"];
    if (!allowed.includes(field)) {
      return res.status(400).json({ error: `Invalid field. Use: ${allowed.join(", ")}` });
    }

    const shortCode = req.query.shortCode;
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);

    const clicks = await prisma.click.findMany({
      where: {
        timestamp: { gte: startDate },
        link: { userId: req.user.id, ...(shortCode && { shortCode }) },
      },
      select: { [field]: true },
    });

    // Aggregate
    const map = {};
    clicks.forEach((c) => {
      const val = c[field] || (field === "referer" ? "Direct" : "Unknown");
      // Clean referrer to source name
      let key = val;
      if (field === "referer" && val !== "Direct") {
        try {
          key = new URL(val).hostname.replace("www.", "");
        } catch {
          key = val;
        }
      }
      map[key] = (map[key] || 0) + 1;
    });

    const data = Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    const total = data.reduce((s, d) => s + d.count, 0);
    res.json(
      data.map((d) => ({
        ...d,
        percentage: total > 0 ? Math.round((d.count / total) * 1000) / 10 : 0,
      }))
    );
  } catch (err) {
    next(err);
  }
});

// ─── Top Links ──────────────────────────────────────
router.get("/top-links", requireAuth, async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const limit = Math.min(20, parseInt(req.query.limit) || 5);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const links = await prisma.link.findMany({
      where: { userId: req.user.id },
      include: {
        _count: {
          select: { clicks: true },
        },
        clicks: {
          where: { timestamp: { gte: startDate } },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const ranked = links
      .map((l) => ({
        shortCode: l.shortCode,
        originalUrl: l.originalUrl,
        title: l.title,
        totalClicks: l._count.clicks,
        periodClicks: l.clicks.length,
      }))
      .sort((a, b) => b.periodClicks - a.periodClicks)
      .slice(0, limit);

    res.json(ranked);
  } catch (err) {
    next(err);
  }
});

// ─── Recent Clicks (live feed) ──────────────────────
router.get("/recent-clicks", requireAuth, async (req, res, next) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const shortCode = req.query.shortCode;

    const clicks = await prisma.click.findMany({
      where: {
        link: { userId: req.user.id, ...(shortCode && { shortCode }) },
      },
      include: {
        link: { select: { shortCode: true, originalUrl: true } },
      },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    res.json(
      clicks.map((c) => ({
        id: c.id,
        shortCode: c.link.shortCode,
        timestamp: c.timestamp,
        browser: c.browser,
        os: c.os,
        device: c.device,
        country: c.country,
        referer: c.referer,
      }))
    );
  } catch (err) {
    next(err);
  }
});

export default router;
