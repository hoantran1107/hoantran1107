const assert = require("node:assert/strict");
const test = require("node:test");
const screenHandler = require("../api/screen.svg");
const controlHandler = require("../api/control");
const { DEFAULT_STATE } = require("../lib/game");
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
  assert.equal(state.player.x, 2);
  assert.equal(state.steps, 1);
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
  assert.equal(controlHandler.isAllowedCallback("http://github.com/hoantran1107"), false);
  assert.equal(controlHandler.isAllowedCallback("https://github.com/example"), false);
});
