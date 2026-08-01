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
  "sef-bice.vercel.app says:" system sheets, which read as scam popups to this
  audience. Use `ui/alert-dialog` or a `sonner` toast.

## Rules that exist because something broke

**Never let the UI claim something happened when it didn't.** Submit used to
say "Assessment saved" on both a successful send and a total network failure.
`submitAssessment` returns a discriminated result; branch on it honestly.

**The progress bar and the validator must never be two lists.** They drifted,
and the bar read 100% while Submit bounced the user. Both derive from
`REQUIRED_RULES`. Same for the section map, routes, record titles, and status
wording — see the table in the README. If you add a concept with two possible
homes, give it one home and a test.

**Writes to an assessment are whole-document.** `saveDraft` uses `setDoc`, so
anything it doesn't restate is erased. `status`, `syncedAt` and `title` are
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
- **Sheet column order.** Agreed once and frozen. If a field's mapping is
  unclear, ask — don't invent a column.

## Secrets

The Google service-account credential is read only by `api/submit.ts`, only
from a Vercel environment variable. It must never appear in the client bundle
(anything `VITE_`-prefixed is compiled into it), a committed file, or a log
line. The repo stays private: it carries customer PII flow.

Firebase web config (`VITE_FIREBASE_*`) is *not* a secret — access is
controlled by `firestore.rules`.

## Before you push

`npm run verify` (typecheck + test + lint) must be clean. Then actually drive
the app in a browser — the test suite is node-only by design and proves logic,
not that the screen works. The things that only reproduce on a real iPad
(the select wheel picker, standalone PWA chrome, the numeric keypad) need a
device; say so rather than implying they were checked.
