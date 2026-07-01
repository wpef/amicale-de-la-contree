#!/usr/bin/env bash
# Sync the built game engine into the Supabase Edge Functions shared folder.
# The Edge Functions run on Deno and import the engine as local ESM modules.
# Run this after changing packages/engine so the server-side engine stays in sync.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/packages/engine/dist"
DEST="$ROOT/supabase/functions/_shared/engine"

echo "Building @contree/engine..."
pnpm --filter @contree/engine build >/dev/null

echo "Syncing engine -> $DEST"
rm -rf "$DEST"
mkdir -p "$DEST"

# Copy only the runtime ESM (.js) files, preserving the directory structure.
cd "$SRC"
find . -name '*.js' -print0 | while IFS= read -r -d '' f; do
  mkdir -p "$DEST/$(dirname "$f")"
  cp "$f" "$DEST/$f"
done

echo "Engine synced ($(find "$DEST" -name '*.js' | wc -l | tr -d ' ') files)."
