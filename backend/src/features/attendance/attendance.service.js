const Attendance = require("./attendance.model");
const Classroom = require("../classroom/classroom.model");
const Session = require("../session/session.model");

// A student is only credited for time actually spent connected — this is
// the threshold (as a % of the session's actual duration) above which a
// student counts as "Present" rather than "Absent". Configurable per the
// same pattern sessionLifecycle.js uses for its own timeout, rather than
// hardcoded, since different classrooms may want a stricter/looser bar.
const ATTENDANCE_THRESHOLD = Number(process.env.ATTENDANCE_THRESHOLD) || 60;

// How long a disconnected student is shown as "Reconnecting" (rather than
// "Disconnected") in the live teacher view before we give up hoping for a
// WebRTC/socket reconnect. Purely a live-view display concern — it does
// NOT affect the persisted attendance math, which always sums exactly the
// connected intervals regardless of how long any gap between them was.
const ATTENDANCE_RECONNECT_GRACE_MS =
  Number(process.env.ATTENDANCE_RECONNECT_GRACE_MS) || 2 * 60 * 1000;

// Sum of every closed connected interval's length, in whole seconds. When
// `now` lands inside a still-open interval (no disconnectedAt yet), that
// interval's elapsed-so-far time is included too — this is what lets the
// same helper serve both "final duration" (all intervals closed) and
// "time present so far" (one interval still open) call sites.
function sumIntervalSeconds(intervals, now = new Date()) {
  return Math.floor(
    intervals.reduce((total, interval) => {
      const end = interval.disconnectedAt || now;
      return total + (end - interval.connectedAt) / 1000;
    }, 0),
  );
}

// Exactly one Attendance doc may ever exist per (session, student) — the
// schema's unique index enforces this at the DB level. Two "connect"
// events racing each other (e.g. two tabs opened at the same instant)
// both attempt this upsert; MongoDB lets one through and the other gets a
// duplicate-key error, which we catch and resolve to the winner's doc
// instead of treating it as a real failure.
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

// =============================
// A student connected (socket "join-room", or reconnected after a drop).
// Idempotent: a second connect while one is already open is a no-op, so
// duplicate join events, a page refresh racing the old socket's disconnect,
// and multiple tabs (the room registry only ever keeps one live entry per
// user — see sockets/socket.js) can never open two overlapping intervals.
// =============================
exports.recordConnect = async ({ session, classroomId, studentId }) => {
  // Never trust a client-provided timestamp/duration — every value written
  // here comes from the server clock or from the already-authorized
  // `session` doc the caller fetched via getAuthorizedSession. A student
  // can't mark themselves present without the server itself observing a
  // verified socket join.
  if (!session || session.status !== "live") return null;

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

// =============================
// A student disconnected (explicit "leave-room", socket "disconnect", or
// evicted as a stale duplicate when another tab took over). Idempotent:
// closing an already-closed (or nonexistent) open interval is a no-op.
// =============================
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

// =============================
// Teacher ends session (or the auto-end timer does, on host inactivity) —
// finalize every student still marked IN_SESSION: close any interval left
// open (they were connected right up to session end), total their
// connected time, and score it against the session's *actual* duration.
// =============================
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

// =============================
// Best-effort recovery for a server restart/crash mid-session: any
// interval still open in the DB can no longer be trusted (this fresh
// process's in-memory room registry is empty, so nothing is "really"
// still connected regardless of what Mongo says) — close it at restart
// time. If that student is in fact still connected, their client's next
// heartbeat/reconnect naturally opens a fresh interval afterward.
// =============================
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

// =============================
// Teacher's live view of an in-progress session (item 16) — derived
// entirely from persisted state + elapsed wall-clock time, no dependency
// on the in-memory socket room registry, so it stays correct even across
// a server restart.
// =============================
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

// =========================================
// Teacher views attendance of session
// =========================================
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
    .populate("session", "title startTime endTime")
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

    // isPresent was already decided against ATTENDANCE_THRESHOLD when this
    // session's attendance was finalized.
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
