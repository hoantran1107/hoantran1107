const { DEFAULT_STATE, cloneState } = require("./game");

const STATE_KEY = process.env.GAME_STATE_KEY || "profile-game:shared-state";
const RATE_PREFIX = process.env.GAME_RATE_PREFIX || "profile-game:rate:";
const COOLDOWN_MS = Number.parseInt(process.env.GAME_COOLDOWN_MS || "900", 10);

const memory = {
  state: cloneState(DEFAULT_STATE),
  rate: new Map()
};

function hasRedis() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

async function redisCommand(command, ...args) {
  const url = `${process.env.UPSTASH_REDIS_REST_URL}/${command}/${args.map(encodeURIComponent).join("/")}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Redis ${command} failed with ${response.status}`);
  }

  const payload = await response.json();
  return payload.result;
}

async function readState() {
  if (!hasRedis()) {
    return cloneState(memory.state);
  }

  const raw = await redisCommand("get", STATE_KEY);
  if (!raw) {
    return cloneState(DEFAULT_STATE);
  }

  try {
    return cloneState(JSON.parse(raw));
  } catch {
    return cloneState(DEFAULT_STATE);
  }
}

async function writeState(state) {
  const normalized = cloneState(state);

  if (!hasRedis()) {
    memory.state = normalized;
    return normalized;
  }

  await redisCommand("set", STATE_KEY, JSON.stringify(normalized));
  return normalized;
}

async function checkCooldown(identity) {
  const key = `${RATE_PREFIX}${identity || "anonymous"}`;
  const now = Date.now();

  if (!hasRedis()) {
    const previous = memory.rate.get(key) || 0;
    if (now - previous < COOLDOWN_MS) {
      return false;
    }
    memory.rate.set(key, now);
    return true;
  }

  const previousRaw = await redisCommand("get", key);
  const previous = Number.parseInt(previousRaw || "0", 10);
  if (now - previous < COOLDOWN_MS) {
    return false;
  }

  await redisCommand("set", key, String(now));
  await redisCommand("expire", key, "60");
  return true;
}

function resetMemoryState(state = DEFAULT_STATE) {
  memory.state = cloneState(state);
  memory.rate.clear();
}

module.exports = {
  checkCooldown,
  readState,
  resetMemoryState,
  writeState
};
