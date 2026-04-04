#!/bin/bash

# Configuration
APP_URL="http://localhost:3000"
SECRET="fluentloop_articles_2024"
LANGUAGE="b89f7959-8635-4af4-8b28-07229733f88f" # Spanish UUID

echo "=========================================="
echo "🔄 Refreshing Parlova/FluentLoop Content!"
echo "Make sure your Next.js dev server is running on $APP_URL"
echo "==========================================\n"

# 1. Fetch Articles
echo "📰 1. Skipping Daily Articles Fetch..."
# curl -X POST "$APP_URL/api/articles/fetch" \
#   -H "Authorization: Bearer $SECRET" \
#   -H "Content-Type: application/json"

echo -e "\n\n"

# 2. Add/Refresh Podcasts (Listen)
echo "🎧 2. Refreshing Podcasts (seed shows & fetch episodes)..."
curl -X POST "$APP_URL/api/listen/fetch" \
  -H "Authorization: Bearer $SECRET" \
  -H "Content-Type: application/json" \
  -d "{\"language_id\": \"$LANGUAGE\", \"seed_shows\": true}"

echo -e "\n\n"

# 3. Add Curated Videos (Watch)
echo "📺 3. Processing Curated YouTube Videos..."
curl -X POST "$APP_URL/api/watch/process" \
  -H "Authorization: Bearer $SECRET" \
  -H "Content-Type: application/json" \
  -d "{\"language_id\": \"$LANGUAGE\", \"import_all\": true}"

echo -e "\n\n"

# 4. Import Classic Books
echo "📚 4. Importing Classic Books..."
curl -X POST "$APP_URL/api/books/import" \
  -H "Authorization: Bearer $SECRET" \
  -H "Content-Type: application/json" \
  -d "{\"language_id\": \"$LANGUAGE\"}"

echo -e "\n\n"

echo "✅ All done! Note: Video, Podcast, and Book processing can take a few minutes."
