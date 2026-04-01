# Parlova — Feature Documentation

A comprehensive AI-powered language learning platform built with Next.js 14, Supabase, and OpenAI GPT-4o + Anthropic Claude.

---

## Overview

Parlova helps users learn languages (Spanish, French, Chinese, Japanese, Portuguese, German) through AI conversation practice, immersive content consumption, spaced repetition vocabulary training, guided learning pathways, and CEFR-based level progression (A1–C2).

---

## Features

### 1. Authentication

**Purpose:** User registration, login, and session management.

**Key Files:**
- `app/(auth)/login/page.tsx` — Login page
- `app/(auth)/signup/page.tsx` — Signup page
- `components/auth/LoginForm.tsx` — Login form
- `components/auth/SignupForm.tsx` — Signup form
- `app/api/auth/callback/route.ts` — OAuth callback handler
- `middleware.ts` — Route protection

**Functionality:**
- Email/password authentication via Supabase Auth
- Google OAuth sign-in
- Password reset
- Session management with protected routes
- Auto-creation of user profile on first sign-in (via database trigger)

---

### 2. Onboarding Flow

**Purpose:** New user setup and language proficiency assessment.

**Key Files:**
- `app/(onboarding)/onboarding/page.tsx` — Onboarding page
- `components/onboarding/OnboardingFlow.tsx` — Main flow container
- `components/onboarding/StepLanguage.tsx` — Language selection
- `components/onboarding/StepGoal.tsx` — Learning goal selection
- `components/onboarding/StepTime.tsx` — Daily time commitment
- `components/onboarding/StepLevel.tsx` — Self-reported level
- `components/onboarding/StepDiagnostic.tsx` — AI diagnostic test
- `components/onboarding/StepResult.tsx` — Results presentation
- `store/onboarding.ts` — Zustand state management

**API Endpoints:**
- `POST /api/ai/diagnostic` — Generate 10 adaptive questions
- `POST /api/ai/diagnostic/assess` — Assess level from answers
- `POST /api/onboarding` — Save onboarding results

**Flow:**
1. Select target language
2. Choose learning goal
3. Set daily time commitment
4. Self-report current level
5. Complete AI-powered diagnostic test (10 questions)
6. View results and recommended CEFR level

---

### 3. User Dashboard

**Purpose:** Central hub showing progress, stats, and quick actions.

**Key Files:**
- `app/(dashboard)/home/page.tsx` — Home page
- `components/dashboard/DashboardView.tsx` — Main dashboard view
- `components/dashboard/Header.tsx` — Header with user info
- `components/dashboard/GoalProgress.tsx` — Daily goal progress ring
- `components/dashboard/QuickActions.tsx` — Quick action cards
- `components/dashboard/WeeklyStats.tsx` — Weekly statistics
- `components/dashboard/LevelProgress.tsx` — CEFR level progress bar
- `components/dashboard/RecentActivity.tsx` — Recent sessions feed

**Features:**
- Daily goal tracking with visual progress ring
- Weekly statistics (conversations, words learned, minutes studied, streak)
- Level progress toward next CEFR level
- Recent activity feed
- Quick action cards linking to Practice, Learn, Read, etc.

---

### 4. AI Conversation Practice (Core Feature)

**Purpose:** Roleplay conversations with AI characters in real-world scenarios.

**Key Files:**
- `app/(dashboard)/practice/page.tsx` — Practice page
- `components/conversation/PracticeView.tsx` — Scenario selection UI
- `components/conversation/ConversationWindow.tsx` — Chat interface
- `components/conversation/MessageBubble.tsx` — Message display
- `components/conversation/MicrophoneButton.tsx` — Voice input button
- `components/conversation/SpeakReplyModal.tsx` — Speech-to-text reply modal
- `components/conversation/SuggestedReplies.tsx` — AI-generated reply suggestions
- `components/conversation/ScoreCard.tsx` — Post-session scoring
- `hooks/useConversation.ts` — Conversation state management
- `hooks/useMicrophone.ts` — Microphone/speech recording
- `lib/data/scenarios.ts` — Scenario definitions (8 scenarios, 40 situations)

**API Endpoints:**
- `POST /api/conversation/start` — Start new conversation session
- `POST /api/conversation/message` — Send message (streaming response)
- `POST /api/conversation/end` — End session and get scores
- `POST /api/conversation/suggest` — Generate suggested replies
- `POST /api/conversation/score-attempt` — Score a speaking attempt

**Available Scenarios (8 scenarios × 5 situations each = 40 unique conversations):**

| Scenario | Level | Character | Setting |
|----------|-------|-----------|---------|
| Café Order | A1 | Carlos (barista) | Madrid café |
| Market Negotiation | A2 | Elena (vendor) | Barcelona market |
| Apartment Problem | B1 | Miguel (superintendent) | Phone call |
| Job Interview | B1 | Sofía (HR Manager) | Mexico City office |
| Doctor Visit | B2 | Dr. Ramírez (physician) | Medical clinic |
| Neighbor Dispute | B2 | Roberto (neighbor) | Apartment hallway |
| Travel Delay | C1 | Ana (attendant) | Train station |
| Business Pitch | C1 | Director Herrera (executive) | Bogotá meeting room |

Each scenario has **5 situation variations** with unique twists (e.g., wrong order, salary negotiation, luggage on wrong train), making conversations unpredictable and replayable.

**Conversation Features:**
- Streaming AI responses using OpenAI GPT-4o
- Level-locked scenarios (unlocks based on CEFR level)
- Voice input via microphone with speech-to-text
- AI-suggested reply options
- Post-conversation scoring:
  - Grammar (0–100)
  - Vocabulary (0–100)
  - Naturalness (0–100)
  - Goal completion (0–100)
- Grammar error feedback and vocabulary suggestions

---

### 5. First Conversation Flow

**Purpose:** Guided first-time conversation experience for new users.

**Key Files:**
- `components/first-conversation/FirstConversationClient.tsx` — Client wrapper
- `components/first-conversation/FirstConversationWindow.tsx` — Conversation interface
- `components/first-conversation/CelebrationScreen.tsx` — Completion celebration

**API Endpoints:**
- `POST /api/first-conversation/start` — Start first conversation
- `POST /api/first-conversation/message` — Send message
- `POST /api/first-conversation/complete` — Complete first conversation
- `POST /api/first-conversation/skip` — Skip first conversation

---

### 6. Guided Learning Pathway

**Purpose:** Structured beginner modules with 3-phase learning for each scenario.

**Key Files:**
- `components/learn/LearnView.tsx` — Main learning view
- `components/learn/LearnTab.tsx` — Learn tab layout
- `components/learn/GuidedScenarioList.tsx` — Guided scenario selection
- `components/learn/ModuleView.tsx` — Module container
- `components/learn/DialogueReader.tsx` — Bilingual dialogue with vocab highlights
- `components/learn/PhraseBuilder.tsx` — Interactive phrase learning
- `components/learn/MiniChallenge.tsx` — Quiz challenges
- `components/learn/guided/Phase1Learn.tsx` — Phase 1: Learn vocabulary
- `components/learn/guided/Phase2Practice.tsx` — Phase 2: Practice exercises
- `components/learn/guided/Phase3Speak.tsx` — Phase 3: Free conversation
- `components/learn/guided/ScenarioComplete.tsx` — Completion screen
- `hooks/useModules.ts` — Module state management
- `lib/data/guided_scenarios.ts` — Guided scenario definitions

**API Endpoints:**
- `POST /api/modules/generate` — Generate learning module content
- `GET/POST /api/modules/progress` — Track module progress

**3-Phase Structure:**
1. **Learn** — Read a bilingual dialogue, tap words for translations and notes
2. **Practice** — Build key phrases, fill-in-the-blank, choose correct responses
3. **Speak** — Free-form AI conversation using the learned vocabulary

**Progress Tracking per Module:**
- Dialogue completed (with score)
- Phrases learned count
- Challenge completed (with score)
- Scenario unlocked status

---

### 7. Vocabulary & Spaced Repetition

**Purpose:** Learn and review vocabulary using the SM-2 algorithm.

**Key Files:**
- `app/(dashboard)/learn/page.tsx` — Learn page
- `components/vocabulary/DeckViewer.tsx` — Vocabulary deck browser
- `components/vocabulary/ReviewSession.tsx` — Flashcard review session
- `components/vocabulary/AddWordSheet.tsx` — Add word manually
- `components/vocabulary/WordDetailSheet.tsx` — Word details panel
- `components/vocabulary/VocabularyImportModal.tsx` — Batch import from external sources
- `hooks/useVocabulary.ts` — Vocabulary state management
- `lib/utils/vocabulary.ts` — SM-2 algorithm implementation

**API Endpoints:**
- `GET /api/vocabulary` — List user's vocabulary (paginated, filterable)
- `POST /api/vocabulary` — Add word to deck
- `DELETE /api/vocabulary` — Remove word from deck
- `GET /api/vocabulary/stats` — Get vocabulary statistics
- `GET /api/vocabulary/review` — Get words due for review
- `POST /api/vocabulary/review` — Submit review result
- `POST /api/vocabulary/enrich` — AI-enrich word data (pronunciation, examples)
- `POST /api/vocabulary/import-batch` — Bulk import words
- `POST /api/vocabulary/seed` — Seed vocabulary for a level
- `GET /api/vocabulary/words` — Search word database

**Word Status Levels:**
- `new` — Newly added
- `learning` — Being studied
- `familiar` — Mostly known
- `mastered` — Fully learned

**Features:**
- SM-2 spaced repetition (ease factor, interval, next review date)
- Due-date-based review scheduling
- Search and filter by status
- Batch import from external sources
- AI enrichment (pronunciation, part of speech, example sentences)
- Inline word lookup from articles, stories, and books
- Progress statistics

---

### 8. Reading — Articles

**Purpose:** Read real-world articles matched to the user's CEFR level.

**Key Files:**
- `app/(dashboard)/read/page.tsx` — Read page
- `components/articles/ArticleBrowser.tsx` — Browse articles by level and topic
- `components/articles/ArticleReader.tsx` — Full article reader with word lookup
- `hooks/useArticles.ts` — Article data fetching
- `hooks/useArticleReader.ts` — Reader state management
- `lib/data/rss-feeds.ts` — RSS feed sources

**API Endpoints:**
- `GET /api/articles` — List articles (paginated, filtered by level and topic)
- `GET /api/articles/[id]` — Single article with full content
- `POST /api/articles/fetch` — Fetch and process new articles from RSS
- `POST /api/articles/seed` — Seed articles for a language

**Features:**
- Articles fetched from real RSS feeds and processed with Cheerio
- CEFR-level filtering (shows user's level + one below)
- Topic filtering
- Read time and word count estimates
- User progress tracking (started, completed, comprehension score)
- Inline word lookup via `WordPopover` component

---

### 9. Reading — AI Stories

**Purpose:** AI-generated stories tailored to user's level and interests.

**Key Files:**
- `components/stories/StoryBrowser.tsx` — Browse and generate stories
- `components/stories/StoryReader.tsx` — Story reader with word lookup
- `hooks/useStories.ts` — Story data fetching
- `hooks/useStoryReader.ts` — Reader state management
- `lib/data/story-topics.ts` — Available story topics

**API Endpoints:**
- `GET /api/stories` — List user's stories
- `GET /api/stories/[id]` — Single story with full content
- `POST /api/stories/generate` — Generate a new AI story
- `POST /api/stories/seed` — Seed stories for a language

**Features:**
- On-demand AI story generation by topic
- CEFR-level appropriate vocabulary and grammar
- Inline word lookup while reading
- User progress tracking

---

### 10. Reading — Books

**Purpose:** Read classic literature chapter by chapter with language learning tools.

**Key Files:**
- `components/books/BookLibrary.tsx` — Book library browser
- `components/books/BookDetail.tsx` — Book detail and chapter list
- `components/books/ChapterReader.tsx` — Full chapter reader with word lookup
- `hooks/useBooks.ts` — Book data fetching
- `hooks/useChapterReader.ts` — Chapter reader state management
- `lib/data/classic-books.ts` — Classic book definitions

**API Endpoints:**
- `GET /api/books` — List available books
- `GET /api/books/[id]` — Book detail with chapters
- `POST /api/books/import` — Import a book
- `POST /api/books/process` — Process book into chapters

**Features:**
- Classic literature catalog
- Chapter-by-chapter reading
- Inline word lookup via `WordPopover`
- Reading progress tracking

---

### 11. Listening — Podcasts

**Purpose:** Listen to podcast episodes for auditory comprehension.

**Key Files:**
- `components/listen/ListenBrowser.tsx` — Browse podcast shows and episodes
- `components/listen/AudioPlayer.tsx` — Full-featured audio player
- `hooks/useListen.ts` — Podcast data fetching
- `hooks/useAudioPlayer.ts` — Audio player state management
- `lib/data/podcast-shows.ts` — Curated podcast show definitions

**API Endpoints:**
- `GET /api/listen/shows` — List podcast shows
- `GET /api/listen/episodes` — List episodes for a show
- `GET /api/listen/[id]` — Single episode detail
- `POST /api/listen/fetch` — Fetch new episodes from feed

**Features:**
- Curated podcast show catalog
- Episode browsing by show
- Built-in audio player with playback controls

---

### 12. Watching — Videos

**Purpose:** Watch curated video content for visual + auditory comprehension.

**Key Files:**
- `components/watch/WatchBrowser.tsx` — Browse videos
- `components/watch/VideoPlayer.tsx` — Full-featured video player
- `hooks/useWatch.ts` — Video data fetching
- `hooks/useVideoPlayer.ts` — Video player state management
- `lib/data/curated-videos.ts` — Curated video definitions

**API Endpoints:**
- `GET /api/watch` — List available videos
- `GET /api/watch/[id]` — Single video detail
- `POST /api/watch/process` — Process new video content

**Features:**
- Curated video catalog
- Built-in video player
- Level-appropriate content

---

### 13. Word Lookup

**Purpose:** Inline word lookup across all reading surfaces.

**Key Files:**
- `components/shared/WordPopover.tsx` — Popover with translation, pronunciation, and "add to deck" action

**API Endpoints:**
- `POST /api/words/lookup` — Look up a word (translation, pronunciation, part of speech)

**Features:**
- Tap any word in articles, stories, or books to see translation
- One-tap add to vocabulary deck
- Shows pronunciation and part of speech
- Rate-limited for free tier (10 lookups/day)

---

### 14. Voice Input

**Purpose:** Speech-to-text for voice-based conversation replies.

**Key Files:**
- `components/conversation/MicrophoneButton.tsx` — Mic button on conversation UI
- `components/conversation/SpeakReplyModal.tsx` — Modal for recording and transcribing speech
- `hooks/useMicrophone.ts` — Microphone state and recording
- `lib/voice/` — Voice processing utilities
- `lib/webSpeech.ts` — Web Speech API integration

**API Endpoints:**
- `POST /api/voice/transcribe` — Transcribe audio to text

---

### 15. Leaderboard & Competition

**Purpose:** Competitive weekly rankings by level band.

**Key Files:**
- `app/(dashboard)/compete/page.tsx` — Compete page
- `components/compete/CompeteView.tsx` — Main compete view
- `components/compete/LeaderboardTab.tsx` — Leaderboard tab
- `components/compete/ChallengesTab.tsx` — Challenges tab
- `components/compete/MyStatsTab.tsx` — Personal stats tab
- `hooks/useLeaderboard.ts` — Leaderboard data fetching
- `lib/data/challenges.ts` — Challenge definitions

**API Endpoints:**
- `GET /api/leaderboard` — Fetch leaderboard entries
- `POST /api/leaderboard/update` — Update user's leaderboard score

**Level Bands:**
- Beginner: A1–A2
- Intermediate: B1–B2
- Advanced: C1–C2

**Features:**
- Weekly scores and rankings
- Navigation between past weeks
- Auto-refresh every 60 seconds

---

### 16. Weekly Challenges

**Purpose:** Rotating weekly goals for bonus XP.

**Key Files:**
- `lib/data/challenges.ts` — Challenge templates

**Challenge Types (4-week cycle):**

| Challenge | Requirement | Cycle Week |
|-----------|-------------|------------|
| Conversation Week | Complete 5 conversations | Week 1 |
| Vocabulary Builder | Learn 30 new words | Week 2 |
| Perfect Score | Score 85+ in conversation | Week 3 |
| Consistency | Maintain 7-day streak | Week 4 |

---

### 17. Badges & Achievements

**Purpose:** Reward user milestones.

**Key Files:**
- `lib/data/badges.ts` — Badge definitions and computation logic

**Available Badges (9):**

| Badge | Requirement |
|-------|-------------|
| First Conversation | Complete 1 conversation |
| Conversationalist | 5 conversations in a week |
| Word Collector | Learn 30 words in a week |
| High Achiever | Score 85+ in conversation |
| Iron Discipline | 7-day practice streak |
| Week Warrior | Hit daily goal 5 days/week |
| Perfect Week | Hit daily goal all 7 days |
| Century | Complete 100 conversations |
| Polyglot Preview | (Coming soon) |

---

### 18. User Profile

**Purpose:** View and manage personal learning stats.

**Key Files:**
- `app/(dashboard)/profile/page.tsx` — Profile page
- `components/profile/ProfileView.tsx` — Profile display
- `components/profile/EditProfileSheet.tsx` — Edit profile sheet
- `hooks/useProfile.ts` — Profile data fetching

**API Endpoints:**
- `POST /api/profile/update` — Update profile data
- `GET /api/profile/data` — Fetch profile data

**Features:**
- Total hours studied
- Conversation count
- Vocabulary known
- Streak days
- Earned badges
- Activity calendar (past year)
- Level progress visualization

---

### 19. Settings & Preferences

**Purpose:** Configure user preferences.

**Key Files:**
- `app/(dashboard)/settings/page.tsx` — Settings page
- `app/api/settings/update/route.ts` — Settings update API

**Features:**
- Daily goal selection (10, 20, 30, 45 minutes)
- Notification toggle (coming soon)
- Preferred content types (News, Cooking, Travel, Sports, Business, Entertainment)
- Password change
- Account deletion
- Data export

---

### 20. Progress Tracking & XP System

**Purpose:** Track learning progress and motivate users.

**Key Files:**
- `lib/utils/level.ts` — Level calculations
- `app/api/progress/` — Progress API routes

**XP Earnings:**

| Activity | XP Earned |
|----------|-----------|
| Conversation base | 50 XP |
| Score multiplier | 0.5× score |
| Goal completion bonus | 75 XP |
| Vocabulary review | 20 XP per 10 cards |
| Daily goal met | 100 XP |
| 7-day streak bonus | 50 XP |

**Level Progression:**
- 100 points per CEFR level
- Estimated days to next level
- Level bands for competition grouping

---

### 21. Plan Limits & Monetization

**Purpose:** Freemium model with usage tracking and plan enforcement.

**Key Files:**
- `lib/planLimits.ts` — Plan limits, usage checking, and recording
- `hooks/usePlanLimits.ts` — Client-side plan limit state
- `components/shared/PaywallModal.tsx` — Upgrade prompt modal
- `app/api/stripe/` — Stripe webhook handlers

**Free Tier Limits:**

| Metric | Limit |
|--------|-------|
| Conversations | 3 per week |
| Articles | 5 per week |
| Stories | 3 per week |
| Word lookups | 10 per day |

**Plans:**
- `free` — Limited access (see above)
- `pro` — Unlimited standard features
- `pro_plus` — Unlimited everything

---

## Technical Architecture

### Database Tables (Supabase/PostgreSQL)

| Table | Purpose |
|-------|---------|
| `users` | User profiles (plan, beta status, guided progress) |
| `user_settings` | User preferences |
| `languages` | Available languages |
| `user_languages` | User–language relationships with CEFR progress |
| `vocabulary_words` | Word database |
| `user_vocabulary` | User's vocabulary with SRS data |
| `conversation_sessions` | Conversation history and scores |
| `level_tests` | Assessment results |
| `certificates` | Level certificates |
| `leaderboard_entries` | Weekly competition data |
| `study_sessions` | XP/learning session logs |
| `articles` | Processed articles |
| `user_article_progress` | Article read progress |
| `stories` | AI-generated stories |
| `books` | Book catalog |
| `book_chapters` | Individual chapters |
| `shows` | Podcast shows |
| `episodes` | Podcast episodes |
| `videos` | Video content |
| `scenario_modules` | Guided learning module content |
| `user_module_progress` | Module completion tracking |
| `speak_attempts` | Voice speaking attempts |
| `usage_tracking` | Plan limit usage events |

### Database Migrations (17 files)

| Migration | Purpose |
|-----------|---------|
| `001_initial_schema` | Core tables (users, languages, vocabulary, sessions) |
| `002_beginner_pathway` | Guided learning tables |
| `003_scenario_variations` | Situation history tracking |
| `004_articles` | Article and progress tables |
| `005_stories` | Story tables |
| `006_word_lookup` | Word lookup caching |
| `007_books` | Book and chapter tables |
| `008_watch_listen` | Video and podcast tables |
| `009_voice_conversations` | Voice conversation support |
| `010_language_waitlist` | Language waitlist |
| `011_vocabulary_import` | Vocabulary batch import |
| `012_dashboard_vocab_import` | Dashboard import integration |
| `013_add_plan_enforcement` | Usage tracking and plan limits |
| `guided_learning` | Guided learning content |
| `20260321_*` | First conversation fields, speak attempts, auth triggers |

### Supported Languages

| Code | Language |
|------|----------|
| `es` | Spanish |
| `fr` | French |
| `zh` | Chinese |
| `ja` | Japanese |
| `pt` | Portuguese |
| `de` | German |

---

## Technology Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript (strict mode) |
| **UI** | Tailwind CSS, shadcn/ui, Framer Motion |
| **State Management** | Zustand, React hooks |
| **Backend** | Next.js API Routes |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth (email/password, Google OAuth) |
| **AI** | OpenAI GPT-4o, Anthropic Claude 3.5 Sonnet |
| **Voice** | Web Speech API, OpenAI Whisper (transcription) |
| **Payments** | Stripe |
| **Analytics** | PostHog |
| **Content Processing** | Cheerio (HTML scraping), RSS Parser |
| **Forms** | React Hook Form, Zod validation |
| **Animation** | Framer Motion, canvas-confetti |

---

## Project Structure

```
Parlova/
├── app/
│   ├── (auth)/              # Authentication pages
│   ├── (dashboard)/         # Main app pages (home, practice, learn, read, compete, profile, settings)
│   ├── (onboarding)/        # New user onboarding flow
│   └── api/                 # 22 API route groups
├── components/
│   ├── articles/            # Article browsing and reading
│   ├── auth/                # Auth forms
│   ├── books/               # Book library and chapter reader
│   ├── compete/             # Leaderboard and challenges
│   ├── conversation/        # Chat interface, voice, scoring
│   ├── dashboard/           # Dashboard widgets
│   ├── first-conversation/  # First-time conversation flow
│   ├── learn/               # Learning modules and guided pathway
│   ├── listen/              # Podcast browser and audio player
│   ├── onboarding/          # Onboarding step components
│   ├── profile/             # Profile display and editing
│   ├── providers/           # React context providers
│   ├── read/                # Read page layout
│   ├── shared/              # WordPopover, PaywallModal, ErrorBoundary
│   ├── stories/             # Story browser and reader
│   ├── ui/                  # shadcn/ui base components
│   ├── vocabulary/          # Deck viewer, review, import
│   └── watch/               # Video browser and player
├── hooks/                   # 21 custom React hooks
├── lib/
│   ├── articles/            # Article processing logic
│   ├── books/               # Book processing logic
│   ├── claude/              # Claude AI client and prompts
│   ├── data/                # Static data (scenarios, badges, challenges, books, videos, podcasts, RSS feeds)
│   ├── listen/              # Podcast fetching logic
│   ├── openai/              # OpenAI client and prompts
│   ├── stories/             # Story generation logic
│   ├── stripe/              # Stripe integration
│   ├── supabase/            # Supabase clients (browser, server, middleware)
│   ├── utils/               # SM-2 algorithm, level calc, env config, cn utility
│   ├── voice/               # Voice processing
│   └── watch/               # Video processing logic
├── store/                   # Zustand stores
├── supabase/migrations/     # 17 migration files
└── types/                   # TypeScript type definitions
```

---

## Planned Features

- **Notifications** — Push notification system
- **Polyglot Mode** — Multi-language learning support
- **Certificate Marketplace** — Full Stripe-powered certificate purchase flow

---

## Configuration Files

| File | Purpose |
|------|---------|
| `tailwind.config.ts` | Tailwind CSS configuration with custom dark theme |
| `tsconfig.json` | TypeScript configuration (strict mode) |
| `middleware.ts` | Auth middleware for route protection |
| `.env.local.example` | Environment variables template |
| `next.config.mjs` | Next.js configuration |
| `vercel.json` | Vercel deployment configuration |
| `components.json` | shadcn/ui configuration |