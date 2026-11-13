# Soriva implementation status — 2026-11-12

Existing project and Supabase records retained. No public access change.
Source recovered from commit 2610d22 after workspace maintenance removed uncommitted work. The earlier `journey_platform_safety` migration remains applied; do not apply it again.

## Present in this revision
- Soriva branding and landing page. Pronunciation hint removed at owner request.
- Existing 11 lessons, authentication, migration, settings, quizzes and records retained.
- SVG default avatars replacing emoji choices; image MIME/size validation.
- Learning path with existing sequential 80% rule.
- Daily practice from started/unlocked lessons and practiced hiragana.
- Smart review prioritizes repeated errors; correct responses defer the next review.
- Listening practice with device Japanese voice, replay/slow controls and text feedback.
- Account-scoped session drafts for new practice modules; stable submission IDs prevent duplicates.
- Calendar with account time zone and date detail.
- First-lesson onboarding entry, public introduction/sample, privacy/terms/help, feedback submission.
- Connection timeout and retry, cloud-load gate, pinned package versions.
- Existing database rate limits, validation, immutable historic quiz checks, daily snapshots, health-check cron retained.

## Verification completed
- TypeScript passes, production static build passes.
- 13 tests pass: migration preservation/conflicts/deduplication, empty account isolation, curriculum MCQ structure, unlock rule, kana sets, daily scope, review intervals, timezone boundary.
- Browser production preview loads and landing-language toggle works. Previous dev-preview hydration stall avoided by testing the production output.
- DB: anonymous profile read denied; direct authenticated updates denied; private schema not exposed; all public journey tables RLS enabled; snapshot checksums valid.
- 1 existing profile and 1 valid snapshot observed. Reminder, backup and health jobs active.

## Remaining work — do not label fully ready for public release
1. Complete remaining UI/course English localization. Shared language switch now appears on landing, authentication, header and settings; navigation and core auth labels translate; signed-in changes use the existing account-save flow. Some course content and secondary descriptions still need English.
2. Skippable brand intro (current loading animation alone is not the requested intro).
3. Complete course language/audio review and contextual quiz additions.
4. Legacy lesson quiz and kana draft recovery; idle-aware study time.
5. End-to-end authenticated browser testing: signup, email confirmation, recovery, sync, avatars, progress and migration across desktop/tablet/mobile.
6. Email or push delivery. In-app reminder jobs do not deliver notifications with the website closed. Configure verified email sender/SMTP or Web Push infrastructure and test delivery; never claim these are enabled.
7. Error telemetry client integration, actionable external monitoring, independent disaster-recovery backups and restore drill. Current in-database snapshots are not disaster recovery.
8. Complete accessibility/keyboard and responsive QA, final SEO/share preview.
9. Review leaked-password protection and authentication abuse settings in Supabase before launch.

## Deployment/continuation
Keep the current owner-only audience until acceptance is complete. Do not reset data, re-run completed migrations, or treat new-user empty state as permission to import legacy data. Main source remains in the existing Site repository. `npm run dev` serves the built `out/`; run `npm run build` after edits. `npm run dev:source` retains the source dev server.

## Interface corrections — 2026-11-12
- Removed pronunciation hint; replaced course example name with fictional Aki in source and cloud lesson 1 (verified). Personal profile and learning history untouched.
- Shared language controls on landing/auth/header/settings, with browser persistence and signed-in account updates.
- Dashboard is first and sticky in a single sidebar scroll area; fixed bottom account/settings area, mobile body scroll lock and reduced-motion drawer positioning.
- New geometric sky/path favicon with a versioned URL.
- TypeScript, 13 existing tests and production build passed. Browser verified auth labels switch to English and choice survives refresh. Signed-in sidebar/header and device-specific scroll behavior require authenticated visual acceptance; no real account was used for this pass.

## Continuation — 2026-11-13

Source now contains 100 lessons; 12–100 are new vocabulary-focused lessons, with contextual grammar in 71–100 and cumulative review in 100. Existing lessons/history retained. Client unlock limit, auth callback path, stale timeout, cloud lesson precedence and unsafe backup properties fixed. Privacy/browser headers added for preview and compatible static hosts. 17 tests, TypeScript, production build and anonymous desktop/mobile browser checks pass; production dependency audit reports no known vulnerabilities.

See SECURITY_REVIEW.md for findings, verification scope and remaining release checks. `supabase/003_lessons_100.sql` is prepared but **not applied**; it extends the deployed trigger without replacing its other safety checks and inserts new lessons without overwriting existing courses. No live database, deployment or audience changes were made. Live authenticated/security acceptance and earlier release requirements remain open; do not label the published website fully ready on the basis of these local checks.

## Publication preparation — 2026-11-13

The owner reported successful execution of the separate unlock-to-100 SQL and `004_lesson_content_only.sql` in Supabase. Do not rerun `003_lessons_100.sql`: the guard has already been extended. This is owner-reported execution; live authenticated acceptance remains unverified. GitHub CLI authentication now succeeds after allowing api.github.com. Local 17 tests, typecheck and production build passed again before publication through the existing GitHub Pages workflow.
