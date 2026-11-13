# Ruit UX review

An interactive UX audit of the Ruit seller platform, with a working front end prototype of every proposed fix.

Scope: sidebar navigation, the Products table, adding products (import, single and bulk entry), the product form and its AI assist, linked accounts and product linking.

## Run it

```bash
npm install
npm run dev        # local preview
npm run build      # static build in dist/, relative paths, host anywhere
npm run test:e2e   # 79 functional checks (needs Python Playwright and a build)
```

## How it is organised

| Path | What it holds |
|---|---|
| `src/audit/` | The review layer: intro, issue list (`issues.ts`), spotlight and annotations, current versus improved switching |
| `src/legacy/` | A reconstruction of the current screens, rebuilt from the live platform. Only the behaviour under review is wired up |
| `src/app/` | The proposed design as a working prototype: sidebar, products table, add flows, product form, accounts, link dialog |
| `src/ui/` | Shared pieces: modal, help tip, dismiss hook, toast |
| `src/data/sample.ts` | All sample data. Nothing comes from a real account |
| `src/styles/tokens.css` | Design tokens, sampled from the live interface |
| `docs/` | Findings, developer handoff, accessibility review, research plan |
| `tests/verify.py` | Functional checks for each area in the brief |

Each audit issue is one entry in `src/audit/issues.ts`: the evidence level, the copy, which current screen to show and what to spotlight, and which state of the prototype shows the fix.

## Boundaries

- Front end only. No backend, API, authentication or business rule is touched, and nothing calls Ruit.
- No real customer data, credentials or authenticated screenshots are in this repository. Workspace names, emails and account handles in the reconstruction are placeholders.
- AI suggestions are a fixed sample. No AI service is called.
- Areas outside the review are greyed and labelled "Outside this review".

See `docs/findings.md` for what was inspected, confirmed and assumed.
