import * as XLSX from "xlsx";
import jsPDF from "jspdf";

const filenameSafe = (value) =>
  String(value || "analytics")
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

// Builds one workbook with a sheet per section, using only data already
// loaded in the current view (respects whatever filters are active).
export const exportAnalyticsToExcel = ({
  scopeLabel,
  dateRangeLabel,
  kpis = [],
  attendanceRows = [],
  sessionRows = [],
  quizRankingRows = [],
}) => {
  const workbook = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.json_to_sheet([
    { Class: scopeLabel, "Date Range": dateRangeLabel },
    {},
    ...kpis.map((k) => ({
      Metric: k.label,
      Value: `${k.value}${k.unit || ""}`,
    })),
  ]);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "KPI Summary");

  if (attendanceRows.length) {
    const sheet = XLSX.utils.json_to_sheet(
      attendanceRows.map((r) => ({
        Student: r.name,
        Email: r.email,
        Sessions: r.sessions,
        Present: r.present,
        Absent: r.absent,
        "Attendance %": r.attendancePercentage,
        Status: r.status,
      })),
    );
    XLSX.utils.book_append_sheet(workbook, sheet, "Attendance");
  }

  if (sessionRows.length) {
    const sheet = XLSX.utils.json_to_sheet(
      sessionRows.map((r) => ({
        Date: r.date ? new Date(r.date).toLocaleDateString() : "",
        Class: r.classroom,
        "Duration (min)": r.durationMinutes,
        "Students Joined": r.studentsJoined,
        "Attendance %": r.attendancePercentage,
        Quiz: r.hasQuiz ? "Yes" : "No",
        Status: r.status,
      })),
    );
    XLSX.utils.book_append_sheet(workbook, sheet, "Sessions");
  }

  if (quizRankingRows.length) {
    const sheet = XLSX.utils.json_to_sheet(
      quizRankingRows.map((r) => ({
        Rank: r.rank,
        Student: r.name,
        Attempts: r.attempts,
        "Average Score %": r.averageScore,
        "Accuracy %": r.accuracy,
      })),
    );
    XLSX.utils.book_append_sheet(workbook, sheet, "Quiz Ranking");
  }

  XLSX.writeFile(workbook, `analytics-${filenameSafe(scopeLabel)}.xlsx`);
};

// A clean text/table PDF summary (KPIs + insights + top rows) — not a chart
// screenshot, so it renders reliably regardless of chart layout timing.
export const exportAnalyticsToPdf = ({
  scopeLabel,
  dateRangeLabel,
  kpis = [],
  insights = [],
  attendanceRows = [],
  sessionRows = [],
}) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 40;
  let y = 50;
  const lineHeight = 16;
  const pageHeight = doc.internal.pageSize.getHeight();

  const ensureSpace = (need = lineHeight) => {
    if (y + need > pageHeight - 40) {
      doc.addPage();
      y = 50;
    }
  };

  doc.setFontSize(18);
  doc.text("Analytics Report", marginX, y);
  y += 24;

  doc.setFontSize(11);
  doc.text(`Class: ${scopeLabel}`, marginX, y);
  y += lineHeight;
  doc.text(`Date range: ${dateRangeLabel}`, marginX, y);
  y += lineHeight * 1.5;

  doc.setFontSize(14);
  doc.text("KPI Summary", marginX, y);
  y += lineHeight;
  doc.setFontSize(10);
  kpis.forEach((k) => {
    ensureSpace();
    doc.text(`${k.label}: ${k.value}${k.unit || ""}`, marginX, y);
    y += lineHeight;
  });
  y += lineHeight / 2;

  if (insights.length) {
    ensureSpace(lineHeight * 2);
    doc.setFontSize(14);
    doc.text("Insights", marginX, y);
    y += lineHeight;
    doc.setFontSize(10);
    insights.forEach((insight) => {
      ensureSpace();
      const lines = doc.splitTextToSize(`- ${insight.message}`, 500);
      lines.forEach((line) => {
        ensureSpace();
        doc.text(line, marginX, y);
        y += lineHeight;
      });
    });
    y += lineHeight / 2;
  }

  if (attendanceRows.length) {
    ensureSpace(lineHeight * 2);
    doc.setFontSize(14);
    doc.text("Student Attendance", marginX, y);
    y += lineHeight;
    doc.setFontSize(9);
    attendanceRows.slice(0, 25).forEach((r) => {
      ensureSpace();
      doc.text(
        `${r.name} — ${r.attendancePercentage}% (${r.status})`,
        marginX,
        y,
      );
      y += lineHeight * 0.9;
    });
    y += lineHeight / 2;
  }

  if (sessionRows.length) {
    ensureSpace(lineHeight * 2);
    doc.setFontSize(14);
    doc.text("Recent Sessions", marginX, y);
    y += lineHeight;
    doc.setFontSize(9);
    sessionRows.slice(0, 25).forEach((r) => {
      ensureSpace();
      const date = r.date ? new Date(r.date).toLocaleDateString() : "";
      doc.text(
        `${date} — ${r.classroom} — ${r.durationMinutes}min — ${r.attendancePercentage}% attendance`,
        marginX,
        y,
      );
      y += lineHeight * 0.9;
    });
  }

  doc.save(`analytics-${filenameSafe(scopeLabel)}.pdf`);
};
