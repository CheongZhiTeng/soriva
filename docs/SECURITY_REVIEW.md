# Security and continuation review — 2026-11-13

## Completed in source

- Curriculum extended from 11 to 100 sequenced lessons, preserving lessons 1–11 and their question IDs. Added 445 vocabulary entries, readings, bilingual learning dialogues and quizzes. Lessons 71–100 add contextual grammar examples; lesson 100 includes cumulative questions. These are vocabulary-focused learning materials, not a claim of a proficiency qualification or a complete JLPT syllabus. Independent Japanese language/editorial review is still recommended.
- Removed the client unlock limit of 11. Added validation of every lesson and a lesson 99→100 unlock regression check.
- Cloud course definitions now take priority over bundled lessons, allowing administrator edits, draft status and scheduling to work; results sort by lesson number.
- Backup imports reject dangerous object keys recursively before schema validation/merge, and reject inputs above 10 MB. Merge uses own-property checks. Existing ordinary unknown backup metadata remains supported.
- Authentication confirmation/recovery/resend redirect URLs retain the `/soriva/` application path. Production Supabase must allow the exact deployed callback URL.
- Cleared the initial auth timer after session resolution, preventing spurious connection errors. Recovery state clears on account transitions and is restored only for the current recovery event.
- Supabase timeout fetch retains caller cancellation.
- Added no-referrer metadata; preview serves no-referrer, nosniff, frame denial, restricted device permissions and a baseline CSP blocking objects, base changes, framing and cross-origin form submissions. `public/_headers` supplies these headers for hosts supporting that format. For other hosts configure equivalent response headers. This is a baseline CSP, not script nonce enforcement.
- Preview correctly serves `/soriva/` and its prefixed assets from static output.

## Verification

- 17 automated tests pass, including all curriculum publishing schemas, unique question/word IDs, sequential unlocking, account isolation, backup preservation, malicious backup keys and size limits.
- TypeScript and production static export pass.
- `npm audit --omit=dev` reports zero known vulnerabilities at review time.
- Source search found no service role/private key patterns. Supabase publishable configuration is intentionally public; server-side RLS/RPC authorization remains essential.
- Chromium against production preview: landing, English switch, sign-in form, preference persistence across refresh, 16-second timeout regression, 390px viewport with no horizontal overflow; no JavaScript page errors. Preview response security headers verified.

## Live release work still required

The current environment has no Supabase administration/database credentials, no database connector, and no deployment connector. Supabase is outside the current outbound allowlist. No live database or hosting changes were made; source tests do not establish live authorization correctness.

1. Review and apply `supabase/003_lessons_100.sql` once through an authorized database connection. It preserves the complete deployed progress trigger and only extends its literal `2..11` loops to `2..100`, then inserts lessons 12–100 without overwriting any existing IDs. It aborts if the expected function/range is absent, so a different deployed implementation requires inspection. It does not rerun old migrations or modify profile/history rows. The SQL has been integration-tested locally against the historical 002 guard using PGlite (PostgreSQL WASM); it has not been executed against production or its newer safety migration.
2. Check every inserted lesson against cloud definitions. An existing ID wins intentionally; resolve discrepancies through the existing administrator publishing workflow without changing historical questions.
3. Verify server-side unlock enforcement for locked lessons 12 and 100, score recomputation from canonical course questions, historic quiz immutability and authorized imports. Audit the currently deployed safety migration: the historical SQL in this checkout is not its complete definition. Do not replace the live function with the old 002 definition.
4. Test RLS and every RPC with anonymous, account A, account B and administrator sessions, including forged/null expected_user, revision conflicts, unauthorized publishing, account deletion and cross-account import attempts. No real accounts were accessed for this review.
5. Configure exact `/soriva/` confirmation/recovery URLs; test signup, confirmation, recovery, sign-out, account switching and deletion on the deployed origin. Confirm rate limits, leaked-password protection and authentication abuse settings.
6. Verify security headers at the actual hosting origin. Keep the existing owner-only audience until authenticated acceptance and previously documented release work are complete. Independent backup/restore, monitoring, email delivery and accessibility/localization work listed in IMPLEMENTATION_STATUS.md remain outstanding.

## Follow-up verification — 2026-11-13

- Re-ran all 17 tests, TypeScript, production build, full dependency audit (including development dependencies) and diff whitespace checks: passed; zero known dependency vulnerabilities reported.
- Chromium with synthetic authentication and intercepted Supabase responses: all 100 course cards render; 99 are initially locked; starting lesson 1 saves to the simulated account; passing lesson 99 unlocks lesson 100; lesson 100 reads correctly at 390px width; a cloud draft hides its bundled published version. Sign-out removes the session token, account drafts and signed-in interface. No JavaScript page errors. These checks do not validate real authentication or server authorization.
- Applied 003 in an isolated PGlite database with the historical 002 progress guard. Verified 89 inserted courses, preservation of score computation, rejection of a locked lesson-100 update, acceptance after passing lesson 99, recalculation of a forged score, and safe rejection on rerun. This does not certify compatibility with the unknown newer deployed trigger.
- Live deployment, Supabase authorization/RLS, actual email/recovery delivery, and independent linguistic/editorial review remain outside the verified scope. Production release is still pending the live steps above.

## Subsequent database and publication status — 2026-11-13

The owner subsequently reported success running the standalone guard extension and `004_lesson_content_only.sql` through the Supabase SQL Editor. Earlier references to an unapplied migration describe the state at review time; do not rerun 003 now. No production database credentials were shared. Live account/security acceptance remains unverified. GitHub API access and CLI authentication now work; the existing main-branch GitHub Pages workflow is the publication path.
