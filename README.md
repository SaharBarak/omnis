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

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL + Auth)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **AI**: [Anthropic Claude](https://www.anthropic.com/) for interpretations
- **Email**: [Resend](https://resend.com/) for transactional emails
- **Visualization**: [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) + [React Flow](https://reactflow.dev/)
- **Deployment**: [Vercel](https://vercel.com/)
- **Testing**: [Vitest](https://vitest.dev/)

## 📋 Prerequisites

- **Node.js** 20+ (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- **npm** or **pnpm** (pnpm recommended for faster installs)
- **Supabase** account and project
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

### 4. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the migrations from `supabase/migrations/` in your Supabase SQL editor
3. Copy your project URL and keys to `.env.local`

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🔐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Your site's public URL (e.g., `https://omnis.app`) |
| `CRON_SECRET` | ✅ | Secret token for securing cron endpoints |
| `RESEND_API_KEY` | ✅ | API key for Resend email service |
| `ANTHROPIC_API_KEY` | ✅ | API key for Claude AI interpretations |
| `AI_MODEL` | ❌ | Claude model to use (default: `claude-3-5-sonnet-20241022`) |
| `AI_MAX_TOKENS` | ❌ | Max tokens for AI responses (default: `1024`) |

### Security Notes

- **Never commit `.env.local`** - it's gitignored for a reason
- `NEXT_PUBLIC_*` variables are exposed to the browser
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only
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
│   │   ├── services/        # Business logic services
│   │   ├── supabase/        # Supabase client utilities
│   │   └── types/           # TypeScript type definitions
│   └── test/                # Test utilities
├── supabase/
│   └── migrations/          # Database migrations
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

The app uses Vercel Cron for scheduled tasks (configured in `vercel.json`):

| Schedule | Endpoint | Description |
|----------|----------|-------------|
| Daily 4am UTC | `/api/cron/daily-predictions` | Generate daily predictions |
| Daily 6am UTC | `/api/cron/daily-kin` | Send daily Kin emails |
| Daily 8am UTC | `/api/cron/send-notifications` | Send push notifications |

Cron endpoints are protected by `CRON_SECRET` - Vercel automatically sends this header.

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add all environment variables in Vercel dashboard
4. Deploy!

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
