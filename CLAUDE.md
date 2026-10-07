# CLAUDE.md — Intralox Account Manager Hub

Working notes for anyone (human or AI) picking this up. `README.md` covers what
the app is, how to run it, and how it's structured — read that first. This file
covers the judgement calls that aren't obvious from the code.

## Who this is for

Intralox account managers, on an iPad, often on a plant floor: cold, gloved,
poor signal, frequently over 50. Every design decision defers to that. If a
choice is between "elegant" and "legible at arm's length with a glove on",
pick legible.

Concretely, and non-negotiably:
- Touch targets ≥ 48px. Inputs ≥ 16px text, or iOS Safari zooms the page on
  focus and the user loses their place.
- Plain-language copy. "Didn't send", not "Sync failed". "Not sent yet", not
  "Draft". Wording lives in `lib/statusLabels.ts`, not inline.
- Never a hover-only affordance — there is no hover on a tablet.
- Never `confirm()` / `alert()`. On iOS these render as
  "intralox-am-hub.vercel.app says:" system sheets, which read as scam popups to this
  audience. Use `ui/alert-dialog` or a `sonner` toast.

## Rules that exist because something broke

**Never let the UI claim something happened when it didn't.** Submit used to
say "Assessment saved" on both a successful send and a total network failure.
That whole class of problem is now gone, because there is nothing to send: the
Google Sheet it delivered to was never read by anyone, so delivery was removed
and "Submit" became "Mark as complete" -- a local write with no failure path.
If you ever add a real delivery back, return a discriminated result and branch
on it honestly rather than assuming success.

**Old records keep the old status values forever.** `normalizeAssessment`
translates `queued`/`synced`/`failed` to `complete` on read. Do not be tempted
to "clean them up" with a migration write -- reading a record must never cause
a write, which is the bug class that once destroyed completed evaluations.

**The progress bar and the validator must never be two lists.** They drifted,
and the bar read 100% while Submit bounced the user. Both derive from
`REQUIRED_RULES`. Same for the section map, routes, record titles, and status
wording — see the table in the README. If you add a concept with two possible
homes, give it one home and a test.

**Writes to an assessment are whole-document.** `saveDraft` uses `setDoc`, so
anything it doesn't restate is erased. `status`, `completedAt` and `title` are
carried through explicitly. Metadata-only changes go via
`updateAssessmentFields` (`updateDoc`) instead. Do not "simplify" this to
`setDoc({merge: true})` — merge is deep for maps, so a user could then never
clear a field they'd filled in by mistake.

**Autosave has three independent guards and they all stay.** An async Firestore
subscription racing the form mount once silently overwrote completed
evaluations. Route gate → `shouldAutosave` → store backstop. They are
deliberately redundant; each is tested separately.

**Validate only what the user touched.** Validating a whole section on exit
painted a wall of red on questions they had merely scrolled past.

**Numbers: `0` is an answer, not a blank.** `value || ''` renders a real zero as
an empty box, which made "zero downtime" and "not answered" identical to the
eye while the maths treated them differently.

## Belt Elongation Check

**It saves nothing, and it says so.** The other two tools write to Firestore;
this one is a calculator. There is no record, no delivery, and therefore no
failure state to get wrong. The page tells the user that in as many words
rather than letting them assume a reading was kept. If you ever add saving,
add it as a real write with a real failure path -- do not let a "Save" button
appear that only lives in local state.

**The 3% replacement limit is not an Intralox figure.** The 2026 MPB manual
publishes the 0.5–1% break-in growth (p. 494) but no replacement limit. 3% is a
user-editable default, labelled as needing confirmation from Modular TSG. Do
not promote it to a specification, a constant named `INTRALOX_LIMIT`, or a
sentence that implies the manual says it.

**Readings are typed as whole units plus a fraction from a list.** A single
text box would be less code and wrong: `inputMode="decimal"` gives an iPad the
numeric keypad, which has no "/" on it, so a rep reading "25 and eleven
sixteenths" off a blade would have to convert to 25.6875 in their head on a
plant floor. `parseMeasurement` still accepts typed fractions and feet-inches
for anyone on a laptop.

**Short spans are the failure mode, not the arithmetic.** Over three pitches of
a half-inch belt, one sixteenth of tape error *is* four percent of elongation.
Hence `recommendedPitchCount`, the ± figure next to the result, and the warning
under the pitch count. Don't remove them to tidy the layout.

**The drawn diagram is to scale for the example it labels.** `MeasureDiagram`
is 12 pitches of Series 900 at a fixed px-per-inch, and the caption states the
reading that geometry implies. If you change the example pitch or count, change
the caption with it, or the picture starts teaching a belt that doesn't exist.

## ThermoDrive Bulk Density Calculator

Built from `../TD Bulk Density/Calculator Plan.txt` (the spec) and its
`refs/`. The plan's §9 tests T1–T19 are the contract and live in
`lib/tdBulkDensity/engine.test.ts`.

**The 3D numbers come from a reference prototype, kept in the repo.**
`lib/tdBulkDensity/reference/pile.py` is the plan's Appendix A verbatim. Re-run
it (`python pile.py`, needs NumPy) after any change to `heap3d.ts` or
`spill.ts`; the engine must still match it within 1%.

**No polygon library for the 2D pocket.** The plan asked for
`polygon-clipping`; it throws on the scoop profiles because the free surface
always passes exactly through the flight tip, a polygon vertex. A pocket is one
polygon cut by one half-plane, so `clipBelowSurface` does it exactly. Don't
swap a general clipper back in without the scoop tests passing.

**Spill edges along the pocket follow the flight faces.** An edge at height h
(sidewall tops) runs from the trailing face at u(h) to the leading back face at
s − t + u(h) -- never from x = 0. For 75° and scoop flights x = 0 is behind
the flight; starting there under-counted volume by up to ~44% (fixed in engine
1.1.0, caught by an external audit; the 90° tests couldn't see it). The
75°/scoop plateau tests in `engine.test.ts` guard it.

**The CalcLab waterfall** (`waterfall.ts`): CalcLab (thin flight, walls, static
repose) → real thickness → dynamic derate → flight-end spill. Steps 1–3 are 2D
areas × carry width; the last is the 3D result. Its first step is calibrated
against the Jacksons/Mez CalcLab run.

**Results from the worker are structured clones.** Never compare a result's
`inputs` to the live inputs by identity -- use `inputsKey` (key-sorted JSON).
Identity comparison silently disabled the PDF button.

**Nothing describing a customer's line is pre-filled.** Belt, product, speed
and throughput start blank. Guard clearance has no default on purpose: it
decides whether guards hold product, and a guess would decide it for the rep.
Engineering defaults (75% fill, 5° dynamic derate, 1.0 in hold-down width,
μ 0.3) are labelled as defaults, not manual figures.

**Product presets are not Intralox data.** The UI and the PDF say "typical
range — confirm with customer". Don't drop that wording.

**Length rules allow 0.01 in.** The manual's millimetre figures are rounded
(3.9 in = 99 mm = 3.898 in); without the tolerance a metric user typing the
manual's own number is told they're under the minimum.

**Saving reports what actually happened.** `lib/writeOutcome.ts`: "saved"
only once the server confirms, "on this device, not sent yet" while a write is
queued offline, "didn't save" on refusal. Reopening a run recomputes it and
says if the answer changed; it never writes.

**Open questions — do not encode as fact:**
- The 2.5 in flighted-roller-limiter indent/notch rule (plan §4.3) isn't on the
  manual pages in `refs/`; it's a warning with no page cite until confirmed.
- Max flight length (36 / 32 in) is applied to the whole flight width even when
  notches split it. Unconfirmed whether each notched piece counts separately.
- Hold-down width default (1.0 in) and the customer PDF content are open items
  owned by Jake (plan §12).

## Access: who can use which tool

**Every tool is off until an admin turns it on.** Grants live at
`access/{email}` in Firestore (`lib/access.ts`), edited on the Manage access
page (`/admin`, admins only). Keyed by email, so someone can be approved
before they sign up. Admins are `ADMIN_EMAILS` in `lib/access.ts` **and**
`isAdmin()` in `firestore.rules` -- change both together (a test checks).

**The rules enforce it, not just the dashboard.** Each tool's collection
under `users/{uid}` needs `hasTool('<tool id>')`. A hidden tile alone would
only hide a button.

**Adding a tool:** add it to `TOOLS` in `lib/navigation.ts` (Manage access
gets a switch for it, off for everyone) and wrap its routes in `ToolGate` in
`App.tsx`. If it saves data, add its collection to `TOOL_COLLECTIONS` in
`lib/access.ts` and a `hasTool` match in `firestore.rules`, then deploy the
rules (`npx firebase-tools deploy --only firestore:rules`). A test fails if a
collection is listed without its rule.

**No email verification.** It was tried on 2026-10-07 and dropped: Firebase's
verification emails never reached Intralox inboxes, which locked everyone out.
So the access list trusts the address an account was registered with. The gap
that leaves: someone with an @intralox.com login could register a colleague's
address before the colleague does and inherit any tools pre-approved for it.
Check the Manage access list for names you don't expect. If verification comes
back, it needs a sender Intralox mail accepts (a custom SMTP / domain in
Firebase Authentication -> Templates), not the default one.

**Beta is now just a chip.** `lib/betaAccess.ts` only labels a card "Beta";
who can open it is the grant.

## OneTrack BOM Builder

Built from `../Onetrack/CURSOR_BUILD_PLAN.md` (the spec). Its §8 tests are the
contract and live in `lib/onetrack/*.test.ts`.

**It's in beta.** It carries a "Beta" chip (`lib/betaAccess.ts`); who can
open it is set in Manage access like every other tool.

**Part numbers are trusted as printed** in the OneTrack menu (Jake,
2026-10-05) -- including the p.11 CleanLock roller E7/L6 codes, which pair the
other way round from the sprockets and spacers. Change a part number in
`lib/onetrack/data/menu.ts` and nowhere else, and bump `version.ts`.

**Wearstrip rounds up per rail.** No offcuts shared between rails, no spare %
(Jake, 2026-10-05). Snap-on is sold only in 500 ft lengths; rings and spacers
singly.

**Photos stay on the device.** A Firestore document caps at 1 MB and one
phone photo is bigger. They live in IndexedDB keyed by BOM id, go into the PDF,
and the Photos step says plainly that they don't sync. If you ever sync them,
use Storage with a real failure path -- not the record.

**No CS address, no `mailto:`.** Reps send to their own CS contact, and
`mailto:` can't attach the PDF, which is the one thing CS needs. Share PDF uses
the share sheet where `navigator.canShare({files})` allows it.

**Shafts carry the whole spec sheet.** Both shaft items in the menu open a
worksheet rebuilt from Intralox's Square Shaft Specification Sheet
(`../Onetrack/Shaft Spec Form.pdf`, front side only; the back's "other
configurations" go in the shop notes). The BOM shows a one-line summary; the
sheet downloads as its own PDF (`lib/shaftSpecPdf.ts`) because CS forwards it
to the machine shop. Shaft dimensions print to four decimals, never rounded to
a fraction -- a 3/16 keyway is 0.1875. Chamfer starts at Yes because the paper
form does.

**The catalog is the menu plus the manual's wearstrip pages.** `data/menu.ts`
also carries the 2026 Engineering Manual pp.470-475 (`../Onetrack/full
wearstrip catagog.pdf`), marked `source: 'manual'` so pages cite "Eng. manual
p. 472" rather than a menu page. The four radius part numbers both books list
appear once. The manual prints the eight clip-on / angle numbers without a -00
suffix; they stay as printed until CS says otherwise. The manual gives no
length for the standard edge, tabbed edge and S2400 hold-downs: 10 ft is
assumed, like the menu's radius parts.

**OneTrack flanged is an L.** 1.25 in overall (a 1.0 in wear surface plus a
0.25 in flange), 1.5 in to the wear surface, flange 0.5 in above it. The size
check compares W with 1.25 and H with 1.5.

**Wearstrip profile tiles are generated.** `scripts/render-profiles.mjs`
extrudes each cross-section (traced in inches from the manual / menu
drawings) into the same isometric view, blue and light, and writes
`public/onetrack/iso/<profile id>.svg`. Change a shape there and re-run
`node scripts/render-profiles.mjs`; don't hand-edit the SVGs. They're for
recognising a profile on a tile -- the dimensioned drawings under each "quote
as" option are the reference. The PDF export rasterises them to PNG
(`outputs.ts`), since jsPDF can't embed SVG.

**Part pictures are crops of the menu** (`public/onetrack/menu/`), so a rep
can match what's on screen to the page the customer is holding. Swap a file
for better artwork without renaming it.

**Copy for email never claims a copy it didn't make.** If the clipboard is
refused, the text is shown to copy by hand.

**pdfSafe builds its character class from code points.** Some tooling turns
backslash-u escape sequences into literal characters on write, which lint then
rejects as irregular whitespace. Check the file after editing that regex.

## Open questions — do not encode as fact

- **Quick-mode scope.** `schema/conditionals.ts` notes that Quick mode covering
  all of §3/§4 is a *proposed* interpretation pending confirmation from
  Jeremy/BDA. Changing it alters the required set and breaks tests. It is a
  product decision, not a cleanup opportunity.
## Secrets

There are no server-side secrets left. The Google Sheets integration and its
service-account credential were removed along with the delivery mechanism, so
the app is static files plus Firebase.

Firebase web config (`VITE_FIREBASE_*`) is *not* a secret — it is compiled into
the browser bundle by design, and access is controlled by `firestore.rules`.
The repo still stays private: it carries customer PII flow.

## Before you push

`npm run verify` (typecheck + test + lint) must be clean. Then actually drive
the app in a browser — the test suite is node-only by design and proves logic,
not that the screen works. The things that only reproduce on a real iPad
(the select wheel picker, standalone PWA chrome, the numeric keypad) need a
device; say so rather than implying they were checked.
