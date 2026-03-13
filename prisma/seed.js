// ─────────────────────────────────────────────────
//  snip.link — Database Seeder
// ─────────────────────────────────────────────────

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const REFERRERS = [
  "https://twitter.com",
  "https://linkedin.com",
  "https://reddit.com",
  "https://google.com",
  "https://facebook.com",
  null, // direct
];
const BROWSERS = ["Chrome", "Safari", "Firefox", "Edge", "Opera"];
const OS_LIST = ["Windows", "macOS", "Linux", "iOS", "Android"];
const DEVICES = ["desktop", "mobile", "tablet"];
const COUNTRIES = ["US", "UK", "DE", "FR", "JP", "BR", "IN", "CA", "AU", "NG"];
const CITIES = {
  US: ["New York", "San Francisco", "Los Angeles", "Chicago", "Austin"],
  UK: ["London", "Manchester", "Edinburgh"],
  DE: ["Berlin", "Munich", "Hamburg"],
  FR: ["Paris", "Lyon", "Marseille"],
  JP: ["Tokyo", "Osaka", "Kyoto"],
};

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomClicks(count, linkId) {
  const clicks = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const country = randomFrom(COUNTRIES);
    const ageMs = Math.random() * 30 * 24 * 60 * 60 * 1000; // up to 30 days ago
    clicks.push({
      linkId,
      timestamp: new Date(now - ageMs),
      ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      referer: randomFrom(REFERRERS),
      browser: randomFrom(BROWSERS),
      os: randomFrom(OS_LIST),
      device: randomFrom(DEVICES),
      country,
      city: CITIES[country] ? randomFrom(CITIES[country]) : null,
    });
  }
  return clicks;
}

async function main() {
  console.log("🌱 Seeding database...\n");

  // Clean existing data
  await prisma.click.deleteMany();
  await prisma.link.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.user.deleteMany();

  // Create demo user
  const passwordHash = await bcrypt.hash("demo1234", 12);
  const user = await prisma.user.create({
    data: {
      email: "demo@snip.link",
      passwordHash,
      name: "Demo User",
    },
  });
  console.log(`✓ Created user: ${user.email}`);

  // Create links
  const linksData = [
    { shortCode: "claude-docs", originalUrl: "https://docs.anthropic.com/en/docs/build-with-claude", title: "Claude Documentation", clickCount: 342 },
    { shortCode: "cookbook", originalUrl: "https://github.com/anthropics/anthropic-cookbook", title: "Anthropic Cookbook", clickCount: 189 },
    { shortCode: "claude4", originalUrl: "https://www.anthropic.com/news/claude-4", title: "Claude 4 Announcement", clickCount: 571 },
    { shortCode: "portfolio", originalUrl: "https://example.com/my-portfolio", title: "My Portfolio", clickCount: 97 },
    { shortCode: "yt-talk", originalUrl: "https://youtube.com/watch?v=example", title: "Conference Talk", clickCount: 234 },
    { shortCode: "blog-ai", originalUrl: "https://example.com/blog/ai-trends-2026", title: "AI Trends Blog Post", clickCount: 456 },
  ];

  for (const linkData of linksData) {
    const link = await prisma.link.create({
      data: {
        shortCode: linkData.shortCode,
        originalUrl: linkData.originalUrl,
        title: linkData.title,
        userId: user.id,
        tags: "demo",
      },
    });

    const clicks = randomClicks(linkData.clickCount, link.id);
    await prisma.click.createMany({ data: clicks });
    console.log(`  ✓ ${linkData.shortCode} → ${linkData.clickCount} clicks`);
  }

  console.log("\n✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
