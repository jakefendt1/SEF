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
