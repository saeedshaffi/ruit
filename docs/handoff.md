# Developer handoff

The production app is Flutter. Treat the React prototype as the behaviour spec, not as code to port. Tokens are in `src/styles/tokens.css`.

## Tokens

| Token | Value | Use |
|---|---|---|
| `--green` | #267a0b | Primary buttons, focus ring, active indicator |
| `--green-tint` | #ecf9e2 | Active nav item, selected option |
| `--ink` / `--ink-2` / `--ink-3` | #1b1d1a / #474b45 / #6a6f67 | Text, secondary, hints |
| `--line` / `--line-strong` | #e3e5e0 / #c9ccc5 | Dividers, field borders |
| `--red`, `--amber`, `--violet-tint` | #c0312b, #8a5a00, #ebe8fb | Errors, attention, AI |
| `--r-md`, `--r-lg`, `--r-pill` | 10, 14, 999px | Fields, cards, buttons |
| `--nav` / `--rail` | 240 / 72px | Sidebar expanded / collapsed |
| `--t-nav`, `--t-fast`, `--ease` | 220ms, 140ms, cubic-bezier(0.16, 1, 0.3, 1) | Sidebar, hovers |

## Sidebar

| Element | State | Behaviour |
|---|---|---|
| Logo | Both | One wordmark. The "r" keeps its position. "uit" clips to zero width and fades over 220ms |
| Group (Buy, Inventory, Settings) | Expanded sidebar | Button with `aria-expanded`. Arrow always visible. Click toggles. Never navigates, never opens on hover |
| Group | Collapsed | Click opens a popover beside the icon with the group name and its pages. Sidebar stays collapsed. Escape or outside click closes, focus returns to the icon |
| Any item | Collapsed, hover or focus | Tooltip with the name only |
| Current page | Both | Leaf has `aria-current="page"`. Parent shows the green bar, also when closed or collapsed |
| Keyboard | Both | Tab order follows reading order. Up and Down move between visible items. Enter or Space activates |

Do not relocate anything else in the sidebar header on collapse. The bell lives in the top bar.

## Products table

- Layout: fixed widths for Price 124, Stock 86, Condition 104, Linked accounts 236, Status 118, Actions 88. Product takes the rest. No horizontal scroll from 1100px viewport. Below that, scroll with the product column sticky.
- Product name: up to 2 lines, then ellipsis, full name in a tooltip. Empty: "Untitled draft". Empty price or condition: "Not set".
- Inline edit: 26px button directly after the text, always in the layout, 45% opacity at rest, full on row hover or focus. Enter or click edits. Enter or blur saves. Escape cancels and restores focus.
- Linked accounts cell: up to 2 named account chips (marketplace tile, account name, state dot), then "+N". Filled dot listed, hollow linked, amber needs attention plus a warning icon. Click opens a popover with one line per account and "Manage links". Empty: "Not linked" and a "Link accounts" link.
- Row actions: link button and a menu that starts with "Link accounts".

## Add products

- Entry dialog titled "Add products". Import listings is the only primary button. Add manually is secondary.
- Manual entry page: breadcrumb Inventory > Products > Add product (or Add products), back arrow to Products, switch between "One product" and "Several products".
- Bulk grid columns: #, Photos, Title, Price, Stock, Condition, Delivery, Row status, row actions (More details, Duplicate, Remove).
- Shared values: Condition and Delivery. A row with no own value shows "Shared: value". Choosing a value in the row overrides it.
- Validation: nothing is red on load. A cell turns invalid after it is left empty or after Review. Row status reads "Empty", "N to fill", "Ready", or the error text. Blank rows are ignored. A failed review focuses the first invalid cell and keeps all input.
- Review step lists every product. "Add N products" commits. "Back to editing" keeps state.
- Shortcuts: Enter in the last row adds a row. Pasting several lines into a title fills one row per line.

## Product form

| Element | State | Behaviour |
|---|---|---|
| Summary item | To do / Done / Default / Missing | Hollow circle / green tick / dashed circle with "Default: 1" / red after a submit attempt |
| Required count | Before submit | Neutral: "6 required fields left" |
| Required count | After a failed submit | Red: "Fill in N more fields to add this product" |
| Field error | After blur when empty, or after submit | Message under the field, `aria-invalid`, `aria-describedby` |
| AI block | No photo | States the requirement. Button "Add a photo first" scrolls to and focuses the uploader |
| AI block | Loading | "Reading N photos…", progress bar, Cancel |
| AI block | Success | Review list, one tick box per field. Fields the user already filled start unticked and show their current value |
| AI block | Failure | "We could not read the photos", Try again, form untouched |
| Applied suggestion | Until edited | "Suggested, check it" tag on the field |
| Help | Any | 28px button, opens on click, Enter or tap. Max width 280px. Long content becomes an inline expandable list |
| Photos | Any | Tile per photo, first is Cover, "Make cover" on the others, remove button on each, count "n of 20" |

## Accounts and linking

- Linked accounts page groups accounts by marketplace. Each account shows name, handle, connection status, and counts for linked, listed and needs attention. "View products" expands the product list in place.
- Link dialog: accounts grouped by marketplace, one tick box each, several per marketplace allowed. Existing links show their state. The footer lists "Will link" and "Will unlink" before Apply. Apply is disabled with no changes. Confirmation ends with "Nothing was published".

## Edge cases to carry over

- Long account names truncate inside the chip. Long tags wrap inside the tag field.
- Currency symbols sit inside the field padding, never on the border.
- An account that needs attention stays selectable in the link dialog and shows why.
- Zero products for an account: "No products yet", button disabled.

## Motion

| Element | Trigger | Animation | Duration |
|---|---|---|---|
| Sidebar | Collapse or expand | Width, logo letters clip | 220ms ease out |
| Popovers | Open | Fade and 4px slide | 140ms |
| Dialog | Open | Fade and 10px rise | 240ms |
| New rows | After adding | Green tint fades out | 2.6s |

All motion collapses to instant with `prefers-reduced-motion`.
