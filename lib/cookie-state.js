const COOKIE_NAME = "hoan_quest_state";

function encodeStateCookie(state) {
  return Buffer.from(JSON.stringify(state), "utf8").toString("base64url");
}

function decodeStateCookie(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function readCookie(req, name = COOKIE_NAME) {
  const cookieHeader = req.headers?.cookie;
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").map((part) => part.trim());
  const prefix = `${name}=`;
  const match = cookies.find((cookie) => cookie.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : null;
}

function stateCookieHeader(state) {
  return `${COOKIE_NAME}=${encodeStateCookie(state)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`;
}

module.exports = {
  COOKIE_NAME,
  decodeStateCookie,
  encodeStateCookie,
  readCookie,
  stateCookieHeader
};
