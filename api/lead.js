// FlipIQ™ — Lead Capture Endpoint
// Receives an email from the front-end and forwards it to a Google Sheet
// (via a Google Apps Script Web App). Keeps the Sheet URL server-side and
// adds basic validation + rate limiting.
//
// Setup: deploy the Apps Script in SETUP.md as a Web App, then set the
// environment variable SHEETS_WEBHOOK_URL in Vercel to its URL.

// In-memory rate limit store (resets on cold start, good enough for serverless)
// Limit: 20 lead submissions per IP per hour
const rateLimitStore = new Map();
const RATE_LIMIT = 20;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT) {
    return { allowed: false };
  }

  entry.count += 1;
  return { allowed: true };
}

// Simple, permissive email shape check
function isValidEmail(email) {
  return (
    typeof email === "string" &&
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  if (!checkRateLimit(ip).allowed) {
    return res.status(429).json({ error: "Too many requests. Try again later." });
  }

  const { email, source } = req.body || {};
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }

  const webhookUrl = process.env.SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    // Not configured yet — fail soft so the user-facing flow still works.
    console.error("SHEETS_WEBHOOK_URL is not set; lead not stored:", email);
    return res.status(200).json({ ok: true, stored: false });
  }

  const payload = {
    email: email.trim().toLowerCase(),
    source: typeof source === "string" ? source.slice(0, 80) : "unknown",
    timestamp: new Date().toISOString(),
    ip,
    userAgent: (req.headers["user-agent"] || "").slice(0, 200),
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error("Sheets webhook error:", response.status);
      return res.status(200).json({ ok: true, stored: false });
    }

    return res.status(200).json({ ok: true, stored: true });
  } catch (err) {
    console.error("Lead proxy error:", err);
    // Fail soft: never block the user's flow on our storage backend.
    return res.status(200).json({ ok: true, stored: false });
  }
}
