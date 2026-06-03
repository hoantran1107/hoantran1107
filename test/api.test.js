const assert = require("node:assert/strict");
const test = require("node:test");
const screenHandler = require("../api/screen.svg");
const controlHandler = require("../api/control");
const playHandler = require("../api/play");
const { DEFAULT_STATE } = require("../lib/game");
const { encodeStateCookie, COOKIE_NAME } = require("../lib/cookie-state");
const { readState, resetMemoryState } = require("../lib/storage");

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: "",
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    end(value = "") {
      this.body += value;
      this.finished = true;
    }
  };
}

function createRequest(url, options = {}) {
  return {
    method: options.method || "GET",
    url,
    headers: {
      host: "localhost",
      "x-forwarded-for": options.ip || "127.0.0.1",
      ...(options.headers || {})
    },
    socket: {
      remoteAddress: options.ip || "127.0.0.1"
    }
  };
}

test("screen endpoint returns uncached SVG", async () => {
  resetMemoryState(DEFAULT_STATE);
  const res = createResponse();

  await screenHandler(createRequest("/api/screen.svg"), res);

  assert.equal(res.statusCode, 200);
  assert.match(res.headers["content-type"], /image\/svg\+xml/);
  assert.match(res.headers["cache-control"], /no-store/);
  assert.match(res.body, /<svg/);
  assert.match(res.body, /HOAN QUEST/);
});

test("control endpoint accepts a valid button and redirects to profile", async () => {
  resetMemoryState(DEFAULT_STATE);
  const res = createResponse();

  await controlHandler(
    createRequest("/api/control?button=right&callback=https%3A%2F%2Fgithub.com%2Fhoantran1107", { ip: "10.0.0.1" }),
    res
  );

  const state = await readState();
  assert.equal(res.statusCode, 302);
  assert.equal(res.headers.location, "https://github.com/hoantran1107");
  assert.match(res.headers["set-cookie"], /hoan_quest_state=/);
  assert.equal(state.player.x, 2);
  assert.equal(state.steps, 1);
});

test("control endpoint can redirect to live play page", async () => {
  resetMemoryState(DEFAULT_STATE);
  const res = createResponse();

  await controlHandler(
    createRequest("/api/control?button=start&callback=https%3A%2F%2Fhoantran1107.vercel.app%2Fapi%2Fplay", { ip: "10.0.0.5" }),
    res
  );

  assert.equal(res.statusCode, 302);
  assert.equal(res.headers.location, "https://hoantran1107.vercel.app/api/play");
});

test("screen endpoint reads cookie state for immediate play-page updates", async () => {
  resetMemoryState(DEFAULT_STATE);
  const cookieState = {
    ...DEFAULT_STATE,
    player: { x: 2, y: 3, dir: "right" },
    steps: 1,
    message: "Hoan walks East."
  };
  const res = createResponse();

  await screenHandler(
    createRequest("/api/screen.svg", {
      headers: {
        cookie: `${COOKIE_NAME}=${encodeURIComponent(encodeStateCookie(cookieState))}`
      }
    }),
    res
  );

  assert.equal(res.statusCode, 200);
  assert.match(res.body, /Hoan walks East/);
  assert.match(res.body, /Steps: 1/);
});

test("control endpoint rejects invalid button without mutation", async () => {
  resetMemoryState(DEFAULT_STATE);
  const res = createResponse();

  await controlHandler(createRequest("/api/control?button=jump", { ip: "10.0.0.2" }), res);

  const state = await readState();
  assert.equal(res.statusCode, 400);
  assert.deepEqual(state.player, DEFAULT_STATE.player);
  assert.equal(state.steps, 0);
});

test("control endpoint rejects unsafe callback without mutation", async () => {
  resetMemoryState(DEFAULT_STATE);
  const res = createResponse();

  await controlHandler(
    createRequest("/api/control?button=right&callback=https%3A%2F%2Fevil.example", { ip: "10.0.0.3" }),
    res
  );

  const state = await readState();
  assert.equal(res.statusCode, 400);
  assert.deepEqual(state.player, DEFAULT_STATE.player);
  assert.equal(state.steps, 0);
});

test("control endpoint rate limits repeated input from the same client", async () => {
  resetMemoryState(DEFAULT_STATE);
  const first = createResponse();
  const second = createResponse();

  await controlHandler(createRequest("/api/control?button=right", { ip: "10.0.0.4" }), first);
  await controlHandler(createRequest("/api/control?button=right", { ip: "10.0.0.4" }), second);

  const state = await readState();
  assert.equal(first.statusCode, 302);
  assert.equal(second.statusCode, 429);
  assert.equal(state.steps, 1);
});

test("callback allowlist accepts only Hoan profile URLs", () => {
  assert.equal(controlHandler.isAllowedCallback("https://github.com/hoantran1107"), true);
  assert.equal(controlHandler.isAllowedCallback("https://github.com/hoantran1107/hoantran1107"), true);
  assert.equal(controlHandler.isAllowedCallback("https://hoantran1107.vercel.app/api/play"), true);
  assert.equal(controlHandler.isAllowedCallback("http://github.com/hoantran1107"), false);
  assert.equal(controlHandler.isAllowedCallback("https://github.com/example"), false);
});

test("play endpoint renders no-cache controls page", async () => {
  const res = createResponse();

  await playHandler(createRequest("/api/play"), res);

  assert.equal(res.statusCode, 200);
  assert.match(res.headers["content-type"], /text\/html/);
  assert.match(res.headers["cache-control"], /no-store/);
  assert.match(res.body, /Hoan Quest/);
  assert.match(res.body, /button=down/);
});
