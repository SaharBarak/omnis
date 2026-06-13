# Omnis

**Discover Your Cosmic Blueprint**

Omnis is a symbolic mapping platform that integrates multiple ancient and modern wisdom systems to provide personalized insights. Calculate and explore your Dreamspell Galactic Signature, Tzolkin Day Sign, Human Design Bodygraph, Astrology Natal Chart, and Hebrew Gematria analysis—all in one unified experience.

## ✨ Features

- **Dreamspell / Galactic Signature** - Calculate your Kin, Wavespell, and Oracle
- **Tzolkin / Mayan Calendar** - Traditional day signs and Long Count dates
- **Human Design** - Full Bodygraph with Type, Strategy, Authority, and Profile
- **Astrology** - Natal chart with planetary positions and aspects
- **Hebrew Gematria** - Numerical analysis of names and words
- **Relationship Compatibility** - Compare charts between people
- **Daily Predictions** - Personalized cosmic forecasts
- **Graph Visualization** - Interactive relationship mapping

## 🛠 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) (Mongoose ODM + Atlas Vector Search)
- **Auth**: [Better Auth](https://www.better-auth.com/) (MongoDB adapter, Google/Apple OAuth)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **AI**: [Google Gemini](https://ai.google.dev/) for interpretations
- **Billing**: [Paddle](https://www.paddle.com/) (merchant of record)
- **Email**: [Resend](https://resend.com/) for transactional emails
- **Visualization**: [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) + [React Flow](https://reactflow.dev/)
- **Deployment**: [Cloudflare Workers](https://workers.cloudflare.com/) via [OpenNext](https://opennext.js.org/cloudflare)
- **Testing**: [Vitest](https://vitest.dev/)

## 📋 Prerequisites

- **Node.js** 20+ (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- **npm** or **pnpm** (pnpm recommended for faster installs)
- **MongoDB Atlas** cluster (with Atlas Vector Search enabled)
- **Git** for version control

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/SaharBarak/Omnis.git
cd Omnis
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Set Up Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

See [Environment Variables](#-environment-variables) for details on each variable.

### 4. Set Up MongoDB Atlas

1. Create a cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Enable **Atlas Vector Search** (required for knowledge search)
3. Copy your connection string into `MONGODB_URI` in `.env.local`
4. Generate a Better Auth secret (`openssl rand -base64 32`) for `BETTER_AUTH_SECRET`

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🔐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string (includes database name) |
| `BETTER_AUTH_SECRET` | ✅ | Server secret for signing sessions (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | ✅ | Public base URL of the app (used for OAuth callbacks) |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth client secret |
| `APPLE_CLIENT_ID` | ❌ | Apple OAuth client ID (optional) |
| `APPLE_CLIENT_SECRET` | ❌ | Apple OAuth client secret (optional) |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Your site's public URL (e.g., `https://omnis.app`) |
| `NEXT_PUBLIC_CF_BEACON_TOKEN` | ❌ | Cloudflare Web Analytics beacon token |
| `CRON_SECRET` | ✅ | Secret token for securing cron endpoints |
| `RESEND_API_KEY` | ✅ | API key for Resend email service |
| `GEMINI_API_KEY` | ✅ | API key for Gemini AI interpretations |
| `GEMINI_MODEL` | ❌ | Gemini model to use (default: `gemini-2.5-flash`) |
| `AI_MAX_TOKENS` | ❌ | Max tokens for AI responses (default: `1000`) |
| `PADDLE_ENV` | ❌ | Paddle environment: `sandbox` (default) or `production` |
| `PADDLE_API_KEY` | ✅* | Paddle API key (server-only). *Required for paid features |
| `PADDLE_WEBHOOK_SECRET` | ✅* | Paddle webhook signing secret |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | ❌ | Client-side token for Paddle.js overlay |
| `PADDLE_PRICE_COMPLETE` | ✅* | Paddle price ID for the Complete plan |
| `PADDLE_PRICE_PRACTITIONER` | ✅* | Paddle price ID for the Practitioner plan |

### Security Notes

- **Never commit `.env.local`** - it's gitignored for a reason
- `NEXT_PUBLIC_*` variables are exposed to the browser
- Keep `MONGODB_URI`, `BETTER_AUTH_SECRET`, `PADDLE_API_KEY`, and `GEMINI_API_KEY` server-side only
- Generate a strong random string for `CRON_SECRET`

## 📁 Project Structure

```
omnis/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   │   ├── ai/           # AI interpretation endpoints
│   │   │   ├── cron/         # Scheduled job endpoints
│   │   │   ├── newsletter/   # Newsletter subscription
│   │   │   ├── notifications/# Push notification settings
│   │   │   └── predictions/  # Daily/weekly predictions
│   │   ├── app/              # Authenticated app pages
│   │   │   ├── boards/       # Vision boards
│   │   │   ├── cards/        # Card deck views
│   │   │   ├── graph/        # Relationship graph
│   │   │   ├── groups/       # Group analysis
│   │   │   ├── people/       # People management
│   │   │   ├── predictions/  # Prediction timeline
│   │   │   └── settings/     # User settings
│   │   ├── calculate/        # Public calculator
│   │   ├── learn/            # Educational content
│   │   └── today/            # Daily energy page
│   ├── components/           # React components
│   │   ├── canvas/          # 3D canvas components
│   │   ├── cards/           # Card display components
│   │   ├── dashboard/       # Dashboard widgets
│   │   ├── landing/         # Landing page sections
│   │   ├── predictions/     # Prediction UI
│   │   └── ui/              # Shared UI primitives
│   ├── lib/
│   │   ├── calculations/    # Core calculation engines
│   │   │   ├── astrology.ts
│   │   │   ├── dreamspell.ts
│   │   │   ├── gematria.ts
│   │   │   ├── human-design.ts
│   │   │   └── tzolkin.ts
│   │   ├── data/            # Static data (glyphs, gates, etc.)
│   │   ├── db/              # Mongoose connection, models, repositories
│   │   ├── services/        # Business logic services
│   │   └── types/           # TypeScript type definitions
│   └── test/                # Test utilities
├── workers/
│   └── cron/                # Cloudflare Cron Triggers handler
├── public/                  # Static assets
└── specs/                   # Feature specifications
```

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run deploy` | Build (OpenNext) and deploy to Cloudflare Workers |
| `npm run deploy:cron` | Deploy the Cloudflare Cron Triggers worker |

## 🧪 Testing

Tests are written with Vitest and Testing Library.

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test -- --coverage
```

Test files follow the pattern `*.test.ts` and are colocated with the code they test.

## 🔄 Cron Jobs

The app uses Cloudflare Cron Triggers for scheduled tasks (handler in `workers/cron`):

| Schedule | Endpoint | Description |
|----------|----------|-------------|
| Daily 4am UTC | `/api/cron/daily-predictions` | Generate daily predictions |
| Daily 6am UTC | `/api/cron/daily-kin` | Send daily Kin emails |
| Daily 8am UTC | `/api/cron/send-notifications` | Send push notifications |

Cron endpoints are protected by `CRON_SECRET` - the Cron Triggers worker sends this header.

## 🚢 Deployment

### Cloudflare Workers (Recommended)

The app deploys to Cloudflare Workers via the [OpenNext](https://opennext.js.org/cloudflare) adapter (`@opennextjs/cloudflare`).

1. Push your code to GitHub
2. Configure secrets/vars in `wrangler` (or the Cloudflare dashboard) — `MONGODB_URI`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID/SECRET`, `PADDLE_*`, `GEMINI_API_KEY`, `CRON_SECRET`
3. Deploy the app: `npm run deploy`
4. Deploy the Cron Triggers worker: `npm run deploy:cron`

### Docker

A Dockerfile is included for containerized deployments:

```bash
docker build -t omnis .
docker run -p 3000:3000 --env-file .env.local omnis
```

### Manual Build

```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 🔗 Links

- **Live App**: [https://omnis.app](https://omnis.app)
- **Issues**: [GitHub Issues](https://github.com/SaharBarak/Omnis/issues)

---

Built with 💫 by the Omnis team
