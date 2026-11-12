<div align="center">

<img src="./public/soriva-icon-v2.svg" width="72" height="72" alt="Soriva" />

# Soriva

**自由 · 探索**

自由探索属于自己的语言天空。  
Find your own path through Japanese.

[Getting started](#getting-started) · [Development notes](./docs/GITHUB_HANDOFF.md) · [Project status](./docs/IMPLEMENTATION_STATUS.md)

</div>

---

### Learn at your own pace

A Japanese learning space with short lessons, focused practice, and personal progress.

- **11 guided lessons** — a step-by-step path from the basics.
- **Kana practice** — choose the hiragana and katakana you want to study.
- **Daily practice & review** — revisit learned material and previous mistakes.
- **Listening practice** — replay Japanese audio at your own pace.
- **Your learning history** — account-based progress, scores, and a study calendar.

Built with Next.js, TypeScript, Tailwind CSS, and Supabase.

### Getting started

Requires Node.js 22+.

```sh
npm ci
cp .env.example .env.local
npm run dev:source
```

Set your Supabase project URL and publishable key in `.env.local`.  
Open [localhost:4173](http://localhost:4173).

```sh
npm run typecheck
npm test
npm run build
```

### Deployment

The production build exports to `out/`. Keep the existing Supabase project to retain accounts and learning records. Add your new website URL to Supabase Auth's allowed redirects before switching hosts.

See the [deployment and Codex handoff notes](./docs/GITHUB_HANDOFF.md) for details. The project is still being refined; outstanding work is tracked in [Project status](./docs/IMPLEMENTATION_STATUS.md).

---

<div align="center">
<sub>Sora · sky &nbsp; + &nbsp; Via · path</sub>
</div>
