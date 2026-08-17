const express = require("express");
const cors = require("cors");

const authRoutes = require("./features/auth/auth.routes");
const authMiddleware = require("./middleware/auth.middleware");
const roleMiddleware = require("./middleware/role.middleware");
const classroomRoutes = require("./features/classroom/classroom.routes");
const assignmentRoutes = require("./features/assignment/assignment.routes");
const submissionRoutes = require("./features/submission/submission.routes");
const attendanceRoutes = require("./features/attendance/attendance.routes");
const sessionRoutes = require("./features/session/session.routes");
const quizRoutes = require("./features/Quiz/quiz.routes");
const chatRoutes = require("./features/chat/chat.routes");
const materialRoutes = require("./features/material/material.routes");
const dashboardRoutes = require("./features/dashboard/dashboard.routes");
const settingsRoutes = require("./features/settings/settings.routes");
const whiteboardRoutes = require("./features/whiteboard/whiteboard.routes");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Virtual Classroom API Running...");
});

app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user,
  });
});

app.get(
  "/api/teacher",
  authMiddleware,
  roleMiddleware("teacher"),
  (req, res) => {
    res.json({
      message: "Welcome Teacher",
    });
  },
);

app.use("/api/classrooms", classroomRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/material", materialRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/whiteboard", whiteboardRoutes);

module.exports = app;
