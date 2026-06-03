const { renderScreen } = require("../lib/render");
const { readCookie, decodeStateCookie } = require("../lib/cookie-state");
const { readState } = require("../lib/storage");

module.exports = async function handler(req, res) {
  if (req.method && req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    res.statusCode = 405;
    res.end("Method not allowed");
    return;
  }

  const cookieState = decodeStateCookie(readCookie(req));
  const state = cookieState || await readState();
  const svg = renderScreen(state);

  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.statusCode = 200;
  res.end(req.method === "HEAD" ? "" : svg);
};
