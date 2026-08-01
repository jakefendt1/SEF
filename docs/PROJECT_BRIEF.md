# PROJECT_BRIEF.md — Spiral Eval (Offline-First Field App)

> **Historical document.** This is the original brief for Spiral Eval as a
> standalone app, written before the AIM Glide ROI Calculator was merged in and
> before the form was restructured into a checklist hub. It is kept because the
> *why* — who this is for and what it has to survive — is still exactly right.
> Its technical sections (stack versions, file layout, build steps) are
> superseded by [`../README.md`](../README.md).

## What this is

A mobile-first, offline-capable web app that lets an Intralox rep run a spiral conveyor evaluation in the field — including on a plant floor with no connectivity — capture all the data the official Spiral Evaluation Form collects, and have it land in a central Google Sheet once a connection returns. It's a faster, large-format, dropdown-and-selector-driven front end over the same data the public form captures, with the lean rep-collected fields surfaced first for speed and the full field set available on demand. Built as a Vite/React PWA, hosted on Vercel.

## Who uses it and how

- **Primary user:** Intralox reps (you and colleagues) doing on-site spiral assessments.
- **Device:** phone or tablet first; must be fully usable one-handed with gloves-on-sized touch targets. Desktop should work but isn't the design target.
- **Context of use:** plant floors, cold environments (freezer/cooler installs), frequently with poor or no signal. The rep fills what they can on-site, the app holds it safely, and it syncs later.
- **Two depth modes in one form:**
  - **Quick (default):** the lean rep-collected subset (System Info / System Details + a handful of Application essentials), large controls, minimal typing.
  - **Full:** every section expands to the complete ~80-field form for when a thorough capture is warranted.

## Tech stack

Committed recommendations (consistent with your existing Vite/React builds so there's no new stack to learn):

- **Vite 5 + React 18 + TypeScript (strict)** — your established app stack; fast builds, static output Vercel serves trivially.
- **vite-plugin-pwa (Workbox)** — precaches the app shell so the page loads and runs with zero connectivity; handles install-to-home-screen. Mature, the standard for Vite PWAs.
- **Tailwind CSS 3** — your standard; utility classes make large-font, big-touch-target layouts fast to build.
- **react-hook-form + zod** — your MITQ stack; the right tools for ~80 fields with conditional visibility and a required-set that differs between Quick and Full modes.
- **Zustand + persist** — your standard; holds app-level state (the saved-assessments list and each one's sync status).
- **idb (IndexedDB wrapper)** — durable local storage for in-progress drafts and the outbound submission queue. Survives browser/app restarts.
- **@react-pdf/renderer** — your MITQ stack; generates the assessment as a PDF entirely client-side, so it works offline.
- **Vercel serverless function (`/api/submit`)** — Vercel runs functions from a top-level `/api` folder even for a Vite project; this is the only server piece.
- **googleapis (service-account auth)** — the function appends a row to the target Google Sheet.
- **Dev tooling:** Vite, ESLint, Prettier, **Vitest** for the logic modules only (zod schema, conditional-visibility resolver, Quick/Full field partition).

**Tradeoff flagged, then decided:** Next.js is the "native Vercel" choice and bundles API routes, but its PWA story is weaker and it'd be a new framework for you. Vite + a `/api` serverless function gets the same result on your familiar stack with the better offline tooling. Going Vite.

**Offline-sync design note:** Don't rely on the Background Sync API as the primary mechanism — iOS Safari support is unreliable and reps will be on iPhones/iPads. Primary mechanism is a self-managed **idb queue flushed on the `online` event with retry/backoff**; Background Sync can layer on as a progressive enhancement where supported.

## Feature requirements — full scope

### Form engine
- Single sectioned form: Personal Info, Application, System Information, System Details, Project Information (per `DATA_MODEL.md`).
- Quick/Full toggle. Quick shows the lean subset and big controls; each section has an "Add full detail" expansion revealing the rest.
- All field types from the data model: text, email, number (with the noted unit selectors), single-select dropdowns, radio groups, multi-select checkbox groups, 3-part dimension inputs (L×W×H, cage bar A/B/C), textarea.
- **Conditional visibility** driven by the data model: every "If other, specify," Cage Bar Dimensions (Drum = Cage), Distance Between Drums (double-drum travel direction), and the Spiral 2 column.
- **Validation:** required-set enforced per mode; temps allow negatives; numeric guards. Inline, plain-language errors.
- Embedded reference diagrams next to the relevant inputs (drum measurement basis, configuration degrees, cage bar dims) — see source notes.

### Offline + persistence
- App shell precached; loads and is fully interactive offline after first visit.
- **Draft autosave** to IndexedDB on every change — closing/reopening never loses work.
- **Saved assessments list** with per-item sync status: `Draft` · `Queued` · `Synced` · `Failed`.
- Installable PWA (home-screen icon, standalone display).

### Submission + sync
- "Submit" packages the assessment and attempts `POST /api/submit`.
- Online → function appends a row to the Google Sheet → status `Synced`.
- Offline or failed → enqueued in idb, status `Queued`; auto-flush on reconnect with retry; status updates to `Synced` or `Failed` (with manual retry).
- Submissions are idempotent (client-generated assessment ID) so a retry never double-writes.

### PDF export
- "Export PDF" available on any assessment at any time, fully offline — a formatted, shareable record the rep keeps regardless of sync.

## Out of scope for v1

- Posting to Intralox's actual form backend / triggering the real TSG follow-up (the app can't reach that endpoint).
- Email delivery to you/TSG (Gmail) — deferred to v1.1.
- User accounts / authentication / login.
- The Metric form variant.
- Server-side editing of an already-synced submission.
- Multi-language (the live form's language switcher).
- Photo / file attachments from the field (a strong v1.1 candidate).

## Success criteria

1. Load the deployed URL once while online, then go to airplane mode → the app still loads and every screen is usable.
2. Complete a Quick assessment (lean fields only) and Submit while online → a correctly mapped row appears in the Google Sheet.
3. Complete an assessment fully offline and Submit → status shows `Queued` → reconnect → the row appears in the Sheet automatically, with no duplicate and no re-submit action.
4. In Full mode, conditional fields behave: selecting Drum = Cage reveals Cage Bar Dimensions; choosing "Other" anywhere reveals its specify field.
5. Export any assessment as a PDF while offline and open it.
6. Close the browser/app mid-form, reopen → the in-progress draft is intact.
7. Install the app to a phone home screen and launch it standalone.

## Build approach I want you to take

Checkpoint after every step — pause for my review before continuing.

1. **Scaffold + deploy shell.** Vite + React + TS + Tailwind + vite-plugin-pwa. Deploy the empty shell to Vercel; confirm it loads in airplane mode. **PAUSE.**
2. **Data model → schema.** Encode `DATA_MODEL.md` as a zod schema + a field-config that marks Quick vs Full and the conditional rules. Unit-test the schema and the conditional resolver. **PAUSE.**
3. **Form UI.** Sectioned form, Quick default with Full expansion, large controls, embedded diagrams. No persistence yet. **PAUSE.**
4. **Persistence.** Draft autosave + saved-assessments list in IndexedDB; Zustand for list/status state. **PAUSE.**
5. **Submission (online path).** `/api/submit` serverless → Google Sheets append; wire client Submit; verify a real row lands. **PAUSE.**
6. **Offline queue + sync.** idb queue, online-event flush, retry/backoff, idempotent IDs; test airplane→reconnect. **PAUSE.**
7. **PDF export.** @react-pdf/renderer; offline-verified. **PAUSE.**
8. **Polish.** Validation copy, completeness indicator, install prompt, status UI. Final review.

## Notes on source materials

- **`DATA_MODEL.md` is the field source of truth.** Field names, types, options, units, and conditional logic come from there, not from memory of the form.
- **Open questions for Jeremy / BDA** (flagged in the data model) should be resolved before step 2 hardens: heat-source multi-select behavior, the exact Spiral 2 trigger condition, and which fields stay required in the rep (Quick) workflow.
- **Diagrams:** the live form pulls GIFs from Intralox's CDN — those won't work offline. Bundle local copies: use Jake's uploaded geometry image and/or simple redrawn SVGs for drum measurement, configuration degrees, and cage bar dims. Avoid hotlinking the CDN.
- **IP / PII:** form structure is public, so the repo isn't leaking methodology — but it carries customer PII (name/email/phone/address) and will hold the Google service-account credential. Keep the repo **private**, secrets in env only (never committed), and the service-account key out of the client bundle (server function only).
- **No WAT workflow doc for this one** — it's a standalone app, not an agent/tools automation pipeline, so the WAT `workflows/`+`tools/` structure doesn't apply. The base CLAUDE.md still governs secret-handling and paid-API approval.
