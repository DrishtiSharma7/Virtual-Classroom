const Attendance = require("./attendance.model");
const Classroom = require("../classroom/classroom.model");
const Session = require("../session/session.model");

// =============================
// Student Joins Session
// =============================
exports.studentJoined = async ({ classroomId, sessionId, studentId }) => {
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
exports.studentLeft = async ({ sessionId, studentId }) => {
  const attendance = await Attendance.findOne({
    session: sessionId,
    student: studentId,
  });

  if (!attendance) return null;

  const leaveTime = new Date();

  attendance.leaveTime = leaveTime;

  attendance.duration = Math.floor((leaveTime - attendance.joinTime) / 1000);

  attendance.status = "LEFT";

  const session = await Session.findById(sessionId);

  if (session && session.endTime) {
    const sessionDuration = Math.floor(
      (session.endTime - session.startTime) / 1000,
    );

    attendance.attendancePercentage =
      sessionDuration > 0 ? (attendance.duration / sessionDuration) * 100 : 0;

    attendance.isPresent = attendance.attendancePercentage >= 60;
  }

  await attendance.save();

  return attendance;
};

// =============================
// Teacher Ends Session
// =============================
exports.completeSessionAttendance = async (sessionId) => {
  const records = await Attendance.find({
    session: sessionId,
    status: "IN_SESSION",
  });

  for (const attendance of records) {
    attendance.leaveTime = new Date();

    const session = await Session.findById(sessionId);

    const sessionDuration = Math.floor(
      (session.endTime - session.startTime) / 1000,
    );

    attendance.attendancePercentage =
      (attendance.duration / sessionDuration) * 100;

    attendance.isPresent = attendance.attendancePercentage >= 60;

    attendance.status = "COMPLETED";

    await attendance.save();
  }

  return true;
};

// =============================
// Teacher Attendance
// =============================
exports.getSessionAttendance = async (sessionId) => {
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
exports.getStudentAttendance = async (studentId) => {
  return Attendance.find({
    student: studentId,
  })
    .populate("classroom", "name subject")
    .populate("session", "title startTime")
    .sort({
      createdAt: -1,
    });
};

// =============================
// Classroom Attendance Dashboard
// =============================
exports.getClassroomAttendance = async (classroomId) => {
  // Total sessions of this classroom
  const totalSessions = await Session.countDocuments({
    classroom: classroomId,
    status: "ended",
  });

  // Attendance records
  const records = await Attendance.find({
    classroom: classroomId,
  }).populate("student", "name email");

  const studentMap = new Map();

  records.forEach((record) => {
    const id = record.student._id.toString();

    if (!studentMap.has(id)) {
      studentMap.set(id, {
        studentId: id,
        name: record.student.name,
        email: record.student.email,
        totalSessions,
        presentSessions: 0,
        absentSessions: 0,
        attendancePercentage: 0,
      });
    }

    const student = studentMap.get(id);

    if (record.isPresent) {
      student.presentSessions += 1;
    } else {
      student.absentSessions += 1;
    }
  });

  // Calculate attendance percentage
  studentMap.forEach((student) => {
    if (student.totalSessions > 0) {
      student.attendancePercentage = Number(
        ((student.presentSessions / student.totalSessions) * 100).toFixed(2),
      );
    }
  });

  return Array.from(studentMap.values());
};

// ======================================
// Teacher Attendance Dashboard
// ======================================
exports.getAttendanceDashboard = async (teacherId) => {
  // Teacher ki saari classrooms
  const classrooms = await Classroom.find({
    teacher: teacherId,
  });

  if (!classrooms.length) {
    return [];
  }

  const classroomIds = classrooms.map((c) => c._id);

  // In classrooms ki saari ended sessions
  const sessions = await Session.find({
    classroom: { $in: classroomIds },
    status: "ended",
  });

  const sessionIds = sessions.map((s) => s._id);

  // Attendance Records
  const records = await Attendance.find({
    session: { $in: sessionIds },
  })
    .populate("student", "name email")
    .populate("classroom", "name");

  const attendanceMap = new Map();

  records.forEach((record) => {
    const key =
      record.student._id.toString() + "_" + record.classroom._id.toString();

    if (!attendanceMap.has(key)) {
      attendanceMap.set(key, {
        id: key,

        studentId: record.student._id,

        name: record.student.name,

        email: record.student.email,

        classroom: record.classroom.name,

        totalSessions: sessions.filter(
          (s) => s.classroom.toString() === record.classroom._id.toString(),
        ).length,

        presentSessions: 0,

        absentSessions: 0,

        attendancePercentage: 0,
      });
    }

    const student = attendanceMap.get(key);

    // 60% rule
    if (record.isPresent) {
      student.presentSessions++;
    } else {
      student.absentSessions++;
    }
  });

  attendanceMap.forEach((student) => {
    if (student.totalSessions > 0) {
      student.attendancePercentage = Number(
        ((student.presentSessions / student.totalSessions) * 100).toFixed(2),
      );
    }
  });

  return Array.from(attendanceMap.values());
};
