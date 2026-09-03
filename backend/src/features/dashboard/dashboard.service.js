const Classroom = require("../classroom/classroom.model");
const Session = require("../session/session.model");
const Attendance = require("../attendance/attendance.model");

const getDashboardData = async (user) => {
  if (user.role === "teacher") {
    // Run classroom query, live sessions count, and sessions query concurrently
    const [classrooms, liveSessions, teacherSessions] = await Promise.all([
      Classroom.find({ teacher: user.id })
        .sort({ createdAt: -1 })
        .select("name subject createdAt students")
        .lean(),
      Session.countDocuments({
        createdBy: user.id,
        status: "live",
      }),
      Session.find({
        createdBy: user.id,
      })
        .select("_id")
        .lean(),
    ]);

    const totalClasses = classrooms.length;
    const recentClasses = classrooms.slice(0, 5).map((c) => ({
      _id: c._id,
      name: c.name,
      subject: c.subject,
      createdAt: c.createdAt,
    }));

    const uniqueStudents = new Set();
    classrooms.forEach((classroom) => {
      if (Array.isArray(classroom.students)) {
        classroom.students.forEach((studentId) => {
          uniqueStudents.add(studentId.toString());
        });
      }
    });
    const totalStudents = uniqueStudents.size;

    const sessionIds = teacherSessions.map((session) => session._id);

    let attendance = 0;
    if (sessionIds.length > 0) {
      const [totalAttendance, completedAttendance] = await Promise.all([
        Attendance.countDocuments({
          session: {
            $in: sessionIds,
          },
        }),
        Attendance.countDocuments({
          session: {
            $in: sessionIds,
          },
          status: {
            $in: ["LEFT", "COMPLETED"],
          },
        }),
      ]);

      attendance =
        totalAttendance === 0
          ? 0
          : Math.round((completedAttendance / totalAttendance) * 100);
    }

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

  // Student: Run enrolled count, myClasses, and attendance queries concurrently
  const [enrolledClasses, myClasses, totalAttendance, completedAttendance] =
    await Promise.all([
      Classroom.countDocuments({
        students: user.id,
      }),
      Classroom.find({
        students: user.id,
      })
        .populate("teacher", "name")
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name subject teacher createdAt")
        .lean(),
      Attendance.countDocuments({
        student: user.id,
      }),
      Attendance.countDocuments({
        student: user.id,
        status: {
          $in: ["LEFT", "COMPLETED"],
        },
      }),
    ]);

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
