# Intralox Account Manager Hub

An offline-capable web app (installable PWA) holding the field tools an Intralox
account manager uses on site:

- **Spiral Eval** — an 85-field evaluation of a customer's spiral conveyor,
  filled out on an iPad in a freezer and exportable as a PDF or spreadsheet.
- **AIM Glide ROI Calculator** — total cost of ownership and ROI for AIM Glide
  against a traditional slat switch, exportable as a customer-facing PDF.
- **Belt Elongation Check** — works out how far a belt has stretched from a
  pitch count and a tape measure, for the visit where nobody has the Intralox
  elongation ruler. A calculator, not a record: it saves nothing.
- **ThermoDrive Bulk Density Calculator** — how much a flighted ThermoDrive
  incline carries per flight, the belt speed a line needs, and what sidewalls
  or guards add, with a 3D view of the pocket. Replaces CalcLab's Bulk Density
  Calculator. Runs can be saved and exported as a customer or internal PDF,
  and two runs (say a 24 in and a 30 in belt) compared side by side.
- **ThermoDrive Belt Configurator** (beta) — lays out a ThermoDrive belt
  (flights and notches, sidewalls, V-guides, splice, ThermoLace repair,
  sections) and checks it against the fabrication rules, with a 3D view and a
  build sheet for CS. Rebuilt from Patrick's Belt Configurator; saves nothing.
  Belts move between it and the Bulk Density calculator by link.
- **OneTrack BOM Builder** (beta) — pick OneTrack parts on the plant floor,
  measure wearstrip with a guided worksheet, and send CS a part-numbered BOM
  as a PDF or pasted into an email.

The tools sit behind one login, so a user's work follows them between devices.

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
    tdBulkDensity/ The bulk density engine (pure TS, runs in a Web Worker),
                 manual data tables, rules, and reference/pile.py
    thermodrive/ Belt rules shared by both ThermoDrive tools, ported from
                 Patrick's configurator, plus the hand-off and build sheet
  store/         zustand stores; the only things that talk to Firestore
  components/
    shell/       App chrome: header, back navigation, dashboard
    spiral-eval/ The evaluation tool
    aim-glide/   The ROI calculator
    belt-elongation/ The elongation check, including the drawn how-to-measure
                 diagram and tape-measure reference
    td-bulk-density/ The bulk density calculator's screens, views and charts
    td-configurator/ The belt configurator's panels, 2D/3D views, build sheet
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
| Nominal pitch per belt series | `schema/beltSeries.ts` | `beltElongation.test.ts` asserts no duplicate series and a usable pitch for each |
| Elongation thresholds *and the wording that goes with them* | `lib/beltElongation.ts` → `verdictFor` | `beltElongation.test.ts`; the gauge, the pill and the big number all style from `belt-elongation/levelStyles.ts` |
| Bulk density manual tables (flights, sidewalls, indents) | `lib/tdBulkDensity/data/` | `engine.test.ts`; the dropdowns and the rule checks both read `rules.ts` → `availableOptions` |
| ThermoDrive belt rules (pitch, rows, splice, sidewall gap, V-guides, max section, ThermoLace, sections) | `lib/thermodrive/` (`data.ts` is Patrick's constants verbatim) | `parity.test.ts` matches his own page on 9 belts; Bulk Density's spacing check reads `rows.ts` |
| Bulk density illustration colours | `components/td-bulk-density/palette.ts` | Every view, the legend and the charts read it |
| OneTrack part numbers, descriptions, units | `lib/onetrack/data/menu.ts` (raw, from `../Onetrack/data/onetrack-catalog.json`) → `lib/onetrack/catalog.ts` | `catalog.test.ts`: 95 part numbers, all well-formed and unique |
| OneTrack categories and filter chips | `lib/onetrack/categories.ts` | `catalog.test.ts` asserts every chip key exists on every item |
| Wearstrip profiles and "quote as" options | `lib/onetrack/profiles.ts` (colors and frame sizes come from the catalog) | `catalog.test.ts` checks every picture exists under `public/` |
| What's on a OneTrack BOM, in what order | `lib/onetrack/bom.ts` → `resolveBom` | The panel, Review, PDF and email text all call it |
| Who can use which tool | `access/{email}` in Firestore, edited at `/admin`; logic in `lib/access.ts`; enforced in `firestore.rules` | `access.test.ts` (incl. that the rules' admin list and tool rules match) |
| Which tools show a Beta chip | `lib/betaAccess.ts` | `betaAccess.test.ts` |
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
- `users/{uid}/tdBulkDensityRuns/{id}` — see `StoredTdRun` in
  `lib/tdBulkDensityRecord.ts`: all inputs (canonical units), the units they
  were typed in, the engine version and a results snapshot

- `access/{email}` — which tools that person can use (`AccessGrant` in
  `lib/access.ts`); admins only can write it
- `users/{uid}/onetrackBoms/{id}` — see `StoredOnetrackBom` in
  `lib/onetrackRecord.ts`: the job, the lines as chosen (item ids and
  quantities, or the wearstrip worksheet in canonical inches), and a snapshot
  of the part numbers and quantities they produced. Photos are **not** in it:
  they stay in the device's IndexedDB (`lib/onetrack/photos.ts`)

The Belt Elongation Check and the Belt Configurator have no collection: they
compute and discard.

- `accessRequests/{email}__{toolId}` — a request for a greyed-out tool
  (`lib/accessRequests.ts`); the requester writes their own, the admin reads
  and clears them

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
