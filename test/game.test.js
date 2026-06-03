const assert = require("node:assert/strict");
const test = require("node:test");
const { DEFAULT_STATE, applyInput, cloneState, normalizeButton } = require("../lib/game");
const { wrapText } = require("../lib/render");

test("normalizes only supported buttons", () => {
  assert.equal(normalizeButton(" A "), "a");
  assert.equal(normalizeButton("right"), "right");
  assert.equal(normalizeButton("jump"), null);
  assert.equal(normalizeButton(undefined), null);
});

test("moves player and increments steps on open tiles", () => {
  const result = applyInput(DEFAULT_STATE, "right", new Date("2026-06-03T00:00:00.000Z"));

  assert.equal(result.changed, true);
  assert.deepEqual(result.state.player, { x: 2, y: 3, dir: "right" });
  assert.equal(result.state.steps, 1);
  assert.match(result.state.message, /East/);
});

test("blocks movement into trees while preserving position", () => {
  const state = cloneState(DEFAULT_STATE);
  state.player = { x: 1, y: 1, dir: "left" };

  const result = applyInput(state, "left");

  assert.equal(result.changed, true);
  assert.deepEqual(result.state.player, { x: 1, y: 1, dir: "left" });
  assert.equal(result.state.steps, 0);
  assert.match(result.state.message, /blocks/);
});

test("start toggles menu and reports status", () => {
  const opened = applyInput(DEFAULT_STATE, "start");
  const closed = applyInput(opened.state, "start");

  assert.equal(opened.state.mode, "menu");
  assert.match(opened.state.message, /Status/);
  assert.equal(closed.state.mode, "field");
});

test("a interacts with grass and catches an original companion once", () => {
  const state = cloneState(DEFAULT_STATE);
  state.player = { x: 3, y: 3, dir: "up" };

  const first = applyInput(state, "a");
  const second = applyInput(first.state, "a");

  assert.deepEqual(first.state.caught, ["Sparkit"]);
  assert.match(first.state.message, /Sparkit/);
  assert.deepEqual(second.state.caught, ["Sparkit"]);
  assert.match(second.state.message, /nothing appears/i);
});

test("invalid buttons do not mutate state", () => {
  const state = cloneState(DEFAULT_STATE);
  const result = applyInput(state, "noop");

  assert.equal(result.changed, false);
  assert.equal(result.error, "Invalid button");
  assert.deepEqual(result.state, state);
});

test("wraps long screen messages into bounded lines", () => {
  const lines = wrapText("A shared pocket quest is waiting. Press Start.", 35, 2);

  assert.equal(lines.length, 2);
  assert.ok(lines.every((line) => line.length <= 35));
});
