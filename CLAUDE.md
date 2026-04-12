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

## Commandes

- `pnpm dev` : Lancer le dev server
- `pnpm build` : Build complet
- `pnpm test` : Lancer les tests
- `pnpm --filter @contree/engine test` : Tests du moteur uniquement
