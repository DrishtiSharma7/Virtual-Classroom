const Attendance = require("./attendance.model");
const Classroom = require("../classroom/classroom.model");
const Session = require("../session/session.model");

const ATTENDANCE_THRESHOLD = Number(process.env.ATTENDANCE_THRESHOLD) || 60;

const ATTENDANCE_RECONNECT_GRACE_MS =
  Number(process.env.ATTENDANCE_RECONNECT_GRACE_MS) || 2 * 60 * 1000;

function sumIntervalSeconds(intervals, now = new Date()) {
  return Math.floor(
    intervals.reduce((total, interval) => {
      const end = interval.disconnectedAt || now;
      return total + (end - interval.connectedAt) / 1000;
    }, 0),
  );
}

async function findOrCreateAttendance({ classroomId, sessionId, studentId }) {
  try {
    return await Attendance.findOneAndUpdate(
      { session: sessionId, student: studentId },
      {
        $setOnInsert: {
          classroom: classroomId,
          session: sessionId,
          student: studentId,
          joinTime: new Date(),
          status: "IN_SESSION",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  } catch (err) {
    if (err.code === 11000) {
      return Attendance.findOne({ session: sessionId, student: studentId });
    }
    throw err;
  }
}

exports.recordConnect = async ({ session, classroomId, studentId }) => {
  if (!session || session.status !== "live")
    return null;

  const attendance = await findOrCreateAttendance({
    classroomId,
    sessionId: session._id,
    studentId,
  });

  await Attendance.updateOne(
    {
      _id: attendance._id,
      connectedIntervals: { $not: { $elemMatch: { disconnectedAt: null } } },
    },
    {
      $push: {
        connectedIntervals: { connectedAt: new Date(), disconnectedAt: null },
      },
    },
  );

  return attendance;
};

exports.recordDisconnect = async ({ sessionId, studentId }) => {
  const now = new Date();

  await Attendance.updateOne(
    {
      session: sessionId,
      student: studentId,
      connectedIntervals: { $elemMatch: { disconnectedAt: null } },
    },
    {
      $set: {
        "connectedIntervals.$[open].disconnectedAt": now,
        leaveTime: now,
      },
    },
    { arrayFilters: [{ "open.disconnectedAt": null }] },
  );

  const attendance = await Attendance.findOne({
    session: sessionId,
    student: studentId,
  });
  if (!attendance) return null;

  attendance.duration = sumIntervalSeconds(attendance.connectedIntervals);
  await attendance.save();

  return attendance;
};

exports.completeSessionAttendance = async (sessionId) => {
  const session = await Session.findById(sessionId);
  if (!session) return true;

  const finalizedAt = session.endTime || new Date();
  const sessionDurationSeconds = Math.floor(
    (finalizedAt - session.startTime) / 1000,
  );

  const records = await Attendance.find({
    session: sessionId,
    status: "IN_SESSION",
  });

  for (const attendance of records) {
    attendance.connectedIntervals.forEach((interval) => {
      if (!interval.disconnectedAt) interval.disconnectedAt = finalizedAt;
    });

    attendance.duration = sumIntervalSeconds(
      attendance.connectedIntervals,
      finalizedAt,
    );
    attendance.leaveTime = finalizedAt;

    attendance.attendancePercentage =
      sessionDurationSeconds > 0
        ? (attendance.duration / sessionDurationSeconds) * 100
        : 0;

    attendance.isPresent = attendance.attendancePercentage >= ATTENDANCE_THRESHOLD;
    attendance.status = "COMPLETED";

    await attendance.save();
  }

  return true;
};

exports.reconcileOnStartup = async () => {
  const now = new Date();

  const dangling = await Attendance.find({
    status: "IN_SESSION",
    connectedIntervals: { $elemMatch: { disconnectedAt: null } },
  });

  for (const attendance of dangling) {
    attendance.connectedIntervals.forEach((interval) => {
      if (!interval.disconnectedAt) interval.disconnectedAt = now;
    });
    attendance.duration = sumIntervalSeconds(attendance.connectedIntervals, now);
    attendance.leaveTime = now;
    await attendance.save();
  }

  return dangling.length;
};

exports.getLiveSessionAttendance = async (sessionId) => {
  const session = await Session.findById(sessionId);
  if (!session) return [];

  const now = new Date();
  const elapsedSeconds = Math.max(0, (now - session.startTime) / 1000);

  const records = await Attendance.find({
    session: sessionId,
    status: "IN_SESSION",
  }).populate("student", "name email");

  return records.map((attendance) => {
    const isOpen = attendance.connectedIntervals.some(
      (interval) => !interval.disconnectedAt,
    );
    const timePresentSoFar = sumIntervalSeconds(
      attendance.connectedIntervals,
      now,
    );

    let connectionStatus = "Disconnected";
    if (isOpen) {
      connectionStatus = "Connected";
    } else if (
      attendance.leaveTime &&
      now - attendance.leaveTime < ATTENDANCE_RECONNECT_GRACE_MS
    ) {
      connectionStatus = "Reconnecting";
    }

    return {
      studentId: attendance.student._id,
      name: attendance.student.name,
      email: attendance.student.email,
      connectionStatus,
      timePresentSoFar,
      currentPercentage:
        elapsedSeconds > 0
          ? Number(((timePresentSoFar / elapsedSeconds) * 100).toFixed(2))
          : 0,
    };
  });
};

exports.getSessionAttendance = async (sessionId) => {
  return Attendance.find({
    session: sessionId,
  })
    .populate("student", "name email")
    .sort({
      joinTime: 1,
    });
};

exports.getStudentAttendance = async (studentId) => {
  return Attendance.find({
    student: studentId,
  })
    .populate("classroom", "name subject")
    .populate("session", "title startTime endTime")
    .sort({
      createdAt: -1,
    });
};

exports.getClassroomAttendance = async (classroomId) => {
  const totalSessions = await Session.countDocuments({
    classroom: classroomId,
    status: "ended",
  });

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

  studentMap.forEach((student) => {
    if (student.totalSessions > 0) {
      student.attendancePercentage = Number(
        ((student.presentSessions / student.totalSessions) * 100).toFixed(2),
      );
    }
  });

  return Array.from(studentMap.values());
};

exports.getAttendanceDashboard = async (teacherId) => {
  const classrooms = await Classroom.find({
    teacher: teacherId,
  });

  if (!classrooms.length) {
    return [];
  }

  const classroomIds = classrooms.map((c) => c._id);

  const sessions = await Session.find({
    classroom: { $in: classroomIds },
    status: "ended",
  });

  const sessionIds = sessions.map((s) => s._id);

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
