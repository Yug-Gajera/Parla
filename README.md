# Parlova — AI Language Immersion Platform

Parlova is an AI-powered language learning platform that goes beyond vocabulary drills to focus on **real speaking, reading, and listening** in your target language. Practice through immersive AI conversations, read real-world articles, listen to podcasts, watch videos, and track your progress with CEFR-aligned assessments.

> **Supported Languages**: Spanish, French, Chinese, Japanese, Portuguese, German

---

## ✨ Key Features

### 🎙️ AI Conversation Practice
Roleplay real-life scenarios with adaptive AI characters — from ordering coffee to pitching a business deal. Each scenario has **5 unique situations** with twists (wrong orders, salary negotiations, luggage problems) so conversations never repeat. Supports both **text and voice input** with real-time speech-to-text.

### 📖 Guided Learning Pathway
A structured 3-phase beginner pathway for each scenario:
1. **Learn** — Read a bilingual dialogue with vocabulary highlights
2. **Practice** — Build key phrases with interactive exercises
3. **Speak** — Free-form AI conversation using what you learned

### 📚 Immersion Content Hub
- **Articles** — Real-world news and articles fetched via RSS, filtered by your CEFR level
- **Stories** — AI-generated stories tailored to your vocabulary and level
- **Books** — Classic literature with a chapter-by-chapter reader and inline word lookup
- **Podcasts** — Curated podcast shows with an integrated audio player
- **Videos** — Curated video content with a built-in video player

### 🧠 Vocabulary & Spaced Repetition
- SM-2 algorithm for optimized review scheduling
- Tap-to-look-up any word while reading articles, stories, or books
- Batch import words from external sources
- AI-powered word enrichment (pronunciation, examples, part of speech)

### 📊 Assessment & Gamification
- **Adaptive CEFR Diagnostic** — 10-question AI test to determine your level (A1–C2)
- **XP System** — Earn points for conversations, reviews, and daily goals
- **Weekly Leaderboards** — Compete by level band (Beginner / Intermediate / Advanced)
- **Badges** — 9 achievement badges (First Conversation, Century, Perfect Week, etc.)
- **Weekly Challenges** — Rotating 4-week challenge cycle with bonus XP

### 💰 Plan & Monetization
- **Free tier** with weekly limits (3 conversations, 5 articles, 3 stories, 10 word lookups/day)
- **Pro tier** with unlimited access
- Stripe integration for subscriptions and certificate purchases
- CEFR-level certificates with verification codes

---

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Framework** | Next.js 14 (App Router), React 18, TypeScript (strict) |
| **Database & Auth** | Supabase (PostgreSQL, Auth, Storage) |
| **AI** | OpenAI GPT-4o, Anthropic Claude 3.5 Sonnet |
| **UI** | Tailwind CSS, shadcn/ui, Framer Motion |
| **State** | Zustand |
| **Payments** | Stripe |
| **Analytics** | PostHog |
| **Content** | Cheerio (scraping), RSS Parser, Web Speech API |
| **Validation** | Zod, React Hook Form |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- OpenAI API key (required)
- Anthropic API key (optional, for Claude-powered features)

### Setup
```bash
# Clone & install
npm install

# Configure environment
cp .env.local.example .env.local
# Fill in your Supabase, OpenAI, and other keys

# Initialize database (run migrations in Supabase SQL Editor first)
npx tsx scripts/setup.ts

# Start development server
npm run dev
```

---

## 🏗️ Project Structure

```
Parlova/
├── app/
│   ├── (auth)/              # Login, Signup, OAuth callback
│   ├── (dashboard)/         # Home, Practice, Learn, Read, Compete, Profile, Settings
│   ├── (onboarding)/        # Multi-step onboarding + diagnostic
│   └── api/                 # 22 API route groups
│       ├── ai/              # Diagnostic generation & assessment
│       ├── articles/        # Article CRUD, fetch from RSS, seed
│       ├── books/           # Book library, import, chapter processing
│       ├── conversation/    # Start, message (streaming), end, suggest, score
│       ├── first-conversation/ # Guided first conversation flow
│       ├── listen/          # Podcast shows & episodes
│       ├── modules/         # Guided learning module generation & progress
│       ├── stories/         # AI story generation & reading
│       ├── vocabulary/      # CRUD, review, import, enrichment, stats
│       ├── voice/           # Speech-to-text transcription
│       ├── watch/           # Video content & processing
│       ├── words/           # Inline word lookup
│       └── ...              # Auth, leaderboard, profile, settings, stripe, waitlist
├── components/
│   ├── articles/            # ArticleBrowser, ArticleReader
│   ├── books/               # BookLibrary, BookDetail, ChapterReader
│   ├── conversation/        # ConversationWindow, MessageBubble, MicrophoneButton, ScoreCard
│   ├── first-conversation/  # FirstConversationWindow, CelebrationScreen
│   ├── learn/               # LearnView, DialogueReader, PhraseBuilder, MiniChallenge
│   │   └── guided/          # Phase1Learn, Phase2Practice, Phase3Speak, ScenarioComplete
│   ├── listen/              # ListenBrowser, AudioPlayer
│   ├── stories/             # StoryBrowser, StoryReader
│   ├── vocabulary/          # DeckViewer, ReviewSession, AddWordSheet, VocabularyImportModal
│   ├── watch/               # WatchBrowser, VideoPlayer
│   ├── shared/              # WordPopover, PaywallModal, ErrorBoundary
│   └── ui/                  # shadcn/ui base components
├── hooks/                   # 21 custom hooks (useConversation, useArticles, useBooks, etc.)
├── lib/
│   ├── claude/              # Claude AI client & prompt templates
│   ├── openai/              # OpenAI client & prompt templates
│   ├── data/                # Static data (scenarios, badges, challenges, books, videos, podcasts)
│   ├── supabase/            # Supabase client (browser & server)
│   └── utils/               # SM-2 algorithm, level calculations, env config
├── store/                   # Zustand stores
├── supabase/migrations/     # 17 migration files
└── types/                   # TypeScript definitions
```

---

## 🚢 Deployment

Optimized for **Vercel**:
1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables from `.env.local`
4. Run database migrations via Supabase SQL Editor

---

## 📄 License

MIT © Parlova Team
