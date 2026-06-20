// FlipIQ™ — Anthropic API Proxy
// Keeps the API key server-side and adds basic rate limiting.

// Allow the Anthropic call up to 60s to finish. Vercel's default function
// timeout can be as low as 10s, which cut off slower completions — the browser
// then received a non-JSON gateway error and surfaced it as "Connection error".
export const config = {
  maxDuration: 60,
};

// In-memory rate limit store (resets on cold start, good enough for serverless)
// Limit: 10 AI requests per IP per hour
const rateLimitStore = new Map();
const RATE_LIMIT = 10;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }

  if (entry.count >= RATE_LIMIT) {
    const resetIn = Math.ceil((WINDOW_MS - (now - entry.windowStart)) / 60000);
    return { allowed: false, resetIn };
  }

  entry.count += 1;
  return { allowed: true, remaining: RATE_LIMIT - entry.count };
}

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // CORS headers — allow requests from your Vercel domain
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Rate limiting
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    return res.status(429).json({
      error: `Rate limit reached. You can make ${RATE_LIMIT} AI requests per hour. Try again in ${limit.resetIn} minute(s).`,
    });
  }

  // Validate request body
  const { model, max_tokens, messages, system } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  // Build Anthropic request
  const anthropicBody = {
    model: model || "claude-sonnet-4-6",
    max_tokens: Math.min(max_tokens || 800, 1500), // cap at 1500 to control costs
    messages,
  };
  if (system) anthropicBody.system = system;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(anthropicBody),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "Anthropic API error",
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
}
