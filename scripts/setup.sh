#!/bin/bash
# Setup script for Amicale de la Contree
# Prerequisites: Docker Desktop running, Node.js 22+, pnpm

set -e

echo "=== Amicale de la Contree - Setup ==="

# 1. Install dependencies
echo "[1/4] Installing dependencies..."
pnpm install

# 2. Build the engine
echo "[2/4] Building game engine..."
pnpm --filter @contree/engine build

# 3. Start Supabase
echo "[3/4] Starting Supabase (requires Docker)..."
npx supabase start

# 4. Extract keys and write .env.local
echo "[4/4] Configuring environment..."
SUPABASE_URL=$(npx supabase status --output json | grep -o '"API URL": "[^"]*"' | cut -d'"' -f4)
SUPABASE_ANON_KEY=$(npx supabase status --output json | grep -o '"anon key": "[^"]*"' | cut -d'"' -f4)

# Fallback: parse from plain text output
if [ -z "$SUPABASE_URL" ]; then
  SUPABASE_URL=$(npx supabase status 2>/dev/null | grep "API URL" | awk '{print $NF}')
fi
if [ -z "$SUPABASE_ANON_KEY" ]; then
  SUPABASE_ANON_KEY=$(npx supabase status 2>/dev/null | grep "anon key" | awk '{print $NF}')
fi

cat > apps/web/.env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL:-http://127.0.0.1:54321}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-your-anon-key-here}
EOF

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Supabase URL: $SUPABASE_URL"
echo "Anon key:     $SUPABASE_ANON_KEY"
echo ""
echo "Run 'pnpm dev' to start the dev server."
echo "Open http://localhost:3000 in 4 browser tabs to play!"
