const { HEIGHT, MAP, WIDTH, cloneState } = require("./game");

const TILE = 28;
const VIEW_X = 24;
const VIEW_Y = 42;
const VIEW_W = WIDTH * TILE;
const VIEW_H = HEIGHT * TILE;

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tileFill(tile) {
  if (tile === "#") return "#2c5940";
  if (tile === "g") return "#67a84f";
  if (tile === "c") return "#f1d36a";
  return "#d8f2b4";
}

function renderPlayer(x, y, dir) {
  const cx = VIEW_X + x * TILE + TILE / 2;
  const cy = VIEW_Y + y * TILE + TILE / 2;
  const eyeOffset = dir === "left" ? -5 : dir === "right" ? 5 : 0;
  const capY = cy - 9;

  return `
    <g aria-label="Player" role="img">
      <circle cx="${cx}" cy="${cy - 2}" r="8" fill="#f7b267" stroke="#292524" stroke-width="2"/>
      <path d="M${cx - 10} ${capY}h20v6h-20z" fill="#e23d3d" stroke="#292524" stroke-width="2"/>
      <rect x="${cx - 7}" y="${cy + 6}" width="14" height="11" rx="2" fill="#3178c6" stroke="#292524" stroke-width="2"/>
      <rect x="${cx + eyeOffset - 3}" y="${cy - 3}" width="3" height="3" fill="#292524"/>
      <rect x="${cx + eyeOffset + 3}" y="${cy - 3}" width="3" height="3" fill="#292524"/>
    </g>`;
}

function renderCreature(x, y, caught) {
  if (caught.includes("Bytebud")) {
    return "";
  }

  const cx = VIEW_X + x * TILE + TILE / 2;
  const cy = VIEW_Y + y * TILE + TILE / 2;
  return `
    <g aria-label="Bytebud" role="img">
      <ellipse cx="${cx}" cy="${cy + 5}" rx="9" ry="6" fill="#4f46e5" stroke="#292524" stroke-width="2"/>
      <circle cx="${cx}" cy="${cy - 3}" r="8" fill="#8b5cf6" stroke="#292524" stroke-width="2"/>
      <rect x="${cx - 4}" y="${cy - 5}" width="3" height="3" fill="#ffffff"/>
      <rect x="${cx + 3}" y="${cy - 5}" width="3" height="3" fill="#ffffff"/>
      <path d="M${cx - 4} ${cy + 2}q4 4 8 0" fill="none" stroke="#292524" stroke-width="2"/>
    </g>`;
}

function renderScreen(rawState) {
  const state = cloneState(rawState);
  const caughtLabel = state.caught.length ? state.caught.join(", ") : "none";
  const message = escapeXml(state.message);
  const status = escapeXml(`Party: ${caughtLabel} | Steps: ${state.steps}`);

  const tiles = [];
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const tile = MAP[y][x];
      tiles.push(`
        <rect x="${VIEW_X + x * TILE}" y="${VIEW_Y + y * TILE}" width="${TILE}" height="${TILE}" fill="${tileFill(tile)}"/>
        <path d="M${VIEW_X + x * TILE} ${VIEW_Y + y * TILE}h${TILE}v${TILE}h-${TILE}z" fill="none" stroke="#8ba86c" stroke-width="1" opacity="0.45"/>`);
      if (tile === "g") {
        tiles.push(`<path d="M${VIEW_X + x * TILE + 6} ${VIEW_Y + y * TILE + 21}l5-10 5 10 5-9" fill="none" stroke="#2c5940" stroke-width="2" stroke-linecap="round"/>`);
      }
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="330" height="330" viewBox="0 0 330 330" role="img" aria-labelledby="title desc">
  <title id="title">Hoan's shared pocket quest</title>
  <desc id="desc">A retro creature-catching game screen for Hoan Tran's GitHub profile.</desc>
  <rect width="330" height="330" rx="18" fill="#202124"/>
  <rect x="12" y="12" width="306" height="306" rx="14" fill="#4b5563" stroke="#111827" stroke-width="4"/>
  <rect x="24" y="42" width="${VIEW_W}" height="${VIEW_H}" fill="#d8f2b4" stroke="#111827" stroke-width="4"/>
  ${tiles.join("")}
  ${renderCreature(5, 3, state.caught)}
  ${renderPlayer(state.player.x, state.player.y, state.player.dir)}
  <rect x="24" y="247" width="282" height="54" rx="4" fill="#f8fafc" stroke="#111827" stroke-width="4"/>
  <text x="38" y="269" fill="#111827" font-family="Consolas, monospace" font-size="13" font-weight="700">${message}</text>
  <text x="38" y="289" fill="#374151" font-family="Consolas, monospace" font-size="11">${status}</text>
  <text x="24" y="31" fill="#f8fafc" font-family="Consolas, monospace" font-size="14" font-weight="700">HOAN QUEST</text>
  <text x="204" y="31" fill="#d1d5db" font-family="Consolas, monospace" font-size="10">shared README game</text>
</svg>`;
}

module.exports = {
  renderScreen
};
