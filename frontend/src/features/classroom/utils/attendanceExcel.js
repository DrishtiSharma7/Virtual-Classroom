import * as XLSX from "xlsx";

const filenameSafe = (value) =>
  String(value || "attendance")
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

export const exportTeacherAttendanceToExcel = (rows, scopeLabel) => {
  const sheetRows = rows.map((row) => ({
    Student: row.name,
    Email: row.email,
    Classroom: row.classroom || "",
    "Total Sessions": row.totalSessions,
    Present: row.presentSessions,
    Absent: row.absentSessions,
    "Attendance %": row.attendancePercentage,
  }));

  const sheet = XLSX.utils.json_to_sheet(sheetRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Attendance");
  XLSX.writeFile(workbook, `attendance-${filenameSafe(scopeLabel)}.xlsx`);
};

export const exportMyAttendanceToExcel = (rows, studentName) => {
  const sheetRows = rows.map((row) => ({
    Class: row.classroomName,
    Session: row.sessionTitle,
    "Session Date": row.sessionDate
      ? new Date(row.sessionDate).toLocaleDateString()
      : "",
    "Session Duration (min)":
      row.sessionDurationSeconds !== null
        ? Math.round(row.sessionDurationSeconds / 60)
        : "",
    "Time Attended (min)": Math.round(row.timeAttendedSeconds / 60),
    "Attendance %": row.attendancePercentage,
    Status: row.isPresent ? "Present" : "Absent",
  }));

  const sheet = XLSX.utils.json_to_sheet(sheetRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "My Attendance");
  XLSX.writeFile(workbook, `my-attendance-${filenameSafe(studentName)}.xlsx`);
};
