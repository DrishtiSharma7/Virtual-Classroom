const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./auth.model");

exports.register = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    if (!req.body) {
      return res.status(400).json({
        message: "Request body missing",
      });
    }
    const { name, email, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });
    res.status(201).json({
      message: "User registered successfully",
      userId: user._id,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      {
        id: user._id,
        name: user.name,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    const emailTrimmed = email.trim();
    const user = await User.findOne({
      $or: [
        { email: emailTrimmed },
        { email: emailTrimmed.toLowerCase() },
      ],
    });

    if (!user) {
      return res.status(404).json({
        message: "No account found with this email address",
      });
    }

    const resetToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        type: "password_reset",
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({
      message: "Email verified. You can now reset your password.",
      resetToken,
      email: user.email,
      name: user.name,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword, resetToken } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    let user = null;

    if (resetToken) {
      try {
        const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        if (decoded.type !== "password_reset") {
          return res.status(400).json({ message: "Invalid reset token" });
        }
        user = await User.findById(decoded.id);
      } catch (tokenErr) {
        return res.status(400).json({
          message:
            "Reset session has expired or is invalid. Please verify your email again.",
        });
      }
    } else if (email) {
      const emailTrimmed = email.trim();
      user = await User.findOne({
        $or: [
          { email: emailTrimmed },
          { email: emailTrimmed.toLowerCase() },
        ],
      });
    } else {
      return res
        .status(400)
        .json({ message: "Email or reset token is required" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({
      message: "Password updated successfully. You can now log in.",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
