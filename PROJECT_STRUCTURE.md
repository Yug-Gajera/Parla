# Parlova Project Structure

This document provides a comprehensive overview of the Parlova codebase structure.

## Root Directory

- `app/` - Next.js App Router (Pages, API Routes, Layouts)
- `components/` - React components (UI kits, Feature-specific components)
- `hooks/` - Custom React hooks
- `lib/` - Logic, utilities, external API clients (Claude, OpenAI, Supabase, Stripe)
- `public/` - Static assets
- `scripts/` - Script utilities
- `store/` - Global state management (Zustand)
- `supabase/` - Database migrations and schema
- `package.json` - Project dependencies and scripts
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration

---

## Detailed Structure

### `app/` (Next.js App Router)
The core of the application's routing and server-side logic.

```text
app/
├── (auth)/             # Authentication routes
│   ├── login/
│   └── signup/
├── (dashboard)/        # Main application dashboard
│   ├── home/
│   ├── learn/
│   ├── practice/
│   ├── read/
│   ├── compete/
│   ├── profile/
│   ├── settings/
│   └── privacy/
├── (onboarding)/       # User onboarding flow
│   └── onboarding/
├── api/                # API Routes (Backend logic)
│   ├── ai/             # AI processing (Diagnostic, assessments)
│   ├── articles/       # Article management
│   ├── conversation/   # Real-time practice sessions
│   ├── modules/        # Learning pathways
│   ├── onboarding/     # Onboarding logic
│   ├── profile/        # User profile updates
│   ├── vocabulary/     # Lexicon management
│   ├── watch/          # Video processing
│   ├── voice/          # Transcription services
│   ├── waitlist/       # Language waitlist
│   └── stripe/         # Payments
├── fonts/              # Custom fonts
├── landing-client.tsx  # Main landing page client component
├── page.tsx            # Root landing page entry
├── layout.tsx          # Main root layout
└── globals.css         # Global CSS styles
```

### `components/`
Modular React components separated by feature area.

```text
components/
├── ui/                 # Shared UI components (Shadcn/ui based)
├── articles/           # Article browsing and reading
├── auth/               # Login and Signup forms
├── books/              # Graded reader and classic books
├── compete/            # Leaderboards and challenges
├── conversation/       # Practice interface, scorecards, messaging
├── dashboard/          # Dashboard widgets (Stats, QuickActions, Activity)
├── illustrations/      # Custom SVG doodle figures
├── learn/              # Lessons, phrase builders, and challenges
├── listen/             # Audio players and podcast browsers
├── onboarding/         # Onboarding flow steps
├── profile/            # User profile and settings views
├── read/               # Immersion library views
├── shared/             # Shared logic components (Tooltips, Badges, Loaders)
├── stories/            # AI story reader and browser
├── vocabulary/         # Deck viewer and review sessions
└── watch/              # Video browser and players
```

### `lib/`
Heavy lifting logic, data processing, and API integrations.

```text
lib/
├── claude/             # Anthropic Claude API integration
├── openai/             # OpenAI API integration
├── supabase/           # Supabase client/server/middleware config
├── stripe/             # Payment processing logic
├── articles/           # RSS fetching and article processing
├── books/              # Gutenberg client and graded reader generation
├── data/               # Static data (Scenarios, Scopes, Topics, RSS feeds)
├── listen/             # Podcast processing
├── stories/            # AI story generation logic
├── voice/              # Web Audio recording and transcription
├── watch/              # Video processing
└── utils/              # General helper functions (Vocabulary, Leveling, CN)
```

### `supabase/`
Database configuration and migrations.

```text
supabase/
└── migrations/         # SQL migration files
    ├── 001_initial_schema.sql
    ├── 002_beginner_pathway.sql
    ├── 003_scenario_variations.sql
    ├── 004_articles.sql
    ├── 005_stories.sql
    ├── 006_word_lookup.sql
    ├── 007_books.sql
    ├── 008_watch_listen.sql
    ├── 009_voice_conversations.sql
    └── 010_language_waitlist.sql
```

### `store/` & `hooks/`
Frontend state and reactive logic.

```text
store/
└── onboarding.ts       # Onboarding state management (Zustand)

hooks/                  # Custom hooks for features
├── useUser.ts
├── useArticles.ts
├── useConversation.ts
├── useVocabulary.ts
└── [many more...]
```
