const {
  getAuthCookieOptions,
  getSessionMetaCookieOptions,
  setAuthCookies,
  clearAuthCookies,
  parseCookies,
} = require("./cookie");
const authMiddleware = require("../middleware/auth.middleware");
const jwt = require("jsonwebtoken");

describe("Cookie Utility", () => {
  test("generates correct auth cookie options", () => {
    const options = getAuthCookieOptions();
    expect(options.httpOnly).toBe(true);
    expect(options.path).toBe("/");
    expect(options.maxAge).toBe(7 * 24 * 60 * 60 * 1000);
  });

  test("generates correct session meta cookie options (non-httpOnly)", () => {
    const options = getSessionMetaCookieOptions();
    expect(options.httpOnly).toBe(false);
    expect(options.path).toBe("/");
  });

  test("setAuthCookies calls res.cookie for token and role", () => {
    const res = {
      cookie: jest.fn(),
    };

    setAuthCookies(res, { token: "sample-token", role: "teacher" });

    expect(res.cookie).toHaveBeenCalledWith(
      "token",
      "sample-token",
      expect.objectContaining({ httpOnly: true, path: "/" })
    );
    expect(res.cookie).toHaveBeenCalledWith(
      "role",
      "teacher",
      expect.objectContaining({ httpOnly: false, path: "/" })
    );
  });

  test("clearAuthCookies clears token and role cookies", () => {
    const res = {
      clearCookie: jest.fn(),
    };

    clearAuthCookies(res);

    expect(res.clearCookie).toHaveBeenCalledWith(
      "token",
      expect.objectContaining({ httpOnly: true })
    );
    expect(res.clearCookie).toHaveBeenCalledWith(
      "role",
      expect.objectContaining({ httpOnly: false })
    );
  });

  test("parseCookies parses cookie string into object", () => {
    const header = "token=abc123xyz; role=student; other=value";
    const parsed = parseCookies(header);

    expect(parsed.token).toBe("abc123xyz");
    expect(parsed.role).toBe("student");
    expect(parsed.other).toBe("value");
  });

  test("parseCookies handles invalid or empty input safely", () => {
    expect(parseCookies(null)).toEqual({});
    expect(parseCookies("")).toEqual({});
    expect(parseCookies(undefined)).toEqual({});
  });
});

describe("Auth Middleware with Cookie Support", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret";
  });

  test("authenticates user from req.cookies.token", () => {
    const token = jwt.sign(
      { id: "user-1", name: "Alice", role: "teacher" },
      process.env.JWT_SECRET
    );

    const req = {
      cookies: { token },
      headers: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(
      expect.objectContaining({ id: "user-1", name: "Alice", role: "teacher" })
    );
  });

  test("authenticates user from Authorization Bearer header when no cookie is set", () => {
    const token = jwt.sign(
      { id: "user-2", name: "Bob", role: "student" },
      process.env.JWT_SECRET
    );

    const req = {
      cookies: {},
      headers: { authorization: `Bearer ${token}` },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(
      expect.objectContaining({ id: "user-2", name: "Bob", role: "student" })
    );
  });

  test("returns 401 when neither cookie nor authorization header is provided", () => {
    const req = {
      cookies: {},
      headers: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "No token provided" });
    expect(next).not.toHaveBeenCalled();
  });
});
