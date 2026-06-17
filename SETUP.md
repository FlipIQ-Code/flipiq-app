# FlipIQ™ — Lead Capture, Analytics & SEO Setup

This release adds three money-making building blocks to FlipIQ:

1. **Email lead capture** — when a visitor downloads a deal report, they're asked
   for their email first. Emails are stored in a Google Sheet you own.
2. **Analytics** — Google Analytics 4 hooks (page views + key events like
   `lead_captured` and `report_download`).
3. **SEO** — meta description, Open Graph, and Twitter tags so the site shows up
   in search and looks good when shared.

Lead capture and analytics each need a one-time, ~5-minute setup. Until you do
them, the app still works perfectly — leads just aren't stored and analytics is
off. Nothing breaks if you skip them.

---

## 1. Lead capture → Google Sheet (≈5 min)

Leads flow: **browser → `/api/lead` (Vercel) → Google Apps Script → your Sheet.**
The Sheet's write URL stays server-side, so it's never exposed in the browser.

### Step 1 — Create the Sheet
1. Go to <https://sheets.google.com> and create a blank spreadsheet.
2. Name it **FlipIQ Leads**.
3. In row 1, add headers (optional but tidy): `Timestamp | Email | Source | IP | User Agent`.

### Step 2 — Add the Apps Script
1. In the Sheet, click **Extensions → Apps Script**.
2. Delete any starter code and paste this in:

```javascript
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.email || "",
      data.source || "",
      data.ip || "",
      data.userAgent || ""
    ]);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. Click **Deploy → New deployment**.
4. Click the gear ⚙ next to "Select type" → choose **Web app**.
5. Set **Execute as: Me** and **Who has access: Anyone**.
6. Click **Deploy**, authorize when prompted, and **copy the Web app URL**
   (looks like `https://script.google.com/macros/s/AKfyc.../exec`).

### Step 3 — Tell Vercel about it
1. In your Vercel project → **Settings → Environment Variables**.
2. Add a variable:
   - **Name:** `SHEETS_WEBHOOK_URL`
   - **Value:** the Web app URL you copied.
3. **Redeploy** the project so the variable takes effect.

That's it. Submit a test email through the site and watch the row appear in your Sheet.

> Tip: To export your list to an email tool (Mailchimp, ConvertKit, etc.) later,
> just **File → Download → CSV** from the Sheet.

---

## 2. Analytics → Google Analytics 4 (≈3 min)

1. Go to <https://analytics.google.com> → **Admin → Create Property** (free).
2. Add a **Web** data stream for your domain.
3. Copy the **Measurement ID** (looks like `G-XXXXXXXXXX`).
4. Open `index.html`, find this line near the top, and paste your ID in:

```html
<script>window.FLIPIQ_GA_ID = "";</script>
```

   becomes:

```html
<script>window.FLIPIQ_GA_ID = "G-XXXXXXXXXX";</script>
```

5. Commit + push. Analytics turns on automatically.

Events already tracked for you:
- `lead_captured` — someone gave their email (with `source`)
- `report_download` — someone downloaded a deal report

These let you measure your funnel: visitors → leads → engaged users.

---

## 3. SEO — already done ✅

`index.html` now includes a description, keywords, Open Graph, and Twitter Card
tags. Two optional follow-ups when you're ready:
- Update the `og:url` / `canonical` if your domain isn't `flipiq.app`.
- Add an `og:image` (a 1200×630 preview image) for richer link previews — drop
  the image URL into an `<meta property="og:image" content="..." />` tag.
