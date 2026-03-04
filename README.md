# FluentLoop — AI Language Practice

FluentLoop is a premium language learning platform that focuses on **actual speaking and thinking** rather than just vocabulary drills. Learn through context-aware AI conversations, track your progress with CEFR-aligned level tests, and earn verifiable certificates.

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- Supabase account
- OpenAI API Key
- Stripe account (for certificates)

### 2. Setup Environment
```bash
cp .env.local.example .env.local
# Fill in your keys in .env.local
```

### 3. Initialize Database
Go to the Supabase SQL Editor and run the migrations (found in `supabase/migrations` or provided via SQL). Then run the setup script:
```bash
npx tsx scripts/setup.ts
```

### 4. Run Locally
```bash
npm install
npm run dev
```

## 🛠 Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **AI Engine**: OpenAI (GPT-4o)
- **Styling**: Tailwind CSS + Shadcn/ui
- **Payments**: Stripe

## 📈 Key Features
- **AI Conversations**: Real-time scenarios with adaptive feedback.
- **Vocabulary Hub**: Intelligent SRS (SM-2 Algorithm) for word mastery.
- **Weekly Leaderboards**: Competitive XP tracking by language and level.
- **Profile & Stats**: Detailed activity charts and achievement badges.
- **Certifications**: Official CEFR-aligned tests and downloadable certificates.

## 🚢 Deployment
FluentLoop is optimized for **Vercel**.
1. Push your code to GitHub.
2. Connect the repo to Vercel.
3. Add environment variables exactly as in `.env.local`.
4. Run the `setup` script via Vercel's build command or manually once.

## 📄 License
MIT © FluentLoop Team
