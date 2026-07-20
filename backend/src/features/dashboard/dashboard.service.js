const Classroom = require("../classroom/classroom.model");
const Session = require("../session/session.model");
const Attendance = require("../attendance/attendance.model");

const getDashboardData = async (user) => {
  console.log("USER NAME:", user.name);
  // ============================
  // TEACHER DASHBOARD
  // ============================
  if (user.role === "teacher") {
    // Total Classrooms
    const totalClasses = await Classroom.countDocuments({
      teacher: user.id,
    });

    // Recent Classrooms
    const recentClasses = await Classroom.find({
      teacher: user.id,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name subject createdAt");

    // Live Sessions
    const liveSessions = await Session.countDocuments({
      createdBy: user.id,
      status: "live",
    });

    // Total Unique Students
    const classrooms = await Classroom.find({
      teacher: user.id,
    }).select("students");

    const uniqueStudents = new Set();

    classrooms.forEach((classroom) => {
      classroom.students.forEach((studentId) => {
        uniqueStudents.add(studentId.toString());
      });
    });

    const totalStudents = uniqueStudents.size;

    // Teacher Sessions
    const teacherSessions = await Session.find({
      createdBy: user.id,
    }).select("_id");

    const sessionIds = teacherSessions.map((session) => session._id);

    // Attendance
    const totalAttendance = await Attendance.countDocuments({
      session: {
        $in: sessionIds,
      },
    });

    const completedAttendance = await Attendance.countDocuments({
      session: {
        $in: sessionIds,
      },
      status: {
        $in: ["LEFT", "COMPLETED"],
      },
    });

    const attendance =
      totalAttendance === 0
        ? 0
        : Math.round((completedAttendance / totalAttendance) * 100);

    return {
      role: "teacher",
      welcomeName: user.name,
      stats: {
        totalClasses,
        totalStudents,
        liveSessions,
        attendance,
      },
      recentClasses,
      recentActivity: [],
    };
  }

  // ============================
  // STUDENT DASHBOARD
  // ============================

  const enrolledClasses = await Classroom.countDocuments({
    students: user.id,
  });

  const myClasses = await Classroom.find({
    students: user.id,
  })
    .populate("teacher", "name")
    .sort({ createdAt: -1 })
    .limit(5)
    .select("name subject teacher createdAt");

  // Student Attendance
  const totalAttendance = await Attendance.countDocuments({
    student: user.id,
  });

  const completedAttendance = await Attendance.countDocuments({
    student: user.id,
    status: {
      $in: ["LEFT", "COMPLETED"],
    },
  });

  const attendance =
    totalAttendance === 0
      ? 0
      : Math.round((completedAttendance / totalAttendance) * 100);

  return {
    role: "student",
    welcomeName: user.name,
    stats: {
      enrolledClasses,
      upcomingClasses: 0,
      attendance,
      quizzes: 0,
    },
    myClasses,
    recentActivity: [],
  };
};

module.exports = {
  getDashboardData,
};
