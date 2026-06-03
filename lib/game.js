const WIDTH = 9;
const HEIGHT = 7;

const MAP = [
  "#########",
  "#...g...#",
  "#.#...#.#",
  "#..g.c..#",
  "#.#...#.#",
  "#...g...#",
  "#########"
];

const DIRECTIONS = {
  up: { dx: 0, dy: -1, label: "North" },
  down: { dx: 0, dy: 1, label: "South" },
  left: { dx: -1, dy: 0, label: "West" },
  right: { dx: 1, dy: 0, label: "East" }
};

const VALID_BUTTONS = new Set([
  "up",
  "down",
  "left",
  "right",
  "a",
  "b",
  "start",
  "select"
]);

const DEFAULT_STATE = Object.freeze({
  version: 1,
  player: { x: 1, y: 3, dir: "down" },
  mode: "field",
  steps: 0,
  caught: [],
  message: "A shared pocket quest is waiting. Press Start.",
  updatedAt: null
});

function cloneState(state = DEFAULT_STATE) {
  return {
    version: 1,
    player: {
      x: Number.isInteger(state.player?.x) ? state.player.x : DEFAULT_STATE.player.x,
      y: Number.isInteger(state.player?.y) ? state.player.y : DEFAULT_STATE.player.y,
      dir: DIRECTIONS[state.player?.dir] ? state.player.dir : DEFAULT_STATE.player.dir
    },
    mode: state.mode === "menu" ? "menu" : "field",
    steps: Number.isInteger(state.steps) ? state.steps : 0,
    caught: Array.isArray(state.caught) ? [...new Set(state.caught)].slice(0, 8) : [],
    message: typeof state.message === "string" ? state.message : DEFAULT_STATE.message,
    updatedAt: typeof state.updatedAt === "string" ? state.updatedAt : null
  };
}

function normalizeButton(button) {
  if (typeof button !== "string") {
    return null;
  }

  const normalized = button.trim().toLowerCase();
  return VALID_BUTTONS.has(normalized) ? normalized : null;
}

function tileAt(x, y) {
  if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) {
    return "#";
  }

  return MAP[y][x];
}

function isBlocked(x, y) {
  return tileAt(x, y) === "#";
}

function facingPosition(player) {
  const direction = DIRECTIONS[player.dir] || DIRECTIONS.down;
  return {
    x: player.x + direction.dx,
    y: player.y + direction.dy
  };
}

function applyInput(previousState, rawButton, now = new Date()) {
  const button = normalizeButton(rawButton);
  if (!button) {
    return {
      state: cloneState(previousState),
      changed: false,
      error: "Invalid button"
    };
  }

  const state = cloneState(previousState);
  const next = cloneState(state);
  next.updatedAt = now.toISOString();

  if (DIRECTIONS[button]) {
    next.mode = "field";
    next.player.dir = button;

    const targetX = state.player.x + DIRECTIONS[button].dx;
    const targetY = state.player.y + DIRECTIONS[button].dy;
    if (isBlocked(targetX, targetY)) {
      next.message = "A line of pixel pines blocks the path.";
      return { state: next, changed: true };
    }

    next.player.x = targetX;
    next.player.y = targetY;
    next.steps += 1;
    next.message = tileAt(targetX, targetY) === "g"
      ? "Tall grass rustles. Press A to search."
      : `Hoan walks ${DIRECTIONS[button].label}.`;
    return { state: next, changed: true };
  }

  if (button === "start") {
    next.mode = state.mode === "menu" ? "field" : "menu";
    next.message = next.mode === "menu"
      ? `Status: ${state.caught.length}/2 companions, ${state.steps} steps.`
      : "Back to the trail.";
    return { state: next, changed: true };
  }

  if (button === "select") {
    next.mode = "field";
    next.message = "Controls: arrows move, A interacts, B closes, Start toggles status.";
    return { state: next, changed: true };
  }

  if (button === "b") {
    next.mode = "field";
    next.message = "The menu snaps shut. Adventure resumes.";
    return { state: next, changed: true };
  }

  if (button === "a") {
    next.mode = "field";
    const ahead = facingPosition(state.player);
    const currentTile = tileAt(state.player.x, state.player.y);
    const aheadTile = tileAt(ahead.x, ahead.y);

    if (aheadTile === "c" && !state.caught.includes("Bytebud")) {
      next.caught = [...state.caught, "Bytebud"];
      next.message = "Bytebud joined the party.";
      return { state: next, changed: true };
    }

    if (currentTile === "g" && !state.caught.includes("Sparkit")) {
      next.caught = [...state.caught, "Sparkit"];
      next.message = "Sparkit popped from the grass and joined.";
      return { state: next, changed: true };
    }

    if (aheadTile === "c") {
      next.message = "Bytebud is already travelling with the team.";
      return { state: next, changed: true };
    }

    if (currentTile === "g") {
      next.message = "The grass sways, but nothing appears.";
      return { state: next, changed: true };
    }

    next.message = "Nothing to inspect here.";
    return { state: next, changed: true };
  }

  return { state: next, changed: false };
}

module.exports = {
  DEFAULT_STATE,
  DIRECTIONS,
  HEIGHT,
  MAP,
  VALID_BUTTONS,
  WIDTH,
  applyInput,
  cloneState,
  facingPosition,
  isBlocked,
  normalizeButton,
  tileAt
};
