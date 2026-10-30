import express from "express";
import crypto from "node:crypto";
import { mouse, keyboard, screen, Button, Key, straightTo } from "@nut-tree-fork/nut-js";

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "16kb" }));

const PORT = Number(process.env.PORT || 3210);
const API_KEY = "260903099697492416867518";
if (!API_KEY || API_KEY.length < 24 || API_KEY === "replace-with-your-own-long-random-secret") {
  console.error("Set CONTROL_API_KEY to a unique secret of at least 24 characters.");
  process.exit(1);
}

let enabled = false;
let lastActionAt = 0;
const MIN_ACTION_INTERVAL_MS = 35;

const keyNames = {
  ENTER: Key.Enter, TAB: Key.Tab, ESC: Key.Escape, SPACE: Key.Space,
  BACKSPACE: Key.Backspace, DELETE: Key.Delete, UP: Key.Up, DOWN: Key.Down,
  LEFT: Key.Left, RIGHT: Key.Right, HOME: Key.Home, END: Key.End,
  PAGEUP: Key.PageUp, PAGEDOWN: Key.PageDown, CTRL: Key.LeftControl,
  SHIFT: Key.LeftShift, ALT: Key.LeftAlt, META: Key.LeftSuper
};

function safeEqual(a, b) {
  const aa = Buffer.from(String(a || ""));
  const bb = Buffer.from(String(b || ""));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}
function auth(req, res, next) {
  const token = (req.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!safeEqual(token, API_KEY)) return res.status(401).json({ error: "unauthorized", message: "A valid Bearer API key is required." });
  next();
}
function requireEnabled(req, res, next) {
  if (!enabled) return res.status(423).json({ error: "control_disabled", message: "Remote input is disabled. Call POST /v1/control/enable after user authorization." });
  const now = Date.now();
  if (now - lastActionAt < MIN_ACTION_INTERVAL_MS) return res.status(429).json({ error: "rate_limited", message: "Please slow down the action rate." });
  lastActionAt = now;
  next();
}
function boundedNumber(value, min, max, name) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) throw new Error(`${name} must be between ${min} and ${max}`);
  return n;
}
function asyncRoute(fn) {
  return (req, res) => Promise.resolve(fn(req, res)).catch((e) =>
    res.status(400).json({ error: "action_failed", message: e?.message || "Action failed" })
  );
}

app.get("/v1/status", auth, asyncRoute(async (_req, res) => {
  res.json({
    ok: true, enabled, platform: process.platform,
    screen: { width: await screen.width(), height: await screen.height() },
    apiVersion: "1.1.0", baseUrl: `http://127.0.0.1:${PORT}`
  });
}));

app.post("/v1/control/enable", auth, (_req, res) => {
  enabled = true;
  res.json({ ok: true, enabled, message: "Remote input enabled." });
});
app.post("/v1/control/disable", auth, (_req, res) => {
  enabled = false;
  res.json({ ok: true, enabled: false });
});

app.post("/v1/mouse/move", auth, requireEnabled, asyncRoute(async (req, res) => {
  const width = await screen.width(), height = await screen.height();
  const x = boundedNumber(req.body?.x, 0, width - 1, "x");
  const y = boundedNumber(req.body?.y, 0, height - 1, "y");
  await mouse.setPosition({ x: x, y: y, });
  res.json({ ok: true, action: "mouse.move", x, y });
}));

app.post("/v1/mouse/click", auth, requireEnabled, asyncRoute(async (req, res) => {
  const buttonName = String(req.body?.button || "left").toLowerCase();
  const buttons = { left: Button.LEFT, right: Button.RIGHT, middle: Button.MIDDLE };
  if (!buttons[buttonName]) throw new Error("button must be left, right, or middle");
  if (req.body?.x !== undefined || req.body?.y !== undefined) {
    const width = await screen.width(), height = await screen.height();
    const x = boundedNumber(req.body.x, 0, width - 1, "x");
    const y = boundedNumber(req.body.y, 0, height - 1, "y");
    await mouse.move(straightTo(x, y));
  }
  await mouse.click(buttons[buttonName]);
  res.json({ ok: true, action: "mouse.click", button: buttonName });
}));

app.post("/v1/mouse/scroll", auth, requireEnabled, asyncRoute(async (req, res) => {
  const amount = boundedNumber(req.body?.amount, -20, 20, "amount");
  const steps = Math.abs(Math.round(amount));
  if (amount > 0) await mouse.scrollDown(steps);
  if (amount < 0) await mouse.scrollUp(steps);
  res.json({ ok: true, action: "mouse.scroll", amount });
}));

app.post("/v1/keyboard/type", auth, requireEnabled, asyncRoute(async (req, res) => {
  const text = req.body?.text;
  if (typeof text !== "string" || text.length > 2000) throw new Error("text must be a string of at most 2000 characters");
  await keyboard.type(text);
  res.json({ ok: true, action: "keyboard.type", characters: text.length });
}));

app.post("/v1/keyboard/press", auth, requireEnabled, asyncRoute(async (req, res) => {
  const name = String(req.body?.key || "").toUpperCase();
  const key = keyNames[name];
  if (!key) throw new Error(`Unsupported key. Allowed keys: ${Object.keys(keyNames).join(", ")}`);
  await keyboard.pressKey(key);
  await keyboard.releaseKey(key);
  res.json({ ok: true, action: "keyboard.press", key: name });
}));

app.post("/v1/browser/navigate", auth, requireEnabled, (req, res) => {
  const url = req.body?.url;
  if (typeof url !== "string" || url.length > 2048) return res.status(400).json({ error: "invalid_request", message: "url must be a string up to 2048 characters" });
  let parsed;
  try { parsed = new URL(url); } catch { return res.status(400).json({ error: "invalid_request", message: "Invalid URL" }); }
  if (!["http:", "https:"].includes(parsed.protocol)) return res.status(400).json({ error: "invalid_request", message: "Only http and https URLs are allowed" });
  // Browser navigation is intentionally performed through normal keyboard input.
  // Focus the address bar, type URL, and press Enter.
  Promise.resolve().then(async () => {
    await keyboard.pressKey(Key.LeftControl);
    await keyboard.pressKey(Key.L);
    await keyboard.releaseKey(Key.L);
    await keyboard.releaseKey(Key.LeftControl);
    await keyboard.type(parsed.href);
    await keyboard.pressKey(Key.Enter);
    await keyboard.releaseKey(Key.Enter);
    res.json({ ok: true, action: "browser.navigate", url: parsed.href });
  }).catch(e => res.status(400).json({ error: "action_failed", message: e.message }));
});

app.use((_req, res) => res.status(404).json({ error: "not_found", message: "Unknown endpoint. See API.md." }));
app.listen(PORT, "127.0.0.1", () => {
  console.log(`Computer Control API: http://127.0.0.1:${PORT}`);
  console.log("Bound to localhost only. API key required. Input starts disabled.");
});
