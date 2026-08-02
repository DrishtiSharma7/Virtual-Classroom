const bcrypt = require("bcryptjs");
const Settings = require("./settings.model");
const User = require("../auth/auth.model");

// GET /api/settings
// Returns the user's profile + settings, creating a default settings doc
// (scoped to their role) the first time they visit the page.
exports.getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let settings = await Settings.findOne({ user: req.user.id });
    if (!settings) {
      settings = await Settings.create({ user: req.user.id });
    }

    res.json({
      profile: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      session: settings.session,
      ...(user.role === "teacher" && { teacher: settings.teacher }),
      ...(user.role === "student" && { student: settings.student }),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/settings/profile  { name }
exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name: name.trim() },
      { new: true },
    ).select("-password");

    res.json({
      message: "Profile updated successfully",
      profile: {
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

// PUT /api/settings/password  { currentPassword, newPassword }
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current and new password are required",
      });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters",
      });
    }

    const user = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/settings/session  { joinWithCameraOn, joinWithMicOn }
// Shared by both roles.
exports.updateSessionSettings = async (req, res) => {
  try {
    const { joinWithCameraOn, joinWithMicOn } = req.body;

    const update = {};
    if (typeof joinWithCameraOn === "boolean") {
      update["session.joinWithCameraOn"] = joinWithCameraOn;
    }
    if (typeof joinWithMicOn === "boolean") {
      update["session.joinWithMicOn"] = joinWithMicOn;
    }

    const settings = await Settings.findOneAndUpdate(
      { user: req.user.id },
      { $set: update },
      { new: true, upsert: true },
    );

    res.json({
      message: "Session preferences updated",
      session: settings.session,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/settings/teacher — teacher-only preferences
exports.updateTeacherSettings = async (req, res) => {
  try {
    const {
      defaultPenColor,
      defaultStrokeSize,
      defaultQuizTimeLimit,
      autoMuteStudentsOnJoin,
      allowStudentVideoByDefault,
    } = req.body;

    if (
      defaultQuizTimeLimit !== undefined &&
      (defaultQuizTimeLimit < 30 || defaultQuizTimeLimit > 120)
    ) {
      return res.status(400).json({
        message: "Default quiz time limit must be between 30 and 120 seconds",
      });
    }

    const update = {};
    if (defaultPenColor !== undefined) update["teacher.defaultPenColor"] = defaultPenColor;
    if (defaultStrokeSize !== undefined) update["teacher.defaultStrokeSize"] = defaultStrokeSize;
    if (defaultQuizTimeLimit !== undefined) update["teacher.defaultQuizTimeLimit"] = defaultQuizTimeLimit;
    if (typeof autoMuteStudentsOnJoin === "boolean") update["teacher.autoMuteStudentsOnJoin"] = autoMuteStudentsOnJoin;
    if (typeof allowStudentVideoByDefault === "boolean") update["teacher.allowStudentVideoByDefault"] = allowStudentVideoByDefault;

    const settings = await Settings.findOneAndUpdate(
      { user: req.user.id },
      { $set: update },
      { new: true, upsert: true },
    );

    res.json({
      message: "Teacher settings updated",
      teacher: settings.teacher,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/settings/student — student-only preferences
exports.updateStudentSettings = async (req, res) => {
  try {
    const { preferredSessionView, showQuizResultImmediately } = req.body;

    if (
      preferredSessionView !== undefined &&
      !["speaker", "grid"].includes(preferredSessionView)
    ) {
      return res.status(400).json({ message: "Invalid session view" });
    }

    const update = {};
    if (preferredSessionView !== undefined) update["student.preferredSessionView"] = preferredSessionView;
    if (typeof showQuizResultImmediately === "boolean") update["student.showQuizResultImmediately"] = showQuizResultImmediately;

    const settings = await Settings.findOneAndUpdate(
      { user: req.user.id },
      { $set: update },
      { new: true, upsert: true },
    );

    res.json({
      message: "Student settings updated",
      student: settings.student,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};