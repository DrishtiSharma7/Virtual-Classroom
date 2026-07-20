export const studentDashboardData = {
  studentName: "Drishti",

  stats: {
    enrolledClasses: 6,
    pendingAssignments: 3,
    upcomingQuizzes: 2,
    attendance: 91,
  },

  myClasses: [
    {
      id: 1,
      subject: "Data Structures",
      teacher: "Prof. Sharma",
      session: "10:00 AM",
      status: "Active",
    },
    {
      id: 2,
      subject: "Web Development",
      teacher: "Prof. Mehta",
      session: "Tomorrow",
      status: "Upcoming",
    },
    {
      id: 3,
      subject: "Operating Systems",
      teacher: "Prof. Singh",
      session: "Friday",
      status: "Active",
    },
  ],

  recentActivity: [
    {
      id: 1,
      title: "Assignment submitted successfully",
    },
    {
      id: 2,
      title: "Joined Web Development class",
    },
    {
      id: 3,
      title: "Quiz completed",
    },
    {
      id: 4,
      title: "Attendance marked",
    },
    {
      id: 5,
      title: "New class added",
    },
  ],
};
