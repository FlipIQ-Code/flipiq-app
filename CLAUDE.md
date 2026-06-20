# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

FlipIQ™ is an AI-powered house-flipping deal analyzer. It is a single-page React
app deployed on Vercel, consisting of exactly two source files plus a deploy
config — there is **no build step, no package.json, no test suite, and no
node_modules**. The entire frontend is one static HTML file; the only backend is
one serverless function that proxies Anthropic's API.

## Project layout

- `index.html` — the entire frontend (~2,570 lines). React 18 is loaded from a
  CDN (`unpkg`) as a global `<script>`; there is no JSX and no bundler. All
  components are authored as **pre-compiled `React.createElement` calls** (the
  output of Babel's transform), so the file includes Babel helper polyfills at
  the top (`_objectSpread`, `_slicedToArray`, etc.). The app mounts at the very
  bottom via `ReactDOM.createRoot(...).render(React.createElement(App))`.
- `api/claude.js` — a Vercel serverless function (ES module, `export default
  handler`) that proxies requests to the Anthropic Messages API. This is the
  only place the API key is used.
- `vercel.json` — rewrites: `/api/claude` hits the function; everything else
  serves `index.html` (SPA fallback).

## Running and deploying

- **Local preview:** open `index.html` directly, or serve statically (e.g.
  `npx serve` / `python3 -m http.server`). Note the AI features call
  `/api/claude`, which only exists under the Vercel runtime — they will fail
  against a plain static server. Use `vercel dev` to run the function locally.
- **Deploy:** push to the connected Vercel project. `ANTHROPIC_API_KEY` must be
  set as a Vercel environment variable for the proxy to work.
- There are no lint/test/build commands to run before committing.

## Architecture

### Single-key backend proxy (`api/claude.js`)
The frontend never holds the Anthropic key. It POSTs `{ model, max_tokens,
messages, system }` to `/api/claude`, which:
- enforces **in-memory per-IP rate limiting** (10 requests/IP/hour; resets on
  serverless cold start — intentionally not durable),
- **caps `max_tokens` at 1500** server-side to control cost,
- forwards to `https://api.anthropic.com/v1/messages` with the `x-api-key` and
  `anthropic-version: 2023-06-01` headers, and returns the raw Anthropic
  response (frontend reads `data.content[0].text`).

### Frontend: tabbed single-page app
`App` holds one `tab` state and renders one of four feature components. Each
feature is a self-contained component managing its own local state — there is no
shared store, router, or context. The four tabs (defined in the `tabs` array in
`App`):

- `deal` → **`DealAnalyzer`** — the main view. Computes deal economics locally,
  then optionally calls the AI for a verdict. Hosts two collapsible sub-tools:
  **`RehabEstimator`** (line-item repair cost calculator using national-average
  constants) and **`CompsValidator`** (sanity-checks ARV against entered comps).
- `offer` → **`OfferGenerator`** — asks the AI for offer prices per exit
  strategy; the prompt demands a **strict JSON** response that the component
  parses.
- `advisor` → **`AIAdvisor`** — a chat interface; the only call that uses the
  `system` field and sends multi-turn `messages`.
- `compare` → **`DealCompare`** — scores two deals head-to-head using the same
  local math, no AI call.

`InlineDisclaimer` is rendered at the bottom of every feature.

### Deal math lives on the client (single source of truth)
The core financial model is **duplicated** in `DealAnalyzer` (~line 685) and
`DealCompare` (~line 2184) — if you change one, change both. The model:
- closing-buy = `purchase * 0.02`, closing-sell = `arv * 0.08`, holding =
  `purchase * 0.006 * months` (+ financing),
- `allIn = purchase + rehab + closing + holding`, `profit = arv - allIn`,
  `roi = profit / allIn`,
- **MAO** (Max Allowable Offer) = `arv * 0.70 - rehab` (the "70% rule"),
- **Deal Score (0–100)** = weighted sum of ROI band (≤40), purchase-vs-MAO band
  (≤40), and profit band (≤20).
These computed values are what get passed into the AI prompt — the AI explains
the numbers, it does not compute them.

### Persistence
Saved deals are stored in `localStorage` under the key **`flipiq_deals`**
(capped at the 20 most recent). There is no database or server-side state.

### Styling
A single shared palette object `C` (dark theme, lime accent `#AAFF3A`) defines
all colors; components use inline `style` objects throughout. There are no CSS
files or class-based styling.

## Conventions when editing

- **Do not introduce JSX, a bundler, or a build step.** New UI must be written as
  `React.createElement(...)` to match the existing pre-compiled style and remain
  runnable as a static file. (If authoring in JSX, compile it to
  `React.createElement` before committing.)
- Reuse the `C` palette and the existing helpers `fmt` (currency) and `pct`
  (percent) rather than re-formatting inline.
- The product is explicitly an **estimation tool, not financial/legal advice** —
  every AI prompt instructs the model to remind users that outputs are estimates
  only, and `InlineDisclaimer` reinforces this in the UI. Preserve these
  disclaimers when touching prompts or feature components.
- Keep model selection and token caps consistent with the proxy: the proxy
  defaults to `claude-sonnet-4-6` and hard-caps `max_tokens` at 1500.

## Git workflow

Active development branch: `claude/claude-md-docs-sei363`. Default branch:
`main`. Push with `git push -u origin <branch>`; do not open PRs unless asked.
