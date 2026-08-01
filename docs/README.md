# Documentation

| File | What it is | Still current? |
| --- | --- | --- |
| [`DATA_MODEL.md`](DATA_MODEL.md) | Field-by-field breakdown of the official Intralox Spiral Evaluation Form (Imperial), the source the app's schema was built from. | **Yes** — the reference for what each field means and which are required. |
| [`PROJECT_BRIEF.md`](PROJECT_BRIEF.md) | The original brief for the Spiral Eval field app, before the ROI calculator was merged in. | **Historical.** Useful for the *why*; the tech-stack and file-structure sections are superseded by the README. |
| [`reference-images/`](reference-images/) | Full-resolution source art for the in-app measurement diagrams. | Source assets. The exported, in-app copies live in `public/diagrams/`. |

For how the app is built and the invariants it relies on, see the
[README](../README.md). For the judgement calls behind those invariants, see
[CLAUDE.md](../CLAUDE.md).

## A note on the form's field set

`DATA_MODEL.md` is the contract with the office. The 100 schema tests in
`src/schema/` encode it. If a change to `formSchema.ts` breaks them, that is
the test working as intended — the required-field set is a promise about what
the office receives, not an implementation detail. Change the model
deliberately, with the business, and update both together.
