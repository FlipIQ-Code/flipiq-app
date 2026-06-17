# 🚀 Launch-Day Checklist (FlipIQ → Lucaelos rebrand + go-live)

A step-by-step runbook for taking the app live under the new name. Nothing here
should be done until the **two green lights** below are real. Once they are, the
whole thing is ~20–30 minutes of work.

---

## ✅ Pre-flight — don't start until BOTH are true
- [ ] **Lawyer has cleared the name** "LUCAELOS" (no trademark scrutiny)
- [ ] **Final logo file is in hand** (PNG or SVG) + the brand font is chosen

If either is still pending, stop here. Everything below assumes both are done.

---

## 1. Rebrand the code  *(~10 min — I can do this for you)*
- [ ] Replace the name everywhere: **`FlipIQ` → `Lucaelos`**
  - 33 spots in `index.html`, plus `api/claude.js`, `api/lead.js`, `SETUP.md`
  - Catch the variants too: `FlipIQ™`, the all-caps `FLIPIQ` in the report header
- [ ] Swap the **logo** image (currently a base64 image around line 2643 of `index.html`)
- [ ] Add the **new brand font** (Google Fonts link or `@font-face`) and apply it to the wordmark
- [ ] Update the **download filename** (`flipiq-deal.txt` → `lucaelos-deal.txt`)
- [ ] Update the **AI advisor's** wording that mentions the brand name

> Note: internal keys like the `flipiq_deals` browser-storage key can stay as-is
> (renaming them isn't user-visible and isn't worth the risk). No real users yet,
> so nothing is lost either way.

## 2. Update SEO + sharing tags  *(~3 min)*
- [ ] `<title>` → new name
- [ ] `meta description`, Open Graph (`og:title`, `og:url`, `og:image`), Twitter Card → new name + new domain
- [ ] `canonical` URL → your new domain
- [ ] `og:image` → point at the new logo so link previews look right

## 3. Connect the domain to Vercel  *(~5 min + DNS wait)*
- [ ] In **Vercel → your project → Settings → Domains**, add your new domain (apex + `www`)
- [ ] Vercel will show the **DNS records** to add — typically:
  - Apex (`lucaelos.com`): an **A record** to Vercel's IP
  - `www`: a **CNAME** to `cname.vercel-dns.com`
- [ ] Add those records at your **registrar** (where you bought the domains last weekend)
- [ ] Set the apex ↔ `www` redirect (pick one as primary)
- [ ] Wait for DNS to propagate (minutes to a couple hours) — Vercel auto-issues HTTPS

## 4. Turn on the funnel  *(optional, ~10 min — see SETUP.md)*
- [ ] Connect the **Google Sheet** for lead capture (set `SHEETS_WEBHOOK_URL` in Vercel)
- [ ] Paste a free **Google Analytics ID** to switch analytics on
- [ ] (Or use Vercel's own Analytics — one click in the dashboard)

## 5. Smoke test before announcing  *(~5 min)*
- [ ] Open the new domain over **https** — site loads, new name + logo show everywhere
- [ ] Run a **deal analysis** end to end
- [ ] Try the **AI Advisor** (confirm `/api/claude` responds)
- [ ] **Download a report** → email popup appears → submit → confirm the row lands in your Google Sheet
- [ ] Check it on your **phone** (most flippers will be on mobile)

## 6. Go live 🎉
- [ ] Merge the rebrand branch to `main` (Vercel auto-deploys)
- [ ] Grab the matching **social handles** (Instagram / X / Facebook) under the new name
- [ ] *Then* start the marketing posts in flipper communities (the part we parked)

---

### Where things stand today
- ✅ Domains purchased
- ⏳ Name `LUCAELOS` — awaiting lawyer clearance
- ⏳ Logo — designed, in validation
- 🅿️ Code rebrand — parked until the two green lights above

**When the lawyer clears it and you've got the logo, ping me and I'll run steps 1–2 fast.**
