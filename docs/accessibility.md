# Accessibility review

Standard used: WCAG 2.2 AA, named here as the reference. Ruit states no accessibility rule of its own that we could find. This is a design level review, not a conformance statement. Other criteria were not checked.

## Live platform

| # | Finding | Criterion | Severity |
|---|---|---|---|
| 1 | The app renders to a canvas. The accessibility tree is off until a hidden "Enable accessibility" control is activated | 4.1.2, 1.3.1 | Critical |
| 2 | Buy and Settings submenus open only on hover in the expanded sidebar | 2.1.1 | Major |
| 3 | Inline edit icons appear only on row hover | 2.1.1, 1.4.13 | Major |
| 4 | Help tips open only on hover. Icons are about 10px | 2.1.1, 2.5.8 | Major |
| 5 | The long help tip covers the field it describes and cannot be dismissed without moving the pointer | 1.4.13 | Major |
| 6 | "6 required fields missing" is shown before any input, so real errors are not distinguishable | 3.3.1 | Minor |
| 7 | White on the live primary green (about #2f8f0f) is about 4.1:1 for 14px bold text | 1.4.3 | Minor |
| 8 | Summary states rely on a green tick versus a grey circle with green text | 1.4.1 | Minor |

Could not evaluate: focus order and focus visibility in the live Flutter build, screen reader output, behaviour at 200% zoom.

## Prototype

| Subject | What it does |
|---|---|
| Contrast | Text pairs checked at 4.5:1 or better: ink on white, hint grey #6a6f67 on white (5.2:1), white on #267a0b (5.4:1), amber and red on their tints. Greyed "Outside this review" items are disabled and exempt |
| Focus | 2px green ring with 2px offset on every control. Amber ring on the dark review bar |
| Keyboard | Every prototype control is a button, link, input or select. Dialogs trap focus and return it on close. Popovers close on Escape and return focus to their trigger. Sidebar adds Up and Down |
| Labels | Every field has a visible label tied by `for`. Errors are tied with `aria-describedby` and `aria-invalid`. Grid cells are labelled "Row n title" and so on |
| Text alternatives | Icon only buttons have `aria-label`. Decorative icons are hidden from assistive tech. Link state uses dot shape plus text in the popover, not colour alone |
| Target size | Smallest targets are 24px (tag remove) and 26px (inline edit). Help buttons are 28px |
| Structure | One `h1` per page in the breadcrumb, `nav` landmarks for main navigation and breadcrumb, real tables with `scope`, `fieldset` and `legend` for shared values and account groups |

Could not evaluate in the prototype: real screen reader output (not run with VoiceOver or NVDA), and the Flutter implementation of any of this.

## Priority fixes for the live product

1. Turn Flutter semantics on by default, so assistive tech works without a hidden switch.
2. Make submenus, inline edit and help reachable without hover.
3. Separate "fields left" from validation errors.
