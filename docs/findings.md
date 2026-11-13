# Findings

Inspected on 13 November 2026 in the reviewer's signed in session at app.ruit.es, at 1440 and 1100 pixels wide. Read only: no product, listing or account connection was created, published, changed or deleted.

## What was inspected

- Sidebar, expanded and collapsed, including hover and click on Buy, Inventory, Linked accounts and Settings
- Products table: columns, horizontal scroll, row hover, row menu
- Add products dialog and the Import Listings marketplace picker
- Create Product form, opened through "Complete" on the existing blank draft: summary, help tips, More options, Fill with AI without a photo
- Linked accounts page

The app is a Flutter web build drawn to a canvas, so findings come from the rendered screen and its semantics tree, not from DOM or CSS inspection.

## Confirmed on the live platform

| # | Issue | What we saw |
|---|---|---|
| 1 | Logo jumps on collapse | The "ruit" wordmark is replaced by a separate "r" mark at a different position. The bell moves from beside the logo to below it. Below about 1100px the bell moves again, into the page header |
| 2 | Mixed submenu behaviour | Inventory: click, accordion, arrow visible. Buy and Settings: hover flyout, arrow only on hover. Clicking Buy also navigates and collapses Inventory |
| 3 | Collapsed sidebar | Hover shows a tooltip only. Clicking a group icon expands the whole sidebar |
| 4 | Lost place while creating | Breadcrumb "Sell > Create Product". Inventory stays highlighted with its children hidden |
| 5 | Fixed column widths | With 2 rows the table scrolls sideways at 1440px. Status and Source sit behind the pinned Actions column |
| 6 | Edit icon distance | For "Test" the icon is about 150px from the text, at the cell's right edge, hover only |
| 7 | No linked account view | Publications column empty, Source shows the sign up email, row menu has no linking action |
| 8 | Naming | "Add products" button, "Add to Inventory" dialog, "Create Product" option and page |
| 9 | Equal hierarchy | Two identical cards with identical primary buttons |
| 10 | One product at a time | Single long form, no way to add another without leaving |
| 11 | Stock tick | Stock Quantity is ticked on open because the field defaults to 1 |
| 12 | Early error | "6 required fields missing" in red is shown on open. There is no separate submit button in view |
| 13 | AI prerequisite | Button looks active. Without a photo a toast appears at the bottom: "Please add at least one image to generate product information". Its tooltip does not mention photos. The banner text does mention adding a photo |
| 14 | Help | Icons about 10px. The "How you deliver it" tip is one line about 1180px wide that covers the field |
| 16 | Accounts page | Account name, status and a publish warning. No product counts, no product list |

## Reported, and how it compares

- **"6 required" after clicking AI.** Not reproduced as described. The message is present from the moment the form opens, so the AI button is not the trigger. Clicking AI did not mark any field invalid.
- **Overflow in More options (15).** Partly confirmed. The euro sign sits on the right border of Price and Purchase cost. We did not type long values, because the form may auto save into a real draft.

## Not inspected, and why

- **Publish flow.** Opening it was blocked as an action that could change live listings. Account selection during publishing is therefore a proposal.
- **Starting a new Create Product from the dialog.** A blank draft already exists in the account, which suggests the form saves on open. We used that draft through "Complete" instead.
- **Importing from eBay.** Selecting the marketplace could start an import.
- **Multiple accounts.** The account has one eBay account, so every multi account scene uses sample data.

## Assumptions and proposals

- Import first is a hypothesis: Ruit's onboarding starts by connecting marketplaces, so most new sellers arrive with listings. Validate with usage data (see `research-plan.md`).
- Unlinking an account from a listed product does not end the listing. The dialog says so. Confirm the real rule.
- Link states are "Linked, not listed", "Listed" and "Needs attention". Map these to the real publication states.
- Required fields in the prototype follow the live summary: photos, price, delivery, title, description, condition, with stock defaulting to 1.
- The primary green is one step darker than live (#267a0b) so white text passes 4.5:1.

## Pattern references

- Click activated menus over hover: NN/g, Menu design checklist, https://www.nngroup.com/articles/menu-design/
- Disclosure pattern for navigation, with `aria-expanded` buttons: W3C APG, https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/
- Caret as the clearest "this expands" signal: NN/g accordion icon study, summarised at https://smart-interface-design-patterns.com/articles/accordion-icons/
- Index tables, row actions and bulk actions: Shopify, https://shopify.dev/docs/api/app-home/patterns/index
- Inline editing for simple rows, wrapping for critical text: Basis design system, https://design.basis.com/components/data-table
