# Backend Supabase — mode en ligne

Architecture du mode en ligne (Contree multijoueur temps reel).

## Modele de donnees

Voir `migrations/001_initial_schema.sql`.

- `players` — profil (auth anonyme). Lisible par tous, modifiable par soi-meme.
- `games` — une partie. `round_state` (JSONB) contient l'**etat public** du jeu
  (le `GameState` du moteur **sans les mains privees**, plus `handCounts`).
- `game_players` — qui est dans quelle partie, siege et equipe (RLS + lobby).
- `hands` — **une ligne par joueur**, sa main privee (`cards: CardId[]`).
  RLS strict : chaque joueur ne lit **que** sa propre main.

Realtime est active sur `games`, `game_players` et `hands` : les clients
s'abonnent via `postgres_changes` et recoivent les mises a jour automatiquement.

## Edge Functions

- `create-game` — auth, genere un room code, cree `games` + insere le createur
  dans `game_players` (siege Nord, equipe 1).
- `join-game` — auth, trouve la partie par room code, ajoute le joueur au
  premier siege libre ; passe en `team_selection` quand 4 joueurs sont la.
- `game-action` — **le serveur autoritaire**. Pour chaque action :
  1. authentifie le joueur et verifie qu'il participe ;
  2. reconstruit le `GameState` complet (`games.round_state` + `hands`) ;
  3. applique l'action via le **reducer du moteur** (`_shared/engine`) ;
     l'action porte toujours le `playerId` = utilisateur authentifie
     (jamais celui envoye par le client) ;
  4. ecrit le nouvel etat public dans `games` et les mains dans `hands` ;
  5. Realtime pousse les changements aux clients.

  En phase de lobby (avant le premier `START_GAME`), `game-action` gere
  `SET_TEAMS` / `RANDOMIZE_TEAMS` / `SET_TARGET_SCORE` directement sur
  `game_players`, puis `START_GAME` amorce l'etat moteur (distribution
  automatique des cartes) et bascule en phase d'encheres.

### Moteur dans Deno

Le moteur (`packages/engine`) est copie, compile en ESM, dans
`functions/_shared/engine/` pour tourner dans Deno. Apres toute modification du
moteur, resynchroniser :

```bash
./scripts/sync-engine.sh
```

## Deploiement

```bash
# 1. Lier le projet cloud
npx supabase login
npx supabase link --project-ref <ref>

# 2. Migrations
npx supabase db push

# 3. Edge Functions
./scripts/sync-engine.sh          # s'assurer que le moteur est a jour
npx supabase functions deploy create-game
npx supabase functions deploy join-game
npx supabase functions deploy game-action

# 4. Activer l'auth anonyme dans le dashboard (Authentication > Providers)
```

Le front (GitHub Pages) a besoin des variables :

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

En CI (`.github/workflows/deploy.yml`), fournir ces valeurs via les secrets du
depot.

## Dev local (Docker requis)

```bash
npx supabase start
npx supabase db reset          # rejoue les migrations
npx supabase functions serve   # sert les Edge Functions
```
