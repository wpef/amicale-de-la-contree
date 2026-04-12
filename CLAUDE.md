# Amicale de la Contree

Jeu de Contree (variante de Belote) en ligne, pour jouer entre copains.

## Stack

- **Monorepo** : pnpm workspaces + Turborepo
- **Frontend** : Next.js (App Router) + React + TypeScript + Tailwind CSS
- **Backend** : Supabase (Auth anonyme, Edge Functions, Realtime, PostgreSQL)
- **Game Engine** : `@contree/engine` - Pure TypeScript, zero dependances

## Structure

- `packages/engine/` : Moteur de jeu (domaine pur, regles, state machine)
- `apps/web/` : Application Next.js
- `supabase/` : Edge Functions + migrations SQL

## Conventions

- Code en TypeScript strict
- UI en francais, code/commentaires en anglais
- Tests avec vitest pour le moteur de jeu
- Pas de dependances dans le package engine (pure TypeScript)
- Commits en anglais, descriptifs

## Setup local

```bash
# Prerequis : Docker Desktop, Node.js 22+, pnpm
./scripts/setup.sh
# ou manuellement :
pnpm install
pnpm --filter @contree/engine build
npx supabase start          # Lance PostgreSQL, Auth, Realtime, Edge Functions
# Copier les cles depuis la sortie de supabase start dans apps/web/.env.local
pnpm dev
```

## Commandes

- `pnpm dev` : Lancer le dev server
- `pnpm build` : Build complet
- `pnpm test` : Lancer les tests
- `pnpm --filter @contree/engine test` : Tests du moteur uniquement
- `npx supabase start` : Lancer Supabase en local
- `npx supabase stop` : Arreter Supabase
- `npx supabase db reset` : Reset la DB et rejouer les migrations
- `npx supabase functions serve` : Lancer les Edge Functions en local

## Pre-commit

Avant de commit, verifier :
1. `pnpm --filter @contree/engine test` → 144 tests verts
2. `pnpm build` → pas d'erreur
