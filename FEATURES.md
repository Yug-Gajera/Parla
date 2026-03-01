# FluentLoop - Feature Documentation

A comprehensive language learning platform built with Next.js, Supabase, and OpenAI GPT-4.

---

## Overview

FluentLoop helps users learn languages (currently supporting Spanish, French, Chinese, Japanese, Portuguese, German) through AI-powered conversation practice, spaced repetition vocabulary training, and CEFR-based level progression (A1-C2).

---

## Features

### 1. Authentication System

**Purpose:** User registration, login, and session management

**Key Files:**
- `app/(auth)/login/page.tsx` - Login page
- `app/(auth)/signup/page.tsx` - Signup page
- `components/auth/LoginForm.tsx` - Login form component
- `components/auth/SignupForm.tsx` - Signup form component
- `app/api/auth/callback/route.ts` - OAuth callback handler
- `middleware.ts` - Route protection

**Functionality:**
- Email/password authentication via Supabase Auth
- Google OAuth sign-in
- Password reset functionality
- Session management with protected routes

---

### 2. Onboarding Flow

**Purpose:** New user setup and language proficiency assessment

**Key Files:**
- `app/(onboarding)/onboarding/page.tsx` - Onboarding page
- `components/onboarding/OnboardingFlow.tsx` - Main flow container
- `components/onboarding/StepLanguage.tsx` - Language selection
- `components/onboarding/StepGoal.tsx` - Learning goal selection
- `components/onboarding/StepTime.tsx` - Daily time commitment
- `components/onboarding/StepLevel.tsx` - Self-reported level
- `components/onboarding/StepDiagnostic.tsx` - AI diagnostic test
- `components/onboarding/StepResult.tsx` - Results presentation
- `store/onboarding.ts` - Zustand state management

**API Endpoints:**
- `POST /api/ai/diagnostic` - Generate diagnostic questions
- `POST /api/ai/diagnostic/assess` - Assess level from answers

**Flow:**
1. Select target language
2. Choose learning goal
3. Set daily time commitment
4. Self-report current level
5. Complete AI-powered diagnostic test
6. View results and recommended level

---

### 3. User Dashboard

**Purpose:** Central hub showing progress, stats, and quick actions

**Key Files:**
- `app/(dashboard)/home/page.tsx` - Home page
- `components/dashboard/DashboardView.tsx` - Main dashboard view
- `components/dashboard/Header.tsx` - Dashboard header
- `components/dashboard/GoalProgress.tsx` - Daily goal progress
- `components/dashboard/QuickActions.tsx` - Quick action buttons
- `components/dashboard/WeeklyStats.tsx` - Weekly statistics
- `components/dashboard/LevelProgress.tsx` - CEFR level progression
- `components/dashboard/RecentActivity.tsx` - Recent sessions list

**Features:**
- Daily goal tracking with visual progress ring
- Weekly statistics (conversations, words learned, minutes studied, streak)
- Level progress toward next CEFR level
- Recent activity feed

---

### 4. AI Conversation Practice (Core Feature)

**Purpose:** Roleplay conversations with AI characters in various scenarios

**Key Files:**
- `app/(dashboard)/practice/page.tsx` - Practice page
- `components/conversation/PracticeView.tsx` - Scenario selection
- `components/conversation/ConversationWindow.tsx` - Chat interface
- `components/conversation/MessageBubble.tsx` - Message display
- `components/conversation/ScoreCard.tsx` - Post-session scoring
- `hooks/useConversation.ts` - Conversation state management
- `lib/data/scenarios.ts` - Scenario definitions

**API Endpoints:**
- `POST /api/conversation/start` - Start new conversation session
- `POST /api/conversation/message` - Send message (streaming response)
- `POST /api/conversation/end` - End session and get scores

**Available Scenarios:**

| Scenario | Level | Context |
|----------|-------|---------|
| Cafe Order | A1 | Restaurant |
| Market Negotiation | A2 | Market |
| Apartment Problem | B1 | Neighbor |
| Job Interview | B1 | JobInterview |
| Doctor Visit | B2 | Doctor |
| Neighbor Dispute | B2 | Neighbor |
| Travel Delay | C1 | CustomerService |
| Business Pitch | C1 | JobInterview |

**Features:**
- Streaming AI responses using OpenAI GPT-4o
- Level-locked scenarios (unlocks based on CEFR level)
- Real-time conversation with character personas
- Post-conversation scoring:
  - Grammar (0-100)
  - Vocabulary (0-100)
  - Naturalness (0-100)
  - Goal completion (0-100)
- Grammar error feedback
- Vocabulary suggestions

---

### 5. Vocabulary & Spaced Repetition

**Purpose:** Learn and review vocabulary using SM-2 algorithm

**Key Files:**
- `app/(dashboard)/learn/page.tsx` - Learn page
- `components/learn/LearnView.tsx` - Main learning view
- `components/vocabulary/DeckViewer.tsx` - Vocabulary deck browser
- `components/vocabulary/VocabularyCard.tsx` - Word card component
- `components/vocabulary/ReviewSession.tsx` - Flashcard review session
- `components/vocabulary/AddWordSheet.tsx` - Add word sheet
- `components/vocabulary/WordDetailSheet.tsx` - Word details
- `hooks/useVocabulary.ts` - Vocabulary state management
- `lib/utils/vocabulary.ts` - SM-2 algorithm implementation

**API Endpoints:**
- `GET /api/vocabulary` - List user's vocabulary (paginated, filterable)
- `POST /api/vocabulary` - Add word to deck
- `DELETE /api/vocabulary` - Remove word from deck
- `GET /api/vocabulary/stats` - Get vocabulary statistics
- `GET /api/vocabulary/review` - Get due words for review
- `POST /api/vocabulary/review` - Submit review result

**Word Status Levels:**
- `new` - Newly added words
- `learning` - In progress
- `familiar` - Mostly known
- `mastered` - Fully learned

**Features:**
- SM-2 spaced repetition algorithm
- Due date-based review system
- Search and filter functionality
- Word details (pronunciation, part of speech, example sentences)
- Due today notification banner
- Progress statistics

---

### 6. Level Assessment & Diagnostics

**Purpose:** Determine user's CEFR proficiency level through adaptive testing

**Key Files:**
- `lib/openai/prompts.ts` - Diagnostic prompts
- `lib/claude/prompts.ts` - Alternative prompt templates

**API Endpoints:**
- `POST /api/ai/diagnostic` - Generate 10 adaptive questions
- `POST /api/ai/diagnostic/assess` - Assess level from answers

**Features:**
- 10-question adaptive diagnostic
- CEFR level assignment (A1-C2)
- Skill breakdown (reading, vocabulary, grammar)
- Self-reported level consideration

---

### 7. Leaderboard & Competition

**Purpose:** Competitive rankings by level band

**Key Files:**
- `app/(dashboard)/compete/page.tsx` - Compete page
- `components/compete/CompeteView.tsx` - Main compete view
- `components/compete/LeaderboardTab.tsx` - Leaderboard tab
- `components/compete/ChallengesTab.tsx` - Challenges tab
- `components/compete/MyStatsTab.tsx` - Personal stats tab
- `hooks/useLeaderboard.ts` - Leaderboard data fetching
- `lib/data/challenges.ts` - Challenge definitions

**API Endpoints:**
- `GET /api/leaderboard` - Fetch leaderboard entries
- `POST /api/leaderboard/update` - Update user's leaderboard score

**Level Bands:**
- Beginner: A1-A2
- Intermediate: B1-B2
- Advanced: C1-C2

**Features:**
- Weekly scores and rankings
- Navigation between past weeks
- Auto-refresh every 60 seconds
- Total score tracking

---

### 8. Weekly Challenges

**Purpose:** Rotating weekly goals for bonus XP

**Key Files:**
- `lib/data/challenges.ts` - Challenge templates

**Challenge Types:**

| Challenge | Requirement | Cycle |
|------------|-------------|-------|
| Conversation Week | Complete 5 conversations | Week 1 |
| Vocabulary Builder | Learn 30 new words | Week 2 |
| Perfect Score | Score 85+ in conversation | Week 3 |
| Consistency | Maintain 7-day streak | Week 4 |

**Features:**
- Rotating weekly challenges (4-week cycle)
- XP rewards
- Badge unlocks

---

### 9. Badges & Achievements

**Purpose:** Reward user milestones

**Key Files:**
- `lib/data/badges.ts` - Badge definitions

**Available Badges:**

| Badge | Requirement |
|-------|-------------|
| First Conversation | Complete first conversation |
| Conversationalist | 5 conversations in a week |
| Word Collector | Learn 30 words in a week |
| High Achiever | Score 85+ in conversation |
| Iron Discipline | Maintain 7-day streak |
| Week Warrior | Meet daily goal 5 times/week |
| Perfect Week | Meet daily goal 7 days straight |
| Century | Complete 100 conversations |
| Polyglot Preview | (Coming soon) |

**Features:**
- Automatic badge computation from stats
- Display in profile

---

### 10. User Profile

**Purpose:** View and manage personal learning stats

**Key Files:**
- `app/(dashboard)/profile/page.tsx` - Profile page
- `components/profile/ProfileView.tsx` - Profile display
- `components/profile/EditProfileSheet.tsx` - Edit profile sheet

**API Endpoints:**
- `POST /api/profile/update` - Update profile data
- `GET /api/profile/data` - Fetch profile data

**Features:**
- Total hours studied
- Conversation count
- Vocabulary known
- Streak days
- Earned badges
- Activity calendar (past year)
- Level progress visualization
- Certificate display

---

### 11. Settings & Preferences

**Purpose:** Configure user preferences

**Key Files:**
- `app/(dashboard)/settings/page.tsx` - Settings page
- `app/api/settings/update/route.ts` - Settings update API

**Features:**
- Daily goal selection (10, 20, 30, 45 minutes)
- Notification toggle (coming soon)
- Preferred content types:
  - News
  - Cooking
  - Travel
  - Sports
  - Business
  - Entertainment
- Password change
- Account deletion
- Data export

---

### 12. Progress Tracking & XP System

**Purpose:** Track learning progress and provide motivation

**Key Files:**
- `lib/utils/level.ts` - Level calculations

**Scoring Rules:**

| Activity | XP Earned |
|----------|-----------|
| Conversation base | 50 XP |
| Score multiplier | 0.5x score |
| Goal completion bonus | 75 XP |
| Vocabulary review | 20 XP per 10 cards |
| Daily goal met | 100 XP |
| 7-day streak bonus | 50 XP |

**Level Progression:**
- 100 points per CEFR level
- Days to next level estimation
- Level bands for competition

---

## Technical Architecture

### Database Tables (Supabase/PostgreSQL)

| Table | Purpose |
|-------|---------|
| `users` | User profiles |
| `user_settings` | User preferences |
| `languages` | Available languages |
| `user_languages` | User-language relationships with progress |
| `vocabulary_words` | Word database |
| `user_vocabulary` | User's vocabulary progress (SRS) |
| `conversation_sessions` | Conversation history |
| `level_tests` | Assessment results |
| `certificates` | Level certificates |
| `leaderboard_entries` | Weekly competition data |
| `study_sessions` | XP/learning session logs |

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
| **Frontend** | Next.js 14 (App Router), React, TypeScript |
| **UI** | Tailwind CSS, shadcn/ui components, Framer Motion |
| **State Management** | Zustand, React hooks |
| **Backend** | Next.js API Routes |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth (email/password, Google OAuth) |
| **AI** | OpenAI GPT-4o for conversations and diagnostics |
| **Animation** | Framer Motion |

---

## Project Structure

```
FluentLoop/
├── app/
│   ├── (auth)/          # Authentication pages
│   ├── (dashboard)/     # Main app pages
│   ├── (onboarding)/    # New user flow
│   ├── api/             # API routes
│   └── fonts/           # Custom fonts
├── components/
│   ├── auth/            # Auth components
│   ├── compete/         # Competition components
│   ├── conversation/    # Chat components
│   ├── dashboard/       # Dashboard components
│   ├── learn/           # Learning components
│   ├── onboarding/      # Onboarding components
│   ├── profile/         # Profile components
│   ├── shared/          # Shared components
│   ├── ui/              # shadcn/ui components
│   └── vocabulary/      # Vocabulary components
├── hooks/               # Custom React hooks
├── lib/
│   ├── claude/          # Claude AI integration
│   ├── data/            # Static data (scenarios, badges, etc.)
│   ├── openai/          # OpenAI integration
│   ├── stripe/          # Stripe integration (stub)
│   ├── supabase/        # Supabase client
│   └── utils/           # Utility functions
├── store/               # Zustand stores
├── supabase/            # Supabase migrations
└── types/               # TypeScript types
```

---

## Planned Features

- **Certificates** - Level certification (database schema ready, UI pending)
- **Stripe Integration** - Subscription and certificate purchases (stub only)
- **Notifications** - Push notification system

---

## Configuration Files

| File | Purpose |
|------|---------|
| `tailwind.config.ts` | Tailwind CSS configuration |
| `tsconfig.json` | TypeScript configuration |
| `middleware.ts` | Auth middleware for route protection |
| `.env.local.example` | Environment variables template |