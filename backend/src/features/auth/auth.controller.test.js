const authController = require("./auth.controller");
const User = require("./auth.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

jest.mock("./auth.model");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

describe("Auth Controller - Forgot & Reset Password", () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-jwt-secret";
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("forgotPassword", () => {
    test("returns 400 if email is missing", async () => {
      req = { body: {} };
      await authController.forgotPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Email is required" });
    });

    test("returns 404 if user does not exist", async () => {
      req = { body: { email: "nonexistent@example.com" } };
      User.findOne.mockResolvedValue(null);

      await authController.forgotPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "No account found with this email address",
      });
    });

    test("returns resetToken when user exists", async () => {
      req = { body: { email: "student@example.com" } };
      const fakeUser = {
        _id: "user-123",
        email: "student@example.com",
        name: "Test Student",
      };
      User.findOne.mockResolvedValue(fakeUser);
      jwt.sign.mockReturnValue("mock-reset-token");

      await authController.forgotPassword(req, res);

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "user-123",
          email: "student@example.com",
          type: "password_reset",
        }),
        "test-jwt-secret",
        { expiresIn: "15m" }
      );

      expect(res.json).toHaveBeenCalledWith({
        message: "Email verified. You can now reset your password.",
        resetToken: "mock-reset-token",
        email: "student@example.com",
        name: "Test Student",
      });
    });
  });

  describe("resetPassword", () => {
    test("returns 400 if newPassword is missing or too short", async () => {
      req = { body: { email: "test@example.com", newPassword: "123" } };
      await authController.resetPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Password must be at least 6 characters",
      });
    });

    test("successfully updates password using resetToken", async () => {
      req = {
        body: {
          resetToken: "valid-token",
          newPassword: "newsecretpassword123",
        },
      };

      jwt.verify.mockReturnValue({
        id: "user-123",
        email: "student@example.com",
        type: "password_reset",
      });

      const fakeUser = {
        _id: "user-123",
        email: "student@example.com",
        password: "oldHashedPassword",
        save: jest.fn().mockResolvedValue(true),
      };

      User.findById.mockResolvedValue(fakeUser);
      bcrypt.hash.mockResolvedValue("newHashedPassword");

      await authController.resetPassword(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith("newsecretpassword123", 10);
      expect(fakeUser.password).toBe("newHashedPassword");
      expect(fakeUser.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "Password updated successfully. You can now log in.",
      });
    });

    test("successfully updates password using email directly", async () => {
      req = {
        body: {
          email: "student@example.com",
          newPassword: "newsecretpassword123",
        },
      };

      const fakeUser = {
        _id: "user-123",
        email: "student@example.com",
        password: "oldHashedPassword",
        save: jest.fn().mockResolvedValue(true),
      };

      User.findOne.mockResolvedValue(fakeUser);
      bcrypt.hash.mockResolvedValue("newHashedPassword");

      await authController.resetPassword(req, res);

      expect(fakeUser.password).toBe("newHashedPassword");
      expect(fakeUser.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "Password updated successfully. You can now log in.",
      });
    });

    test("returns 400 if resetToken is expired or invalid", async () => {
      req = {
        body: {
          resetToken: "expired-token",
          newPassword: "newsecretpassword123",
        },
      };

      jwt.verify.mockImplementation(() => {
        throw new Error("jwt expired");
      });

      await authController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message:
          "Reset session has expired or is invalid. Please verify your email again.",
      });
    });
  });
});
