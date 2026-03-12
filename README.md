# ⚡ snip.link — URL Shortener & Analytics Dashboard

A production-ready URL shortener with a powerful analytics dashboard. Built with React, Express, PostgreSQL, and Prisma.

---

## Features

- **URL Shortening** — Shorten any URL with optional custom aliases
- **Analytics Dashboard** — Track clicks, referrers, devices, browsers, countries
- **Per-Link Analytics** — Deep-dive into individual link performance
- **QR Code Generation** — Generate QR codes for any shortened link (PNG/SVG)
- **User Authentication** — JWT-based auth with secure httpOnly cookies
- **API Key Support** — Programmatic access via API keys
- **Link Management** — Password-protected links, expiration dates, max click limits, tags
- **Rate Limiting** — Protect against abuse with configurable rate limits
- **Responsive UI** — Dark theme, glassmorphism design, real-time updates

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS, Recharts, Framer Motion |
| Backend    | Express.js, Node.js 20+          |
| Database   | PostgreSQL 16 + Prisma ORM       |
| Auth       | JWT + bcrypt                      |
| Validation | Zod                               |
| Deploy     | Docker, Docker Compose            |

---

## Quick Start

### Prerequisites

- Node.js 18+ (recommended: 20)
- PostgreSQL 16+ (or Docker)
- npm or yarn

### 1. Clone & Install

```bash
git clone https://github.com/your-username/snip-link.git
cd snip-link
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your database URL, JWT secret, etc.
```

### 3. Set Up Database

**Option A — With Docker (recommended):**
```bash
docker compose up -d postgres redis
```

**Option B — Local PostgreSQL:**
Create a database named `sniplink` and update `DATABASE_URL` in `.env`.

Then run migrations and seed:
```bash
npx prisma migrate dev --name init
npm run db:seed
```

### 4. Start Development

```bash
npm run dev
```

This starts both the Express server (port 3001) and Vite dev server (port 5173) concurrently.

Open [http://localhost:5173](http://localhost:5173) and log in with:
- **Email:** `demo@snip.link`
- **Password:** `demo1234`

---

## Production Deployment

### Docker (recommended)

```bash
docker compose up -d --build
```

The app will be available at `http://localhost:3001`.

### Manual

```bash
npm run build          # Build frontend
npx prisma migrate deploy  # Run migrations
npm start              # Start server (serves built frontend)
```

---

## API Reference

All endpoints are prefixed with `/api`. Authentication is via JWT cookie or `Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint           | Description       |
|--------|--------------------|--------------------|
| POST   | `/api/auth/register` | Create account   |
| POST   | `/api/auth/login`    | Sign in          |
| POST   | `/api/auth/logout`   | Sign out         |
| GET    | `/api/auth/me`       | Current user     |

### Links

| Method | Endpoint                  | Description          |
|--------|---------------------------|----------------------|
| POST   | `/api/links`              | Create short link    |
| GET    | `/api/links`              | List user's links    |
| GET    | `/api/links/:shortCode`   | Get link details     |
| PATCH  | `/api/links/:shortCode`   | Update link          |
| DELETE | `/api/links/:shortCode`   | Delete link          |
| GET    | `/api/links/:shortCode/qr`| Generate QR code     |

### Analytics

| Method | Endpoint                         | Description            |
|--------|----------------------------------|------------------------|
| GET    | `/api/analytics/summary`         | Dashboard summary      |
| GET    | `/api/analytics/timeseries`      | Clicks over time       |
| GET    | `/api/analytics/hourly`          | Clicks by hour         |
| GET    | `/api/analytics/breakdown/:field`| Breakdown by field     |
| GET    | `/api/analytics/top-links`       | Top performing links   |
| GET    | `/api/analytics/recent-clicks`   | Recent click feed      |

### Example: Create a Short Link

```bash
curl -X POST http://localhost:3001/api/links \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT" \
  -d '{"url": "https://example.com/very-long-url", "customAlias": "my-link"}'
```

Response:
```json
{
  "id": "clx...",
  "shortCode": "my-link",
  "shortUrl": "http://localhost:3001/my-link",
  "originalUrl": "https://example.com/very-long-url",
  "createdAt": "2026-03-11T10:30:00.000Z"
}
```

---

## Project Structure

```
snip-link/
├── public/               # Static assets
│   └── favicon.svg
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.js           # Seed data
├── server/
│   ├── index.js          # Express entry point
│   ├── config/
│   │   └── db.js         # Prisma client
│   ├── middleware/
│   │   ├── auth.js       # JWT auth + API key auth
│   │   ├── rateLimiter.js
│   │   └── errorHandler.js
│   └── routes/
│       ├── auth.js       # Register, login, logout
│       ├── links.js      # CRUD + QR codes
│       ├── redirect.js   # Short URL redirect + tracking
│       └── analytics.js  # All analytics endpoints
├── src/
│   ├── main.jsx          # React entry
│   ├── App.jsx           # Router + providers
│   ├── components/
│   │   ├── Layout.jsx    # Sidebar layout
│   │   ├── ShortenInput.jsx
│   │   ├── StatCard.jsx
│   │   └── ChartTooltip.jsx
│   ├── hooks/
│   │   └── useAuth.jsx   # Auth context
│   ├── lib/
│   │   └── api.js        # API client
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── LinksPage.jsx
│   │   ├── LinkDetail.jsx
│   │   ├── LoginPage.jsx
│   │   └── RegisterPage.jsx
│   └── styles/
│       └── globals.css   # Tailwind + custom styles
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── nodemon.json
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

---

## Configuration

All configuration is via environment variables. See `.env.example` for all available options.

Key settings:

| Variable            | Default           | Description                   |
|---------------------|-------------------|-------------------------------|
| `DATABASE_URL`      | —                 | PostgreSQL connection string  |
| `JWT_SECRET`        | —                 | Secret for JWT signing        |
| `BASE_URL`          | localhost:3001    | Public URL for short links    |
| `SHORT_CODE_LENGTH` | 6                 | Random code length            |
| `DEFAULT_REDIRECT_STATUS` | 301        | HTTP redirect status code     |

---

## License

MIT
