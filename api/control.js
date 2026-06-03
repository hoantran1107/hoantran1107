const { applyInput, normalizeButton } = require("../lib/game");
const { stateCookieHeader } = require("../lib/cookie-state");
const { checkCooldown, readState, writeState } = require("../lib/storage");

const DEFAULT_CALLBACK = "https://github.com/hoantran1107";
const ALLOWED_CALLBACKS = new Set([
  DEFAULT_CALLBACK,
  `${DEFAULT_CALLBACK}/`,
  "https://github.com/hoantran1107/hoantran1107",
  "https://github.com/hoantran1107/hoantran1107/",
  "https://hoantran1107.vercel.app/api/play"
]);

function parseQuery(req) {
  const host = req.headers.host || "localhost";
  const url = new URL(req.url || "/", `https://${host}`);
  return url.searchParams;
}

function isAllowedCallback(callback) {
  if (!callback) {
    return true;
  }

  try {
    const parsed = new URL(callback);
    return parsed.protocol === "https:" && ALLOWED_CALLBACKS.has(parsed.toString());
  } catch {
    return false;
  }
}

function clientIdentity(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }

  return req.socket?.remoteAddress || "anonymous";
}

module.exports = async function handler(req, res) {
  if (req.method && req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    res.statusCode = 405;
    res.end("Method not allowed");
    return;
  }

  const query = parseQuery(req);
  const button = normalizeButton(query.get("button"));
  const callback = query.get("callback") || DEFAULT_CALLBACK;

  if (!button) {
    res.statusCode = 400;
    res.end("Invalid button");
    return;
  }

  if (!isAllowedCallback(callback)) {
    res.statusCode = 400;
    res.end("Invalid callback");
    return;
  }

  const allowed = await checkCooldown(clientIdentity(req));
  if (!allowed) {
    res.statusCode = 429;
    res.end("Slow down and try again.");
    return;
  }

  const previousState = await readState();
  const result = applyInput(previousState, button);
  if (result.error) {
    res.statusCode = 400;
    res.end(result.error);
    return;
  }

  if (result.changed) {
    await writeState(result.state);
  }

  res.statusCode = 302;
  res.setHeader("Location", callback);
  res.setHeader("Set-Cookie", stateCookieHeader(result.state));
  res.setHeader("Cache-Control", "no-store");
  res.end("");
};

module.exports.DEFAULT_CALLBACK = DEFAULT_CALLBACK;
module.exports.isAllowedCallback = isAllowedCallback;
