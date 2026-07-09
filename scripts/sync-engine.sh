#!/usr/bin/env bash
# Bundle the built game engine into a single ESM file for the Supabase Edge
# Functions (Deno). The engine is pure TypeScript with zero dependencies, so it
# bundles into one self-contained module that both `supabase functions deploy`
# and the Supabase MCP deploy tool can ship without any relative _shared tree.
#
# Run this after changing packages/engine so the server-side engine stays in sync.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/supabase/functions/_shared/engine.js"

echo "Building @contree/engine..."
pnpm --filter @contree/engine build >/dev/null

echo "Bundling engine -> $DEST"
mkdir -p "$(dirname "$DEST")"
pnpm exec esbuild "$ROOT/packages/engine/dist/index.js" \
  --bundle --format=esm --platform=neutral --legal-comments=none \
  --outfile="$DEST" >/dev/null

echo "Engine bundled ($(wc -c < "$DEST" | tr -d ' ') bytes)."
