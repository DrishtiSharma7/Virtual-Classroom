const Attendance = require("./attendance.model");

// =============================
// Student Joins Session
// =============================
exports.studentJoined = async ({
  classroomId,
  sessionId,
  studentId,
}) => {
  const existingAttendance = await Attendance.findOne({
    session: sessionId,
    student: studentId,
  });

  if (existingAttendance) {
    return existingAttendance;
  }

  return Attendance.create({
    classroom: classroomId,
    session: sessionId,
    student: studentId,
    joinTime: new Date(),
    status: "IN_SESSION",
  });
};

// =============================
// Student Leaves Session
// =============================
exports.studentLeft = async ({
  sessionId,
  studentId,
}) => {
  const attendance = await Attendance.findOne({
    session: sessionId,
    student: studentId,
  });

  if (!attendance) return null;

  const leaveTime = new Date();

  attendance.leaveTime = leaveTime;

  attendance.duration = Math.floor(
    (leaveTime - attendance.joinTime) / 1000
  );

  attendance.status = "LEFT";

  await attendance.save();

  return attendance;
};

// =============================
// Teacher Ends Session
// =============================
exports.completeSessionAttendance = async (
  sessionId
) => {
  const records = await Attendance.find({
    session: sessionId,
    status: "IN_SESSION",
  });

  for (const attendance of records) {
    attendance.leaveTime = new Date();

    attendance.duration = Math.floor(
      (attendance.leaveTime - attendance.joinTime) /
        1000
    );

    attendance.status = "COMPLETED";

    await attendance.save();
  }

  return true;
};

// =============================
// Teacher Attendance
// =============================
exports.getSessionAttendance = async (
  sessionId
) => {
  return Attendance.find({
    session: sessionId,
  })
    .populate("student", "name email")
    .sort({
      joinTime: 1,
    });
};

// =============================
// Student Attendance
// =============================
exports.getStudentAttendance = async (
  studentId
) => {
  return Attendance.find({
    student: studentId,
  })
    .populate("classroom", "name subject")
    .populate("session", "title startTime")
    .sort({
      createdAt: -1,
    });
};