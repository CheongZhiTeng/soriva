# Soriva — GitHub / Codex handoff

Imported from the existing Sites source at commit b0906bb8cd4505f49c99f420d2554efc9a5c14a5 (2026-11-12). This is a source snapshot, not a transfer of Sites hosting or its Git history.

## Local development / Codex

Use Node.js 22 or later and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev:source
```

The source dev server uses port 4173. `npm run dev` serves the built static `out/` directory; run `npm run build` first.

Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to the existing project URL and publishable client key. These are public frontend settings. Never commit .env.local, database dumps, service-role keys, access tokens or user backups. The existing frontend retains its public configuration fallback so the imported source keeps its current behavior.

## Checks

```sh
npm run typecheck
npm test
npm run build
```

The imported source passed these checks (13 tests). See IMPLEMENTATION_STATUS.md for outstanding work and verification limits. Read AGENTS.md before editing.

## Existing production and database

The existing Sites publication remains live. Importing this repository does not configure automatic deployments or connect a Codex environment. Select CheongZhiTeng/soriva when creating the Codex environment.

Continue using the existing Supabase project. Account and learning records remain there; they are not in GitHub. Do not reset the database or rerun SQL scripts as a migration step. The SQL files describe earlier setup and do not include every subsequently applied production migration. The historical SETUP.md predates the live connection; current implementation status takes precedence. Do not use this source snapshot alone to recreate production schema.

Before hosting on a new origin, configure Supabase Site URL and exact allowed authentication redirect URLs and verify sign-in/recovery. Keep existing publication until the replacement is verified. Original browser-local records are origin-bound; use the existing backup/import process if needed.

The .openai/hosting.json file identifies the original Site. Preserve it for original Sites updates; never treat it as a new Site identity. No new hosting or public access changes were made during this import.
