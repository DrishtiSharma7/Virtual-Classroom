const Classroom = require("../classroom/classroom.model");
const Session = require("../session/session.model");
const Attendance = require("../attendance/attendance.model");
const attendanceService = require("../attendance/attendance.service");

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
    const recentClasses = classrooms.slice(0, 4).map((c) => ({
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

    const classroomIds = classrooms.map((c) => c._id);
    const sessionIds = teacherSessions.map((session) => session._id);

    let attendance = 0;
    try {
      const attendanceList = await attendanceService.getAttendanceDashboard(user.id);
      if (Array.isArray(attendanceList) && attendanceList.length > 0) {
        const totalPct = attendanceList.reduce(
          (sum, s) => sum + (Number(s.attendancePercentage) || 0),
          0
        );
        attendance = Math.round(totalPct / attendanceList.length);
      } else if (sessionIds.length > 0 || classroomIds.length > 0) {
        const allSessions = await Session.find({
          $or: [
            { createdBy: user.id },
            { classroom: { $in: classroomIds } },
          ],
        })
          .select("_id")
          .lean();
        const allSessionIds = allSessions.map((s) => s._id);

        if (allSessionIds.length > 0) {
          const [totalAttendance, presentAttendance] = await Promise.all([
            Attendance.countDocuments({
              session: { $in: allSessionIds },
            }),
            Attendance.countDocuments({
              session: { $in: allSessionIds },
              isPresent: true,
            }),
          ]);

          attendance =
            totalAttendance === 0
              ? 0
              : Math.round((presentAttendance / totalAttendance) * 100);
        }
      }
    } catch (err) {
      console.error("Error computing teacher dashboard attendance:", err);
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
  const [enrolledClasses, myClasses, studentRecords] = await Promise.all([
    Classroom.countDocuments({
      students: user.id,
    }),
    Classroom.find({
      students: user.id,
    })
      .populate("teacher", "name")
      .sort({ createdAt: -1 })
      .limit(4)
      .select("name subject teacher createdAt")
      .lean(),
    Attendance.find({
      student: user.id,
    })
      .select("attendancePercentage isPresent")
      .lean(),
  ]);

  let attendance = 0;
  if (Array.isArray(studentRecords) && studentRecords.length > 0) {
    const totalPercentage = studentRecords.reduce((sum, r) => {
      const val =
        typeof r.attendancePercentage === "number" && r.attendancePercentage >= 0
          ? r.attendancePercentage
          : r.isPresent
            ? 100
            : 0;
      return sum + val;
    }, 0);
    attendance = Math.round(totalPercentage / studentRecords.length);
  }

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
