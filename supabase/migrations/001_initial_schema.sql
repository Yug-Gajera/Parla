-- ============================================================
-- FluentLoop — Complete Initial Schema
-- ============================================================

-- ─── Tables ─────────────────────────────────────────────────

-- Users (linked to Supabase Auth)
create table users (
  id uuid primary key references auth.users on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  native_language text default 'en',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- User settings (1:1 with users)
create table user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references users on delete cascade,
  daily_goal_minutes int default 20,
  notification_enabled boolean default true,
  preferred_content_types text[] default array['news','cooking','vlog'],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Supported languages
create table languages (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  flag_emoji text,
  is_available boolean default false,
  created_at timestamptz default now()
);

-- Mapping of users → languages they are studying
create table user_languages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users on delete cascade,
  language_id uuid references languages on delete cascade,
  current_level text default 'A1',
  level_score int default 0,
  total_study_minutes int default 0,
  streak_days int default 0,
  last_study_date date,
  started_at timestamptz default now(),
  unique (user_id, language_id)
);

-- Global vocabulary bank
create table vocabulary_words (
  id uuid primary key default gen_random_uuid(),
  language_id uuid references languages on delete cascade,
  word text not null,
  translation text not null,
  pronunciation text,
  part_of_speech text,
  frequency_rank int,
  cefr_level text,
  example_sentence text,
  example_translation text,
  created_at timestamptz default now()
);

-- Per-user vocabulary progress (SRS)
create table user_vocabulary (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users on delete cascade,
  word_id uuid references vocabulary_words on delete cascade,
  status text default 'new',
  ease_factor decimal default 2.5,
  interval_days int default 1,
  next_review_date date default current_date,
  times_seen int default 0,
  times_correct int default 0,
  added_at timestamptz default now(),
  last_reviewed_at timestamptz,
  unique (user_id, word_id)
);

-- AI conversation sessions
create table conversation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users on delete cascade,
  language_id uuid references languages on delete cascade,
  scenario_type text,
  scenario_name text,
  mode text,
  duration_seconds int default 0,
  messages jsonb default '[]',
  pronunciation_score int,
  grammar_score int,
  vocabulary_score int,
  naturalness_score int,
  goal_completed boolean default false,
  feedback jsonb,
  created_at timestamptz default now()
);

-- Level / placement tests
create table level_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users on delete cascade,
  language_id uuid references languages on delete cascade,
  level_tested text not null,
  reading_score int,
  listening_score int,
  speaking_score int,
  writing_score int,
  vocabulary_score int,
  overall_score int,
  passed boolean default false,
  detailed_results jsonb,
  taken_at timestamptz default now()
);

-- Earned certificates
create table certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users on delete cascade,
  language_id uuid references languages on delete cascade,
  level_achieved text not null,
  verification_code text unique not null default encode(gen_random_bytes(16), 'hex'),
  issued_at timestamptz default now(),
  stripe_payment_id text
);

-- Weekly leaderboard
create table leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users on delete cascade,
  language_id uuid references languages on delete cascade,
  level_band text,
  weekly_score int default 0,
  total_score int default 0,
  week_start_date date,
  conversation_count int default 0,
  vocabulary_learned int default 0,
  content_consumed_minutes int default 0,
  unique (user_id, language_id, week_start_date)
);

-- Individual study sessions
create table study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users on delete cascade,
  language_id uuid references languages on delete cascade,
  session_type text,
  duration_minutes int default 0,
  xp_earned int default 0,
  created_at timestamptz default now()
);

-- ─── Indexes ────────────────────────────────────────────────

-- Foreign-key indexes
create index idx_user_settings_user_id       on user_settings (user_id);
create index idx_user_languages_user_id      on user_languages (user_id);
create index idx_user_languages_language_id  on user_languages (language_id);
create index idx_vocabulary_words_language_id on vocabulary_words (language_id);
create index idx_user_vocabulary_user_id     on user_vocabulary (user_id);
create index idx_user_vocabulary_word_id     on user_vocabulary (word_id);
create index idx_conversation_sessions_user_id     on conversation_sessions (user_id);
create index idx_conversation_sessions_language_id on conversation_sessions (language_id);
create index idx_level_tests_user_id         on level_tests (user_id);
create index idx_level_tests_language_id     on level_tests (language_id);
create index idx_certificates_user_id        on certificates (user_id);
create index idx_certificates_language_id    on certificates (language_id);
create index idx_leaderboard_entries_user_id     on leaderboard_entries (user_id);
create index idx_leaderboard_entries_language_id on leaderboard_entries (language_id);
create index idx_study_sessions_user_id      on study_sessions (user_id);
create index idx_study_sessions_language_id  on study_sessions (language_id);

-- Additional indexes for common queries
create index idx_user_vocabulary_next_review  on user_vocabulary (next_review_date);
create index idx_leaderboard_week_start       on leaderboard_entries (week_start_date);
create index idx_study_sessions_created_at    on study_sessions (created_at);

-- ─── Updated-at Trigger ─────────────────────────────────────

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_users_updated_at
  before update on users
  for each row execute function update_updated_at();

create trigger trg_user_settings_updated_at
  before update on user_settings
  for each row execute function update_updated_at();

-- ─── Row Level Security ─────────────────────────────────────

-- Enable RLS on every table
alter table users                enable row level security;
alter table user_settings        enable row level security;
alter table languages            enable row level security;
alter table user_languages       enable row level security;
alter table vocabulary_words     enable row level security;
alter table user_vocabulary      enable row level security;
alter table conversation_sessions enable row level security;
alter table level_tests          enable row level security;
alter table certificates         enable row level security;
alter table leaderboard_entries  enable row level security;
alter table study_sessions       enable row level security;

-- users: read & update own row only
create policy "users_select_own"
  on users for select
  using (auth.uid() = id);

create policy "users_update_own"
  on users for update
  using (auth.uid() = id);

-- user_settings: read & update own row only
create policy "user_settings_select_own"
  on user_settings for select
  using (auth.uid() = user_id);

create policy "user_settings_update_own"
  on user_settings for update
  using (auth.uid() = user_id);

create policy "user_settings_insert_own"
  on user_settings for insert
  with check (auth.uid() = user_id);

-- languages: anyone authenticated can read, no writes
create policy "languages_select_all"
  on languages for select
  using (true);

-- vocabulary_words: anyone authenticated can read, no writes
create policy "vocabulary_words_select_all"
  on vocabulary_words for select
  using (true);

-- user_languages: read & write own rows
create policy "user_languages_select_own"
  on user_languages for select
  using (auth.uid() = user_id);

create policy "user_languages_insert_own"
  on user_languages for insert
  with check (auth.uid() = user_id);

create policy "user_languages_update_own"
  on user_languages for update
  using (auth.uid() = user_id);

create policy "user_languages_delete_own"
  on user_languages for delete
  using (auth.uid() = user_id);

-- user_vocabulary: read & write own rows
create policy "user_vocabulary_select_own"
  on user_vocabulary for select
  using (auth.uid() = user_id);

create policy "user_vocabulary_insert_own"
  on user_vocabulary for insert
  with check (auth.uid() = user_id);

create policy "user_vocabulary_update_own"
  on user_vocabulary for update
  using (auth.uid() = user_id);

create policy "user_vocabulary_delete_own"
  on user_vocabulary for delete
  using (auth.uid() = user_id);

-- conversation_sessions: read & write own rows
create policy "conversation_sessions_select_own"
  on conversation_sessions for select
  using (auth.uid() = user_id);

create policy "conversation_sessions_insert_own"
  on conversation_sessions for insert
  with check (auth.uid() = user_id);

create policy "conversation_sessions_update_own"
  on conversation_sessions for update
  using (auth.uid() = user_id);

create policy "conversation_sessions_delete_own"
  on conversation_sessions for delete
  using (auth.uid() = user_id);

-- level_tests: read & write own rows
create policy "level_tests_select_own"
  on level_tests for select
  using (auth.uid() = user_id);

create policy "level_tests_insert_own"
  on level_tests for insert
  with check (auth.uid() = user_id);

create policy "level_tests_update_own"
  on level_tests for update
  using (auth.uid() = user_id);

create policy "level_tests_delete_own"
  on level_tests for delete
  using (auth.uid() = user_id);

-- certificates: read own only, no client writes
create policy "certificates_select_own"
  on certificates for select
  using (auth.uid() = user_id);

-- leaderboard_entries: read all rows, write own rows
create policy "leaderboard_entries_select_all"
  on leaderboard_entries for select
  using (true);

create policy "leaderboard_entries_insert_own"
  on leaderboard_entries for insert
  with check (auth.uid() = user_id);

create policy "leaderboard_entries_update_own"
  on leaderboard_entries for update
  using (auth.uid() = user_id);

create policy "leaderboard_entries_delete_own"
  on leaderboard_entries for delete
  using (auth.uid() = user_id);

-- study_sessions: read & write own rows
create policy "study_sessions_select_own"
  on study_sessions for select
  using (auth.uid() = user_id);

create policy "study_sessions_insert_own"
  on study_sessions for insert
  with check (auth.uid() = user_id);

create policy "study_sessions_update_own"
  on study_sessions for update
  using (auth.uid() = user_id);

create policy "study_sessions_delete_own"
  on study_sessions for delete
  using (auth.uid() = user_id);

-- ─── Seed Data: Languages ───────────────────────────────────

insert into languages (code, name, flag_emoji, is_available) values
  ('es', 'Spanish',    '🇪🇸', true),
  ('fr', 'French',     '🇫🇷', false),
  ('zh', 'Mandarin',   '🇨🇳', false),
  ('ja', 'Japanese',   '🇯🇵', false),
  ('pt', 'Portuguese', '🇧🇷', false),
  ('de', 'German',     '🇩🇪', false);
