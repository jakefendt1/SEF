# DATA_MODEL.md — Spiral Evaluation Form (Imperial)

## Source of truth

- **Authoritative source:** https://www.intralox.com/resources/evaluation-forms/spiral-imperial (fetched 2026-06-05)
- This is the **Imperial** variant. A Metric variant exists separately and is **not** extracted here.
- The "Spiral Eval Field Form" text Jake pasted is a **rep field-collection subset** of this full form — roughly the System Configuration / System Details portions, minus Personal Info and most of the Application section. The full web form is the superset.
- Built on Gatsby; form is public-facing (customers submit it; an Intralox TSG rep follows up). The field *structure* below is therefore already public.

---

## ⚠️ Read first — IP / hosting / data-handling flag

Per project house rules, flagging before any external-hosting decision gets baked into a brief:

1. **Customer PII.** Personal Info collects name, email, phone, full mailing address, company. An offline-first app on Vercel that stores this in the browser (IndexedDB) and transmits it on reconnect is moving lead/customer PII through a third-party host. Worth a conscious decision, not a default.
2. **Submission target is unresolved.** The real form POSTs to Intralox's own backend and triggers a confirmation email + TSG follow-up. A standalone app **cannot** hit that endpoint without Intralox form infrastructure/auth. So "submits when reconnected" needs a defined destination (your Gmail per WAT, a Google Sheet, a PDF export, or an actual Intralox endpoint you have access to). This is the single biggest open scope question.
3. **Public repo.** The form structure is public, so a repo isn't leaking proprietary methodology. But if submission logic, endpoints, or any internal routing get added later, revisit repo visibility (private by default is the safer call).

None of this blocks the build — it's your call as the business owner. It just shouldn't be decided implicitly.

---

## Form-wide conventions

- **Required** fields are marked `*` below (matches the asterisk convention on the live form).
- **Temperatures are °F and CAN BE NEGATIVE** — freezer/cooler applications routinely run below 0 °F. Do not constrain temp inputs to positive numbers.
- Most numeric fields carry a **fixed unit label** (`in`, `ft`, `fpm`, `°F`). A few carry a **unit selector** (flagged per-field).
- "If other, Specify" free-text fields appear conditionally whenever a parent control's value is **Other**.
- Spiral 1 / Spiral 2: several fields are paired. Spiral 2 is conditional ("if applicable") — see Conditional Logic Map.

---

## Section 1 — Personal Info

| Field | Type | Req | Unit | Options / Constraints |
|---|---|---|---|---|
| Name | text | ✅ | — | |
| Title | text | ✅ | — | |
| Phone | text | ✅ | — | Country code + Area code + Phone number (single combined field on live form) |
| E-mail | email | ✅ | — | valid email |
| Company Name | text | ✅ | — | |
| System Name | text | — | — | Not on the original iLox form; added per TSG request — used for titling SAs/Optimization projects |
| Country or Region | select | ✅ | — | ~150-country list (full list preserved in raw extract; US/Canada most relevant) |
| Address | text | ✅ | — | |
| City | text | ✅ | — | |
| State/Province | text | ✅ | — | free text on live form (not a US-state dropdown) |
| Zip/Postal code | text | ✅ | — | |

---

## Section 2 — Application

| Field | Type | Req | Unit | Options / Constraints |
|---|---|---|---|---|
| Installation type | radio | ✅ | — | New · Retrofit |
| Application Type | radio | ✅ | — | Freezer · Ambient Cooler · Refrigerated Cooler · Proofer · Elevator/Lowerator · Other |
| ↳ If other, Specify | text | cond | — | shown when Application Type = Other |
| Product Processed | text | ✅ | — | |
| How? | radio | ✅ | — | Direct on Belt · Fully Packaged · Open Container |
| Heat source | **multi (checkbox)** | ✅ | — | Oven · Microwave/Convection · Broiler · Fryer · Open Flame · Other Heat Source · No Heat Source — *AMBIGUOUS, see below* |
| ↳ If heat source not listed, Specify | text | ✅* | — | shown when Heat source = Other Heat Source; otherwise enter "N/A" |
| Product Properties | **multi (checkbox)** | ✅ | — | Glazing · Oils · Marinate · Abrasive Ingredients · None (None mutually exclusive) |
| How often is belt cleaned? | select | — | — | Once a Day · Twice daily · Weekly · Twice weekly · Monthly · Yearly · Never |
| Chemicals used | text | — | — | |
| Product Load | number + unit-select | ✅ | lbs/linear ft · lbs/sq ft | |
| Weight Per Piece | number + unit-select | — | lbs · oz | |
| Product Dimensions | 3× number | ✅ | in | L × W × H |
| Production Rate | number + unit-select | — | units/hr · units/min · lbs/hr | |
| Production Hours per day | number | — | — | |
| Loading Pattern | select | — | — | Uniform Across Width · Center · Random |
| How Many Products Across the Width? | number | — | — | |
| Leading Dimension | radio | — | — | Short Side Leading · Long Side Leading |
| Incoming Product Temperature | number | ✅ | °F | can be negative |
| Operating Environment Temperature | number | ✅ | °F | can be negative |
| Minimum Operating Environment Temperature | number | ✅ | °F | can be negative |
| Maximum Operating Environment Temperature | number | ✅ | °F | can be negative |
| Belt Speed | number | ✅ | fpm | |
| Belt Type | radio | — | — | Metal · Plastic |
| Technology | radio | — | — | Friction Drive · DirectDrive |
| Preferred Belt Series | select | — | — | 2200 · 2400 · 2600 · 2700 · 2800 · 2850 · 2900 · 2950 · 22150 · Other |
| ↳ If other, Specify | text | cond | — | shown when Series = Other |
| Belt Accessories | **multi (checkbox)** | — | — | Lane Dividers · Friction · Edge Guards · Other |
| ↳ If other, Specify | text | cond | — | shown when Accessories includes Other |
| Sprocket Bore Size | number | — | in | |
| Additional Comments | textarea | — | — | "List problems or concerns with belt or system" |

---

## Section 3 — System Information

| Field | Type | Req | Unit | Options / Constraints |
|---|---|---|---|---|
| Manufacturer of Spiral | text | ✅ | — | |
| Travel Direction | radio | ✅ | — | Upgo · Downgo · Two Drum, One Belt · One Drum, Two Belt |
| Rotation Direction | radio | ✅ | — | Clockwise · Counter Clockwise |
| Number of Tiers — Spiral 1 | number | ✅ | — | |
| Number of Tiers — Spiral 2 | number | cond | — | "if applicable" |
| Tier Pitch | number | ✅ | in | |
| Take Up Travel Length (max.) | number | ✅ | ft | |
| Take Up Loop | radio | — | — | Single · Double (diagram on live form) |
| Belt Length | number | ✅ | ft | |
| Minimum Roller Diameter | number | — | in | |
| Drum (measurement basis) | select | ✅ | — | Diameter · Radius · Overall System Diameter (including belt) |
| Drum value | number | ✅ | in | meaning depends on selector above — **see diagram reference** |
| Belt Width | number | ✅ | in | |
| Infeed Length (A) | number | ✅ | ft | top-view diagram dim A |
| Discharge Length (B) | number | ✅ | ft | top-view diagram dim B |
| Distance Between Drums | number | cond | ft | shown when Travel Direction = double drum, one belt |
| Configuration — Spiral 1 | select | ✅ | — | 90° · 180° · 270° · 360° |
| Configuration — Spiral 2 | select | cond | — | 90° · 180° · 270° · 360° ("if applicable") |
| Type of return — Spiral 1 | select | ✅ | — | Straight Through · Drum · Freewheel · Slide Rail |
| Type of return — Spiral 2 | select | cond | — | Straight Through · Drum · Freewheel · Slide Rail |

---

## Section 4 — System Details

| Field | Type | Req | Unit | Options / Constraints |
|---|---|---|---|---|
| Number of Rails | select | ✅ | — | 2 · 3 · 4 · 5 |
| Rail Spacing | number | ✅ | in | |
| Overhang | number | ✅ | in | |
| Belt Support Structure Material | radio | — | — | Stainless Steel · Aluminum · Galvanized · Painted Steel |
| Carryway Wearstrip Material | radio | ✅ | — | UHMW · Other |
| ↳ If other, Specify | text | cond | — | |
| Type of Drum | radio | ✅ | — | Cage · Solid |
| Cage Bar Dimensions (A, B, C) | 3× number | cond | in | shown when Type of Drum = Cage; ex. 0.50 |
| Cage Bar Cap Material | select | ✅ | — | UHMW · Nylon · Stainless Steel Cage · Other |
| ↳ If other, Specify | text | cond | — | |
| Cap Profile | radio | — | — | Trapezoidal · Flat · Ribbed · Winged · Other (diagram on live form) |
| ↳ If other, Specify | text | cond | — | |
| Tier Sensors Every Tier? | radio | — | — | Yes · No |
| Take Up Sensors? | **multi (checkbox)** | — | — | Upper · Lower (can be both) |
| Belt Washer | radio | — | — | Yes · No |
| Top Tier Hold Down Safety Rail | radio | — | — | Yes · No |
| Return Path Hold-Down Safety Rail | radio | — | — | Yes · No · Does Not Apply |
| Product Containment Rail On Tiers | radio | — | — | Yes · No |
| Number of Variable Frequency Drives | select | — | — | 0 · 1 · 2 · 3 |

---

## Section 5 — Project Information

Single grouped block on the live form. Free-text fields:

| Field | Type | Req |
|---|---|---|
| Project # | text | — |
| End User Name | text | — |
| End User City | text | — |
| End User State | text | — |
| Line ID or Line # | text | — |

---

## Conditional Logic Map

- **`*Other` → free-text specify** for: Application Type, Heat source, Preferred Belt Series, Belt Accessories, Carryway Wearstrip Material, Cage Bar Cap Material, Cap Profile.
- **Cage Bar Dimensions (A/B/C)** visible only when `Type of Drum = Cage`.
- **Distance Between Drums** visible only when `Travel Direction` indicates a two-drum/double-belt layout.
- **Spiral 2 fields** (Number of Tiers, Configuration, Type of return) are the "if applicable" set — they apply to multi-spiral systems. *The exact trigger condition is unconfirmed (see ambiguities).*

---

## Ambiguities — flag for Jeremy / BDA before encoding

- **AMBIGUOUS — Heat source input mode.** Phrasing "coming from any of the following" implies multi-select, but "No Heat Source" and "Other Heat Source" behave like exclusive options. *Proposed interpretation:* checkboxes, with "No Heat Source" clearing all others. Confirm.
- **AMBIGUOUS — Spiral 2 trigger.** When exactly does the Spiral 2 column become required/visible? Tied to `Travel Direction = Two Drum, One Belt / One Drum, Two Belt`, or an independent "number of spirals" concept? *Proposed interpretation:* show Spiral 2 fields when a two-spiral travel direction is selected. Confirm with a spiral SME.
- **AMBIGUOUS — Required-field behavior for the rep subset.** The full form's required set is tuned for customer submission to Intralox. A rep doing a quick field assessment may not have (or need) Personal Info or every Application field on-site. *Proposed interpretation:* relax `required` for the rep workflow; see scope question. Confirm.
- **AMBIGUOUS — "Heat source not listed, specify" requiredness.** Marked required but instructs "N/A if not applicable." Treat as required-but-accepts-N/A. Confirm whether to auto-fill N/A.

---

## Diagram reference

Jake's uploaded image and the live-form GIFs corroborate three field clusters:

- **Drum measurement basis** (top diagram): shows *Overall System Diameter (Belt + Diameter)*, *Drum Diameter*, and *Radius* as concentric measurements, plus *Belt Width* on the flat run. This is exactly the `Drum (measurement basis)` selector + value field — the single number's meaning changes with the selector.
- **Configuration degrees** (middle row): the 360° / 90° / 180° / 270° wrap diagrams map directly to the `Configuration` selects.
- **Top-view A/B + rail/overhang dims** (bottom): correspond to `Infeed Length (A)`, `Discharge Length (B)`, and the rail-spacing / overhang / cage-bar A-B-C callouts.

Recommend embedding these reference diagrams next to the relevant inputs in the app — they're the kind of thing that makes a "quick assessment" tool unambiguous in the field.
