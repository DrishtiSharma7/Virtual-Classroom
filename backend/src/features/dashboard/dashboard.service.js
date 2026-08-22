const Classroom = require("../classroom/classroom.model");
const Session = require("../session/session.model");
const Attendance = require("../attendance/attendance.model");

const getDashboardData = async (user) => {
  console.log("USER NAME:", user.name);
  if (user.role === "teacher") {
    const totalClasses = await Classroom.countDocuments({
      teacher: user.id,
    });

    const recentClasses = await Classroom.find({
      teacher: user.id,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name subject createdAt");

    const liveSessions = await Session.countDocuments({
      createdBy: user.id,
      status: "live",
    });

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

    const teacherSessions = await Session.find({
      createdBy: user.id,
    }).select("_id");

    const sessionIds = teacherSessions.map((session) => session._id);

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
