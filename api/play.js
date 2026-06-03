const BASE_URL = "https://hoantran1107.vercel.app";

function buttonHref(button) {
  return `/api/control?button=${button}&callback=${encodeURIComponent(`${BASE_URL}/api/play`)}`;
}

function renderButton(button, label) {
  return `<a class="button" href="${buttonHref(button)}" aria-label="${label}">${label}</a>`;
}

module.exports = async function handler(req, res) {
  if (req.method && req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    res.statusCode = 405;
    res.end("Method not allowed");
    return;
  }

  const ts = Date.now();
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Hoan Quest</title>
  <style>
    :root { color-scheme: light dark; }
    body {
      margin: 0;
      min-height: 100dvh;
      display: grid;
      place-items: center;
      background: #f4f7f2;
      color: #111827;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    main {
      width: min(430px, calc(100vw - 24px));
      padding: 20px 0 28px;
      text-align: center;
    }
    h1 {
      margin: 0 0 12px;
      font-size: 22px;
      line-height: 1.2;
    }
    .screen {
      display: block;
      width: min(330px, 100%);
      height: auto;
      margin: 0 auto 18px;
    }
    .controls {
      display: grid;
      grid-template-columns: repeat(7, 44px);
      grid-auto-rows: 44px;
      justify-content: center;
      gap: 8px;
      align-items: center;
    }
    .button {
      display: grid;
      place-items: center;
      min-width: 44px;
      min-height: 44px;
      border: 2px solid #1f2937;
      box-shadow: 3px 3px 0 #1f2937;
      background: #ffffff;
      color: #111827;
      text-decoration: none;
      font-weight: 800;
      font-size: 14px;
      line-height: 1;
    }
    .button:active {
      transform: translate(2px, 2px);
      box-shadow: 1px 1px 0 #1f2937;
    }
    .a { background: #168bd8; color: #fff; }
    .b { background: #79c83d; color: #fff; }
    .wide {
      grid-column: span 2;
      min-width: 96px;
    }
    .hint {
      margin: 18px auto 0;
      max-width: 36rem;
      font-size: 14px;
      line-height: 1.45;
      color: #374151;
    }
    .profile {
      color: #0f766e;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <main>
    <h1>Hoan Quest</h1>
    <img class="screen" alt="Live Hoan Quest game screen" src="/api/screen.svg?ts=${ts}" width="330" height="330">
    <nav class="controls" aria-label="Hoan Quest controls">
      <span></span><span></span>${renderButton("up", "Up")}<span></span><span></span><span></span><span></span>
      <span></span>${renderButton("left", "Left")}${renderButton("right", "Right")}<span></span>${renderButton("b", "B").replace('class="button"', 'class="button b"')}${renderButton("a", "A").replace('class="button"', 'class="button a"')}<span></span>
      <span></span><span></span>${renderButton("down", "Down")}<span></span><span></span><span></span><span></span>
      <span></span>${renderButton("select", "Select").replace('class="button"', 'class="button wide"')}${renderButton("start", "Start").replace('class="button"', 'class="button wide"')}<span></span><span></span>
    </nav>
    <p class="hint">This page bypasses GitHub image caching, so each button press updates the screen immediately. <a class="profile" href="https://github.com/hoantran1107">Back to GitHub profile</a>.</p>
  </main>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.statusCode = 200;
  res.end(req.method === "HEAD" ? "" : html);
};

module.exports.BASE_URL = BASE_URL;
