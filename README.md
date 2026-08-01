# Intralox Account Manager Hub

An offline-capable web app (installable PWA) holding the field tools an Intralox
account manager uses on site:

- **Spiral Eval** — an 85-field evaluation of a customer's spiral conveyor,
  filled out on an iPad in a freezer and exportable as a PDF or spreadsheet.
- **AIM Glide ROI Calculator** — total cost of ownership and ROI for AIM Glide
  against a traditional slat switch, exportable as a customer-facing PDF.

Both tools sit behind one login, so a user's work follows them between devices.

---

## Running it

```bash
npm install
cp .env.example .env.local   # then fill in the Firebase values
npm run dev                  # http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with HMR |
| `npm run build` | Typecheck (`tsc -b`) then production build |
| `npm run typecheck` | Typecheck only |
| `npm run test` | Unit tests (vitest, node environment) |
| `npm run lint` | ESLint |
| `npm run verify` | typecheck + test + lint — run this before pushing |

`.env.local` needs the `VITE_FIREBASE_*` values from the Firebase console
(Project settings → Your apps → Web app). They are public by design: Firebase
web config is not a secret, access is controlled by `firestore.rules`.

---

## How it's put together

```
src/
  schema/        Form contract: field definitions, required rules, sections
  lib/           Pure logic + Firebase adapters (no JSX)
  store/         zustand stores; the only things that talk to Firestore
  components/
    shell/       App chrome: header, back navigation, dashboard
    spiral-eval/ The evaluation tool
    aim-glide/   The ROI calculator
    ui/          shadcn primitives (generated; avoid hand-editing)
  pdf/           React-PDF document for the evaluation export
public/          Static assets, including the in-app measurement diagrams
docs/            Data model, original brief, full-resolution diagram sources
```

Two other files worth knowing about: [`CLAUDE.md`](CLAUDE.md) records the
judgement calls behind the rules below — who the app is for, and which
invariants exist because something specific broke. [`docs/`](docs/README.md)
holds the form's field-level contract with the office.

### The rules that keep this maintainable

**One source of truth per concept, with a test that enforces it.** The bugs
worth knowing about all came from the same shape of mistake: two places
describing the same thing, drifting apart.

| Concept | Lives in | Enforced by |
| --- | --- | --- |
| Form layout preference | `lib/formLayout.ts` | `formLayout.test.ts` |
| Reading records written under the old status model | `lib/db.ts` → `normalizeAssessment` | `db.test.ts` |
| Which fields are required, and when | `schema/formSchema.ts` → `REQUIRED_RULES` | Validation *and* the progress bar are both derived from it |
| Which section a field belongs to | `schema/sectionMap.ts` | `sectionMap.test.ts` asserts every schema field appears in exactly one section |
| What a field means, and whether it can be deferred | `schema/fieldMeta.ts` | — |
| Routes, tool metadata, back-navigation | `lib/navigation.ts` | `navigation.test.ts` |
| How a record is named in the UI | `lib/assessmentTitle.ts` | `assessmentTitle.test.ts` |
| Status wording shown to users | `lib/statusLabels.ts` | — |
| Who may sign up | `lib/allowedEmails.ts` **and** `firestore.rules` | Must be changed together — see the comment in both |
| Brand colour | `--brand` in `index.css` | No `blue-900`/`#1e3a5f` literals in components |
| Stacking order | `--z-app-header` / `--z-page-sticky` / `--z-overlay` | No ad-hoc `z-40` |

**Finishing an evaluation is a local write, not a delivery.** Marking one
complete only flips its status; there is no server to reach and therefore no
failure state. It used to also append a row to a Google Sheet nobody read,
which is where the old `queued` / `synced` / `failed` states came from. Records
written under that model are translated on read by `normalizeAssessment` in
`lib/db.ts` and are never rewritten -- reading a record must not cause a write.

**The form has two layouts and they share one form instance.** Section-by-
section (default) and everything-on-one-page, chosen per device via
`lib/formLayout.ts`. Both render from the same `useForm` in
`SpiralEvalFormShell`, so switching mid-evaluation loses nothing.

**Data safety.** `lib/autosaveGuard.ts` exists because an async Firestore
subscription racing a form mount once silently overwrote completed
evaluations. There are three independent guards (route gate, autosave guard,
store backstop) and they are tested separately on purpose — see
`autosaveGuard.test.ts` and `assessmentsStore.test.ts`. If you touch autosave,
keep all three.

Writes to an evaluation are whole-document (`setDoc`). Anything not restated in
`saveDraft` is erased — this is why `status`, `completedAt` and `title` are
explicitly carried through. Metadata-only changes go through
`updateAssessmentFields` instead.

**The form is a checklist hub, not a wizard.** One `useForm` instance lives in
`SpiralEvalFormShell` and the section screens render as children. A `useForm`
per screen would drop cross-section state on every navigation. Reps fill the
form in the order they physically walk the spiral, so no screen ever blocks
progress; anything they genuinely cannot measure gets marked
"I don't know — measure later" (`unknownFields`) instead of stopping them.

---

## Data model

`users/{uid}` holds the profile. Each user's work lives beneath it:

- `users/{uid}/assessments/{id}` — see `StoredAssessment` in `lib/db.ts`
- `users/{uid}/roiCalculations/{id}` — see `StoredRoiCalculation`

Ownership is per-uid and enforced in `firestore.rules`; no user can read
another's records. [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) has the
field-level detail — it is the contract with the office, and the 100 schema
tests encode it.

---

## Deploying

Pushing to `main` triggers a Vercel production deploy (project
`intralox-am-hub`).

The app is served at **`intralox-am-hub.vercel.app`** — the URL to share.
`sef-bice.vercel.app` is the original address and still resolves to the same
deployment; it is kept alive so existing bookmarks and already-installed PWAs
keep working. Both are project domains assigned to Production, so both track
every deploy. Retiring the old one later is a one-click removal in
**Settings → Domains** (and a matching removal from Firebase's authorized
domains).

There are no serverless functions -- the app is entirely static plus Firebase.

Firestore rules deploy separately and are **not** part of the Vercel build:

```bash
npx firebase-tools deploy --only firestore:rules
```

When adding a domain, add it to **Firebase Console → Authentication → Settings
→ Authorized domains** as well, or sign-in silently fails on the new host.

`vercel.json` rewrites everything to `index.html` (Vercel checks the filesystem
first, so real assets still win). Without that rewrite every deep link 404s —
which is what happened before it was added.

---

## Accounts

Signup is restricted to `@intralox.com`. Exceptions go in `ALLOWLISTED_EMAILS`
(`lib/allowedEmails.ts`) **and** the matching `isAllowlisted()` in
`firestore.rules`. Audit the live account list before changing the rule:

```bash
npx firebase-tools auth:export accounts.json --format=json
```

---

## Testing

Tests are vitest in a node environment — pure logic only, no DOM. That is a
deliberate constraint: it keeps the suite fast and pushes decisions out of
components and into testable modules. UI behaviour is verified by driving the
real app in a browser rather than by mounting components.

The suite is the contract for the form. If a `formSchema` change breaks
`formSchema.test.ts`, that is the test doing its job — the required-field set
is a promise to the office, not an implementation detail.
