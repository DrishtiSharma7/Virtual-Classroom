const cookie = require("cookie");

const isProduction = process.env.NODE_ENV === "production";

/**
 * Returns options for secure HttpOnly auth cookies.
 */
function getAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  };
}

/**
 * Returns options for client-readable session metadata cookies.
 */
function getSessionMetaCookieOptions() {
  return {
    httpOnly: false,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
}

/**
 * Sets auth and session cookies on response.
 *
 * @param {Object} res - Express response object
 * @param {Object} payload - { token, role }
 */
function setAuthCookies(res, { token, role }) {
  if (!res || typeof res.cookie !== "function") return;

  if (token) {
    res.cookie("token", token, getAuthCookieOptions());
  }

  if (role) {
    res.cookie("role", role, getSessionMetaCookieOptions());
  }
}

/**
 * Clears auth and session cookies on logout.
 *
 * @param {Object} res - Express response object
 */
function clearAuthCookies(res) {
  if (!res || typeof res.clearCookie !== "function") return;

  const authOptions = getAuthCookieOptions();
  const metaOptions = getSessionMetaCookieOptions();

  res.clearCookie("token", authOptions);
  res.clearCookie("role", metaOptions);
}

/**
 * Safely parse cookie header string into an object.
 */
function parseCookies(header) {
  if (!header || typeof header !== "string") return {};
  try {
    return cookie.parse(header);
  } catch {
    return {};
  }
}

module.exports = {
  getAuthCookieOptions,
  getSessionMetaCookieOptions,
  setAuthCookies,
  clearAuthCookies,
  parseCookies,
};
