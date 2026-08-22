const mongoose = require("mongoose");
const Classroom = require("../classroom/classroom.model");
const Session = require("../session/session.model");
const Attendance = require("../attendance/attendance.model");
const Quiz = require("../Quiz/quiz.model");
const QuizResponse = require("../Quiz/quizResponse.model");
const User = require("../auth/auth.model");

const DEFAULT_RANGE_DAYS = 30;
const MOST_ACTIVE_LIMIT = 5;

// ---------------------------------------------------------------------------
// Shared formula/threshold constants (surfaced to the frontend via tooltips)
// ---------------------------------------------------------------------------
// Attendance % (per scope)      = present attendance docs (isPresent) / total attendance docs x 100
// Quiz score %  (per response)  = response.score / quiz.questions.length x 100
// Quiz participation %          = distinct students with >=1 response / enrolled students x 100
// Avg session duration          = avg(endTime - startTime) over status:"ended" sessions in range
// Engagement score              = 0.6 x avgAttendance% + 0.4 x quizParticipation%
//   (chat is intentionally excluded: Chat docs are deleted when a session ends,
//   so there is no reliable historical chat signal to compute from)
const ATTENDANCE_BANDS = [
  { min: 90, status: "Excellent" },
  { min: 75, status: "Good" },
  { min: 50, status: "Needs Attention" },
  { min: 0, status: "Critical" },
];
const DIFFICULTY_BANDS = [
  { min: 80, difficulty: "Easy" },
  { min: 50, difficulty: "Medium" },
  { min: 0, difficulty: "Hard" },
];
const ENGAGEMENT_WEIGHTS = { attendance: 0.6, quizParticipation: 0.4 };

class AnalyticsAccessError extends Error {
  constructor(message, status = 404) {
    super(message);
    this.status = status;
  }
}

function round1(n) {
  return Math.round((n + Number.EPSILON) * 10) / 10;
}

function attendanceStatus(pct) {
  return ATTENDANCE_BANDS.find((b) => pct >= b.min).status;
}

function questionDifficulty(correctPct) {
  return DIFFICULTY_BANDS.find((b) => correctPct >= b.min).difficulty;
}

function dayKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function weekKey(date) {
  const d = new Date(date);
  const day = d.getUTCDay();
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - ((day + 6) % 7));
  return dayKey(monday);
}

function monthKey(date) {
  return new Date(date).toISOString().slice(0, 7);
}

function resolveDateRange(fromQuery, toQuery) {
  const to = toQuery ? new Date(toQuery) : new Date();
  let from;
  if (fromQuery) {
    from = new Date(fromQuery);
  } else {
    from = new Date(to);
    from.setDate(from.getDate() - DEFAULT_RANGE_DAYS);
  }
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new AnalyticsAccessError("Invalid date range", 400);
  }
  return { from, to };
}

// The equal-length window immediately preceding [from, to), used for every
// KPI's trend % and for "changed by X%" insights.
function getPreviousPeriod(from, to) {
  const spanMs = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - spanMs);
  return { from: prevFrom, to: prevTo };
}

// Returns null (never a fake 0%/Infinity) when there isn't enough data on
// both sides to say something meaningful.
function pctChange(current, previous) {
  if (previous === null || previous === undefined) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return round1(((current - previous) / previous) * 100);
}

function trendDirection(change) {
  if (change === null || change === undefined) return null;
  if (change > 0.05) return "up";
  if (change < -0.05) return "down";
  return "flat";
}

async function resolveClassroomScope(teacherId, classroomId) {
  if (classroomId && classroomId !== "all") {
    const classroom = await Classroom.findOne({
      _id: classroomId,
      teacher: teacherId,
    }).select("_id");
    if (!classroom) {
      throw new AnalyticsAccessError("Classroom not found", 404);
    }
    return [classroom._id];
  }
  const classrooms = await Classroom.find({ teacher: teacherId }).select("_id");
  return classrooms.map((c) => c._id);
}

async function getEnrolledStudentIds(classroomIds) {
  const classrooms = await Classroom.find({ _id: { $in: classroomIds } }).select(
    "students",
  );
  const set = new Set();
  classrooms.forEach((c) => c.students.forEach((s) => set.add(s.toString())));
  return Array.from(set);
}

async function getEndedSessions(classroomIds, from, to) {
  return Session.find({
    classroom: { $in: classroomIds },
    status: "ended",
    startTime: { $gte: from, $lte: to },
  }).sort({ startTime: 1 });
}

// ---------------------------------------------------------------------------
// Core per-scope metric bundle, reused by overview + trend/previous-period math
// ---------------------------------------------------------------------------
async function computeScopeMetrics(classroomIds, from, to) {
  const classrooms = await Classroom.find({ _id: { $in: classroomIds } }).select(
    "students",
  );
  const studentIds = Array.from(
    new Set(classrooms.flatMap((c) => c.students.map((s) => s.toString()))),
  );
  const sessions = await getEndedSessions(classroomIds, from, to);
  const sessionIds = sessions.map((s) => s._id);

  // A student's "eligible sessions" is scoped to the classroom(s) they're
  // actually enrolled in, not the combined session count across every
  // classroom in view — otherwise "All Classes" would apply one classroom's
  // session count to students who were never enrolled in it.
  const sessionCountByClassroom = new Map();
  sessions.forEach((s) => {
    const key = s.classroom.toString();
    sessionCountByClassroom.set(key, (sessionCountByClassroom.get(key) || 0) + 1);
  });
  const eligibleSessionsByStudent = new Map();
  classrooms.forEach((c) => {
    const count = sessionCountByClassroom.get(c._id.toString()) || 0;
    c.students.forEach((studentId) => {
      const key = studentId.toString();
      eligibleSessionsByStudent.set(key, (eligibleSessionsByStudent.get(key) || 0) + count);
    });
  });

  const attendanceDocs = sessionIds.length
    ? await Attendance.find({ session: { $in: sessionIds } })
    : [];

  const quizzes = await Quiz.find({
    classroom: { $in: classroomIds },
    session: { $in: sessionIds },
  }).select("questions session createdAt title");

  const quizIds = quizzes.map((q) => q._id);
  const responses = quizIds.length
    ? await QuizResponse.find({ quiz: { $in: quizIds } })
    : [];

  const totalStudents = studentIds.length;
  const totalSessions = sessions.length;

  const avgSessionDurationSeconds = sessions.length
    ? sessions.reduce((sum, s) => sum + (s.endTime - s.startTime) / 1000, 0) /
      sessions.length
    : 0;

  const presentCount = attendanceDocs.filter((a) => a.isPresent).length;
  const avgAttendancePct = attendanceDocs.length
    ? (presentCount / attendanceDocs.length) * 100
    : 0;

  const distinctRespondents = new Set(responses.map((r) => r.student.toString()));
  const quizParticipationPct = totalStudents
    ? (distinctRespondents.size / totalStudents) * 100
    : 0;

  const questionCountByQuiz = new Map(
    quizzes.map((q) => [q._id.toString(), q.questions.length || 0]),
  );
  const scorePcts = responses
    .map((r) => {
      const total = questionCountByQuiz.get(r.quiz.toString()) || 0;
      return total > 0 ? (r.score / total) * 100 : null;
    })
    .filter((v) => v !== null);
  const avgQuizScorePct = scorePcts.length
    ? scorePcts.reduce((a, b) => a + b, 0) / scorePcts.length
    : 0;

  const engagementScore =
    ENGAGEMENT_WEIGHTS.attendance * avgAttendancePct +
    ENGAGEMENT_WEIGHTS.quizParticipation * quizParticipationPct;

  return {
    studentIds,
    sessions,
    sessionIds,
    attendanceDocs,
    quizzes,
    quizIds,
    responses,
    questionCountByQuiz,
    eligibleSessionsByStudent,
    totalStudents,
    totalSessions,
    avgSessionDurationSeconds,
    avgAttendancePct,
    quizParticipationPct,
    avgQuizScorePct,
    engagementScore,
  };
}

function buildPerformanceTrends(metrics, from, to) {
  const byDay = new Map();
  const ensureDay = (key) => {
    if (!byDay.has(key)) {
      byDay.set(key, {
        date: key,
        sessions: 0,
        attendanceTotal: 0,
        attendancePresent: 0,
        respondents: new Set(),
        scorePcts: [],
      });
    }
    return byDay.get(key);
  };

  metrics.sessions.forEach((s) => ensureDay(dayKey(s.startTime)).sessions++);

  const sessionDayById = new Map(
    metrics.sessions.map((s) => [s._id.toString(), dayKey(s.startTime)]),
  );
  metrics.attendanceDocs.forEach((a) => {
    const key = sessionDayById.get(a.session.toString());
    if (!key) return;
    const bucket = ensureDay(key);
    bucket.attendanceTotal++;
    if (a.isPresent) bucket.attendancePresent++;
  });

  metrics.responses.forEach((r) => {
    const key = dayKey(r.createdAt);
    const bucket = ensureDay(key);
    const total = metrics.questionCountByQuiz.get(r.quiz.toString()) || 0;
    if (total > 0) bucket.scorePcts.push((r.score / total) * 100);
    bucket.respondents.add(r.student.toString());
  });

  const days = Array.from(byDay.values()).sort((a, b) =>
    a.date < b.date ? -1 : 1,
  );

  const totalStudents = metrics.totalStudents || 1;
  const series = {
    attendance: [],
    quizScore: [],
    engagement: [],
    participation: [],
    sessionActivity: [],
  };

  days.forEach((d) => {
    const attendancePct = d.attendanceTotal
      ? (d.attendancePresent / d.attendanceTotal) * 100
      : null;
    const scorePct = d.scorePcts.length
      ? d.scorePcts.reduce((a, b) => a + b, 0) / d.scorePcts.length
      : null;
    const participationPct = (d.respondents.size / totalStudents) * 100;
    const engagement =
      attendancePct !== null
        ? ENGAGEMENT_WEIGHTS.attendance * attendancePct +
          ENGAGEMENT_WEIGHTS.quizParticipation * participationPct
        : null;

    series.attendance.push({ date: d.date, value: attendancePct !== null ? round1(attendancePct) : null });
    series.quizScore.push({ date: d.date, value: scorePct !== null ? round1(scorePct) : null });
    series.engagement.push({ date: d.date, value: engagement !== null ? round1(engagement) : null });
    series.participation.push({ date: d.date, value: round1(participationPct) });
    series.sessionActivity.push({ date: d.date, value: d.sessions });
  });

  return series;
}

async function buildEngagementOverview(classroomIds, metrics) {
  const students = metrics.studentIds.length
    ? await User.find({ _id: { $in: metrics.studentIds } }).select("name email")
    : [];
  const studentById = new Map(students.map((s) => [s._id.toString(), s]));

  const perStudent = new Map();
  metrics.studentIds.forEach((id) => {
    perStudent.set(id, {
      studentId: id,
      name: studentById.get(id)?.name || "Unknown",
      email: studentById.get(id)?.email || "",
      sessionsAttended: 0,
      totalDurationSeconds: 0,
      quizAttemptsSet: new Set(),
    });
  });

  metrics.attendanceDocs.forEach((a) => {
    const entry = perStudent.get(a.student.toString());
    if (!entry) return;
    if (a.isPresent) entry.sessionsAttended++;
    entry.totalDurationSeconds += a.duration || 0;
  });

  metrics.responses.forEach((r) => {
    const entry = perStudent.get(r.student.toString());
    if (!entry) return;
    entry.quizAttemptsSet.add(r.quiz.toString());
  });

  const rows = Array.from(perStudent.values()).map((s) => {
    const avgTimeMinutes = s.sessionsAttended
      ? s.totalDurationSeconds / 60 / s.sessionsAttended
      : 0;
    const quizAttempts = s.quizAttemptsSet.size;
    const eligibleSessions = metrics.eligibleSessionsByStudent.get(s.studentId) || 0;
    const attendancePct = eligibleSessions
      ? (s.sessionsAttended / eligibleSessions) * 100
      : 0;
    const quizParticipated = quizAttempts > 0 ? 100 : 0;
    const engagementScore =
      ENGAGEMENT_WEIGHTS.attendance * attendancePct +
      ENGAGEMENT_WEIGHTS.quizParticipation * quizParticipated;

    return {
      studentId: s.studentId,
      name: s.name,
      email: s.email,
      sessionsAttended: s.sessionsAttended,
      avgTimeMinutes: round1(avgTimeMinutes),
      quizAttempts,
      attendancePct: round1(attendancePct),
      engagementScore: round1(engagementScore),
    };
  });

  const mostActive = [...rows]
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, MOST_ACTIVE_LIMIT);

  const needsAttention = rows
    .filter((r) => r.attendancePct < 50 || r.quizAttempts === 0)
    .map((r) => ({
      ...r,
      reasons: [
        ...(r.attendancePct < 50 ? ["Low attendance"] : []),
        ...(r.quizAttempts === 0 ? ["No quiz attempts"] : []),
      ],
    }))
    .sort((a, b) => a.attendancePct - b.attendancePct);

  const activeCount = rows.filter(
    (r) => r.sessionsAttended > 0 || r.quizAttempts > 0,
  ).length;
  const inactiveCount = rows.length - activeCount;

  return { mostActive, needsAttention, activeCount, inactiveCount };
}

function buildInsights(current, previous) {
  const insights = [];

  const lowAttendanceStudents = current.engagement.needsAttention.filter((s) =>
    s.reasons.includes("Low attendance"),
  ).length;
  if (lowAttendanceStudents > 0) {
    insights.push({
      type: "warning",
      message: `${lowAttendanceStudents} student${lowAttendanceStudents === 1 ? " has" : "s have"} attendance below 50%.`,
    });
  }

  const noQuizStudents = current.engagement.needsAttention.filter((s) =>
    s.reasons.includes("No quiz attempts"),
  ).length;
  if (noQuizStudents > 0) {
    insights.push({
      type: "warning",
      message: `${noQuizStudents} student${noQuizStudents === 1 ? " has" : "s have"} not participated in any quiz.`,
    });
  }

  const attendanceChange = pctChange(
    current.metrics.avgAttendancePct,
    previous.metrics.avgAttendancePct,
  );
  if (attendanceChange !== null && Math.abs(attendanceChange) >= 1) {
    insights.push({
      type: attendanceChange > 0 ? "positive" : "warning",
      message: `Class attendance ${attendanceChange > 0 ? "improved" : "decreased"} by ${Math.abs(attendanceChange)}% compared with the previous period.`,
    });
  }

  const scoreChange = pctChange(
    current.metrics.avgQuizScorePct,
    previous.metrics.avgQuizScorePct,
  );
  if (scoreChange !== null && Math.abs(scoreChange) >= 1) {
    insights.push({
      type: scoreChange > 0 ? "positive" : "warning",
      message: `Average quiz score ${scoreChange > 0 ? "increased" : "decreased"} by ${Math.abs(scoreChange)}% compared with the previous period.`,
    });
  }

  const participationChange = pctChange(
    current.metrics.quizParticipationPct,
    previous.metrics.quizParticipationPct,
  );
  if (participationChange !== null && Math.abs(participationChange) >= 1) {
    insights.push({
      type: participationChange > 0 ? "positive" : "info",
      message: `Quiz participation ${participationChange > 0 ? "increased" : "decreased"} by ${Math.abs(participationChange)}% compared with the previous period.`,
    });
  }

  return insights;
}

// ---------------------------------------------------------------------------
// GET /api/analytics/overview
// ---------------------------------------------------------------------------
async function getOverview({ teacherId, classroomId, from, to }) {
  const classroomIds = await resolveClassroomScope(teacherId, classroomId);
  const range = resolveDateRange(from, to);
  const previousRange = getPreviousPeriod(range.from, range.to);

  const metrics = await computeScopeMetrics(classroomIds, range.from, range.to);
  const previousMetrics = await computeScopeMetrics(
    classroomIds,
    previousRange.from,
    previousRange.to,
  );

  const engagement = await buildEngagementOverview(classroomIds, metrics);
  const performanceTrends = buildPerformanceTrends(metrics, range.from, range.to);

  const kpis = [
    {
      key: "totalStudents",
      label: "Total Students",
      value: metrics.totalStudents,
      unit: "",
      trend: null,
      trendDirection: null,
      description: "Enrolled across the selected class(es)",
      tooltip:
        "Current enrollment count. Historical enrollment isn't tracked, so no trend is shown.",
    },
    {
      key: "avgAttendance",
      label: "Average Attendance",
      value: round1(metrics.avgAttendancePct),
      unit: "%",
      trend: pctChange(metrics.avgAttendancePct, previousMetrics.avgAttendancePct),
      trendDirection: trendDirection(
        pctChange(metrics.avgAttendancePct, previousMetrics.avgAttendancePct),
      ),
      description: "Share of attendance records marked present",
      tooltip: "Present attendance records / total attendance records x 100.",
    },
    {
      key: "totalSessions",
      label: "Total Sessions",
      value: metrics.totalSessions,
      unit: "",
      trend: pctChange(metrics.totalSessions, previousMetrics.totalSessions),
      trendDirection: trendDirection(
        pctChange(metrics.totalSessions, previousMetrics.totalSessions),
      ),
      description: "Completed sessions in the selected range",
      tooltip: "Count of sessions with status \"ended\" whose start time falls in the selected range.",
    },
    {
      key: "avgSessionDuration",
      label: "Average Session Duration",
      value: round1(metrics.avgSessionDurationSeconds / 60),
      unit: "min",
      trend: pctChange(
        metrics.avgSessionDurationSeconds,
        previousMetrics.avgSessionDurationSeconds,
      ),
      trendDirection: trendDirection(
        pctChange(
          metrics.avgSessionDurationSeconds,
          previousMetrics.avgSessionDurationSeconds,
        ),
      ),
      description: "Average length of completed sessions",
      tooltip: "Average of (endTime - startTime) across completed sessions in range.",
    },
    {
      key: "quizParticipation",
      label: "Quiz Participation",
      value: round1(metrics.quizParticipationPct),
      unit: "%",
      trend: pctChange(
        metrics.quizParticipationPct,
        previousMetrics.quizParticipationPct,
      ),
      trendDirection: trendDirection(
        pctChange(
          metrics.quizParticipationPct,
          previousMetrics.quizParticipationPct,
        ),
      ),
      description: "Enrolled students who attempted at least one quiz",
      tooltip: "Distinct students with >=1 quiz response / enrolled students x 100.",
    },
    {
      key: "avgQuizScore",
      label: "Average Quiz Score",
      value: round1(metrics.avgQuizScorePct),
      unit: "%",
      trend: pctChange(metrics.avgQuizScorePct, previousMetrics.avgQuizScorePct),
      trendDirection: trendDirection(
        pctChange(metrics.avgQuizScorePct, previousMetrics.avgQuizScorePct),
      ),
      description: "Average score across all quiz attempts",
      tooltip: "Average of (response.score / quiz.questions.length x 100) across all attempts.",
    },
  ];

  const insights = buildInsights(
    { metrics, engagement },
    { metrics: previousMetrics, engagement },
  );

  return {
    range: { from: range.from, to: range.to },
    kpis,
    insights,
    performanceTrends,
    engagementOverview: engagement,
  };
}

// ---------------------------------------------------------------------------
// GET /api/analytics/attendance
// ---------------------------------------------------------------------------
async function getAttendanceAnalytics({
  teacherId,
  classroomId,
  from,
  to,
  page = 1,
  limit = 10,
  sort = "attendancePercentage",
  order = "desc",
  search = "",
  status,
}) {
  const classroomIds = await resolveClassroomScope(teacherId, classroomId);
  const range = resolveDateRange(from, to);
  const metrics = await computeScopeMetrics(classroomIds, range.from, range.to);

  const students = metrics.studentIds.length
    ? await User.find({ _id: { $in: metrics.studentIds } }).select("name email")
    : [];
  const studentById = new Map(students.map((s) => [s._id.toString(), s]));

  const perStudent = new Map();
  metrics.studentIds.forEach((id) => {
    perStudent.set(id, {
      studentId: id,
      name: studentById.get(id)?.name || "Unknown",
      email: studentById.get(id)?.email || "",
      sessions: metrics.eligibleSessionsByStudent.get(id) || 0,
      present: 0,
      absent: 0,
    });
  });

  metrics.attendanceDocs.forEach((a) => {
    const entry = perStudent.get(a.student.toString());
    if (!entry) return;
    if (a.isPresent) entry.present++;
    else entry.absent++;
  });

  let rows = Array.from(perStudent.values()).map((s) => {
    const pct = s.sessions ? (s.present / s.sessions) * 100 : 0;
    return {
      ...s,
      attendancePercentage: round1(pct),
      status: attendanceStatus(pct),
    };
  });

  const sessionDayById = new Map(
    metrics.sessions.map((s) => [s._id.toString(), dayKey(s.startTime)]),
  );
  const dailyMap = new Map();
  metrics.sessions.forEach((s) => {
    const key = dayKey(s.startTime);
    if (!dailyMap.has(key)) dailyMap.set(key, { date: key, present: 0, absent: 0 });
  });
  metrics.attendanceDocs.forEach((a) => {
    const key = sessionDayById.get(a.session.toString());
    if (!key) return;
    const bucket = dailyMap.get(key);
    if (a.isPresent) bucket.present++;
    else bucket.absent++;
  });
  const trend = Array.from(dailyMap.values())
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((d) => ({
      date: d.date,
      present: d.present,
      absent: d.absent,
      attendancePercentage:
        d.present + d.absent > 0
          ? round1((d.present / (d.present + d.absent)) * 100)
          : 0,
    }));

  const distribution = rows.reduce(
    (acc, r) => {
      if (r.status === "Excellent" || r.status === "Good") acc.present++;
      else if (r.status === "Needs Attention") acc.lowAttendance++;
      else acc.absent++;
      return acc;
    },
    { present: 0, absent: 0, lowAttendance: 0 },
  );

  if (status) {
    rows = rows.filter((r) => r.status === status);
  }
  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q),
    );
  }
  rows.sort((a, b) => {
    const dir = order === "asc" ? 1 : -1;
    if (typeof a[sort] === "string") return a[sort].localeCompare(b[sort]) * dir;
    return (a[sort] - b[sort]) * dir;
  });

  const total = rows.length;
  const start = (Number(page) - 1) * Number(limit);
  const paged = rows.slice(start, start + Number(limit));

  return {
    trend,
    distribution,
    table: { rows: paged, total, page: Number(page), limit: Number(limit) },
  };
}

// ---------------------------------------------------------------------------
// GET /api/analytics/sessions
// ---------------------------------------------------------------------------
async function getSessionAnalytics({
  teacherId,
  classroomId,
  from,
  to,
  groupBy = "day",
  page = 1,
  limit = 10,
  sort = "startTime",
  order = "desc",
  search = "",
}) {
  const classroomIds = await resolveClassroomScope(teacherId, classroomId);
  const range = resolveDateRange(from, to);
  const sessions = await getEndedSessions(classroomIds, range.from, range.to);
  const sessionIds = sessions.map((s) => s._id);

  const [classrooms, attendanceDocs, quizzes] = await Promise.all([
    Classroom.find({ _id: { $in: classroomIds } }).select("name"),
    sessionIds.length ? Attendance.find({ session: { $in: sessionIds } }) : [],
    Quiz.find({ session: { $in: sessionIds } }).select("session"),
  ]);
  const classroomById = new Map(classrooms.map((c) => [c._id.toString(), c]));
  const quizBySession = new Set(quizzes.map((q) => q.session.toString()));

  const attendanceBySession = new Map();
  attendanceDocs.forEach((a) => {
    const key = a.session.toString();
    if (!attendanceBySession.has(key)) {
      attendanceBySession.set(key, { present: 0, total: 0 });
    }
    const bucket = attendanceBySession.get(key);
    bucket.total++;
    if (a.isPresent) bucket.present++;
  });

  const durations = sessions.map((s) => (s.endTime - s.startTime) / 1000);
  const totalSessions = sessions.length;
  const avgDuration = durations.length
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0;
  const longest = durations.length ? Math.max(...durations) : 0;
  const shortest = durations.length ? Math.min(...durations) : 0;
  const participantCounts = sessions.map(
    (s) => attendanceBySession.get(s._id.toString())?.total || 0,
  );
  const avgParticipants = participantCounts.length
    ? participantCounts.reduce((a, b) => a + b, 0) / participantCounts.length
    : 0;
  const peakParticipants = participantCounts.length
    ? Math.max(...participantCounts)
    : 0;

  const keyFn = groupBy === "month" ? monthKey : groupBy === "week" ? weekKey : dayKey;
  const activityMap = new Map();
  const durationMap = new Map();
  sessions.forEach((s) => {
    const key = keyFn(s.startTime);
    activityMap.set(key, (activityMap.get(key) || 0) + 1);
    if (!durationMap.has(key)) durationMap.set(key, []);
    durationMap.get(key).push((s.endTime - s.startTime) / 1000 / 60);
  });
  const activityChart = Array.from(activityMap.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, count]) => ({ date, count }));
  const durationTrend = Array.from(durationMap.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, arr]) => ({
      date,
      avgDurationMinutes: round1(arr.reduce((a, b) => a + b, 0) / arr.length),
    }));

  let tableRows = sessions.map((s) => {
    const att = attendanceBySession.get(s._id.toString()) || { present: 0, total: 0 };
    return {
      sessionId: s._id,
      date: s.startTime,
      classroom: classroomById.get(s.classroom.toString())?.name || "Unknown",
      durationMinutes: round1((s.endTime - s.startTime) / 1000 / 60),
      studentsJoined: att.total,
      attendancePercentage: att.total ? round1((att.present / att.total) * 100) : 0,
      hasQuiz: quizBySession.has(s._id.toString()),
      status: s.status,
    };
  });

  if (search) {
    const q = search.toLowerCase();
    tableRows = tableRows.filter((r) => r.classroom.toLowerCase().includes(q));
  }
  tableRows.sort((a, b) => {
    const dir = order === "asc" ? 1 : -1;
    if (sort === "date") return (new Date(a.date) - new Date(b.date)) * dir;
    if (typeof a[sort] === "string") return a[sort].localeCompare(b[sort]) * dir;
    return (a[sort] - b[sort]) * dir;
  });

  const total = tableRows.length;
  const start = (Number(page) - 1) * Number(limit);
  const paged = tableRows.slice(start, start + Number(limit));

  return {
    kpis: {
      totalSessions,
      completedSessions: totalSessions,
      avgDurationMinutes: round1(avgDuration / 60),
      longestDurationMinutes: round1(longest / 60),
      shortestDurationMinutes: round1(shortest / 60),
      avgParticipants: round1(avgParticipants),
      peakParticipants,
    },
    activityChart,
    durationTrend,
    table: { rows: paged, total, page: Number(page), limit: Number(limit) },
  };
}

// ---------------------------------------------------------------------------
// GET /api/analytics/quizzes
// ---------------------------------------------------------------------------
async function getQuizAnalytics({
  teacherId,
  classroomId,
  from,
  to,
  quizId,
  page = 1,
  limit = 10,
  sort = "averageScore",
  order = "desc",
  search = "",
}) {
  const classroomIds = await resolveClassroomScope(teacherId, classroomId);
  const range = resolveDateRange(from, to);
  const sessions = await getEndedSessions(classroomIds, range.from, range.to);
  const sessionIds = sessions.map((s) => s._id);

  const quizzes = await Quiz.find({
    classroom: { $in: classroomIds },
    session: { $in: sessionIds },
  });
  const quizIds = quizzes.map((q) => q._id);
  const responses = quizIds.length
    ? await QuizResponse.find({ quiz: { $in: quizIds } })
    : [];

  const responsesByQuiz = new Map();
  responses.forEach((r) => {
    const key = r.quiz.toString();
    if (!responsesByQuiz.has(key)) responsesByQuiz.set(key, []);
    responsesByQuiz.get(key).push(r);
  });

  const totalAttempts = responses.length;
  const scorePcts = [];
  const accuracyPcts = [];
  quizzes.forEach((q) => {
    const qResponses = responsesByQuiz.get(q._id.toString()) || [];
    const total = q.questions.length || 0;
    if (total === 0) return;
    qResponses.forEach((r) => {
      scorePcts.push((r.score / total) * 100);
      accuracyPcts.push((r.score / total) * 100);
    });
  });
  const avgScore = scorePcts.length
    ? scorePcts.reduce((a, b) => a + b, 0) / scorePcts.length
    : 0;
  const avgAccuracy = accuracyPcts.length
    ? accuracyPcts.reduce((a, b) => a + b, 0) / accuracyPcts.length
    : 0;
  const highest = scorePcts.length ? Math.max(...scorePcts) : 0;
  const lowest = scorePcts.length ? Math.min(...scorePcts) : 0;

  const enrolledStudentIds = await getEnrolledStudentIds(classroomIds);
  // Participation is scoped to the roster of the classroom each quiz
  // actually belongs to — not the combined roster of every classroom in
  // view, which would dilute a single-classroom quiz's participation rate
  // with students who were never eligible to take it.
  const classroomsForRoster = await Classroom.find({
    _id: { $in: classroomIds },
  }).select("students");
  const rosterByClassroom = new Map(
    classroomsForRoster.map((c) => [
      c._id.toString(),
      c.students.map((s) => s.toString()),
    ]),
  );
  const rosterSizeFor = (quiz) =>
    (rosterByClassroom.get(quiz.classroom.toString()) || []).length;

  const completionRates = quizzes.map((q) => {
    const attempted = new Set(
      (responsesByQuiz.get(q._id.toString()) || []).map((r) =>
        r.student.toString(),
      ),
    );
    const rosterSize = rosterSizeFor(q);
    return rosterSize ? (attempted.size / rosterSize) * 100 : 0;
  });
  const avgCompletionRate = completionRates.length
    ? completionRates.reduce((a, b) => a + b, 0) / completionRates.length
    : 0;

  // Quiz comparison: per-quiz avg score / participation / accuracy
  const comparison = quizzes.map((q) => {
    const qResponses = responsesByQuiz.get(q._id.toString()) || [];
    const total = q.questions.length || 0;
    const pcts = total ? qResponses.map((r) => (r.score / total) * 100) : [];
    const attempted = new Set(qResponses.map((r) => r.student.toString()));
    const rosterSize = rosterSizeFor(q);
    return {
      quizId: q._id,
      title: q.title,
      averageScore: pcts.length
        ? round1(pcts.reduce((a, b) => a + b, 0) / pcts.length)
        : 0,
      participation: rosterSize ? round1((attempted.size / rosterSize) * 100) : 0,
      accuracy: pcts.length
        ? round1(pcts.reduce((a, b) => a + b, 0) / pcts.length)
        : 0,
      attempts: qResponses.length,
    };
  });

  const scoreTrend = quizzes
    .map((q) => {
      const qResponses = responsesByQuiz.get(q._id.toString()) || [];
      const total = q.questions.length || 0;
      const pcts = total ? qResponses.map((r) => (r.score / total) * 100) : [];
      return {
        date: dayKey(q.createdAt),
        value: pcts.length
          ? round1(pcts.reduce((a, b) => a + b, 0) / pcts.length)
          : null,
      };
    })
    .filter((p) => p.value !== null)
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  // Question difficulty (optionally scoped to one quiz)
  const scopedQuizzes = quizId ? quizzes.filter((q) => q._id.toString() === quizId) : quizzes;
  const questionDifficultyRows = [];
  scopedQuizzes.forEach((q) => {
    const qResponses = responsesByQuiz.get(q._id.toString()) || [];
    q.questions.forEach((question, index) => {
      let correct = 0;
      let incorrect = 0;
      qResponses.forEach((r) => {
        const given = r.answers ? r.answers[index] : undefined;
        if (given === undefined || given === null) return;
        if (given === question.correctAnswer) correct++;
        else incorrect++;
      });
      const answered = correct + incorrect;
      const correctPct = answered ? (correct / answered) * 100 : 0;
      questionDifficultyRows.push({
        quizId: q._id,
        quizTitle: q.title,
        question: question.question,
        correctPct: round1(correctPct),
        incorrectPct: round1(answered ? (incorrect / answered) * 100 : 0),
        difficulty: answered ? questionDifficulty(correctPct) : "N/A",
      });
    });
  });

  // Student ranking
  const students = enrolledStudentIds.length
    ? await User.find({ _id: { $in: enrolledStudentIds } }).select("name email")
    : [];
  const studentById = new Map(students.map((s) => [s._id.toString(), s]));
  const perStudent = new Map();
  responses.forEach((r) => {
    const key = r.student.toString();
    if (!perStudent.has(key)) {
      perStudent.set(key, {
        studentId: key,
        name: studentById.get(key)?.name || "Unknown",
        email: studentById.get(key)?.email || "",
        attempts: 0,
        scorePcts: [],
      });
    }
    const entry = perStudent.get(key);
    const total = questionCountFor(quizzes, r.quiz.toString());
    entry.attempts++;
    if (total > 0) entry.scorePcts.push((r.score / total) * 100);
  });

  function questionCountFor(list, id) {
    const quiz = list.find((q) => q._id.toString() === id);
    return quiz ? quiz.questions.length : 0;
  }

  let ranking = Array.from(perStudent.values()).map((s) => ({
    studentId: s.studentId,
    name: s.name,
    email: s.email,
    attempts: s.attempts,
    averageScore: s.scorePcts.length
      ? round1(s.scorePcts.reduce((a, b) => a + b, 0) / s.scorePcts.length)
      : 0,
    accuracy: s.scorePcts.length
      ? round1(s.scorePcts.reduce((a, b) => a + b, 0) / s.scorePcts.length)
      : 0,
  }));

  if (search) {
    const q = search.toLowerCase();
    ranking = ranking.filter(
      (r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q),
    );
  }
  ranking.sort((a, b) => {
    const dir = order === "asc" ? 1 : -1;
    if (typeof a[sort] === "string") return a[sort].localeCompare(b[sort]) * dir;
    return (a[sort] - b[sort]) * dir;
  });
  ranking = ranking.map((r, i) => ({ rank: i + 1, ...r }));

  const total = ranking.length;
  const start = (Number(page) - 1) * Number(limit);
  const pagedRanking = ranking.slice(start, start + Number(limit));

  return {
    kpis: {
      totalQuizzes: quizzes.length,
      totalAttempts,
      averageScore: round1(avgScore),
      averageAccuracy: round1(avgAccuracy),
      highestScore: round1(highest),
      lowestScore: round1(lowest),
      averageCompletionRate: round1(avgCompletionRate),
    },
    scoreTrend,
    comparison,
    questionDifficulty: questionDifficultyRows,
    studentRanking: {
      rows: pagedRanking,
      total,
      page: Number(page),
      limit: Number(limit),
    },
  };
}

// ---------------------------------------------------------------------------
// GET /api/analytics/classes
// ---------------------------------------------------------------------------
async function getClassComparison({ teacherId, from, to }) {
  const range = resolveDateRange(from, to);
  const classrooms = await Classroom.find({ teacher: teacherId });

  const rows = await Promise.all(
    classrooms.map(async (classroom) => {
      const metrics = await computeScopeMetrics(
        [classroom._id],
        range.from,
        range.to,
      );
      return {
        classroomId: classroom._id,
        name: classroom.name,
        subject: classroom.subject,
        students: metrics.totalStudents,
        attendance: round1(metrics.avgAttendancePct),
        sessions: metrics.totalSessions,
        avgSessionDurationMinutes: round1(metrics.avgSessionDurationSeconds / 60),
        quizParticipation: round1(metrics.quizParticipationPct),
        avgQuizScore: round1(metrics.avgQuizScorePct),
        engagement: round1(metrics.engagementScore),
      };
    }),
  );

  return { classes: rows };
}

// ---------------------------------------------------------------------------
// GET /api/analytics/students/:studentId  (teacher) and /me (student)
// ---------------------------------------------------------------------------
async function buildStudentDetail({ studentId, classroomIds, from, to }) {
  const range = resolveDateRange(from, to);
  const student = await User.findById(studentId).select("name email");
  if (!student) throw new AnalyticsAccessError("Student not found", 404);

  const classrooms = await Classroom.find({
    _id: { $in: classroomIds },
    students: studentId,
  }).select("name subject");
  if (!classrooms.length) {
    throw new AnalyticsAccessError("Student not found in your classrooms", 404);
  }
  const studentClassroomIds = classrooms.map((c) => c._id);

  const sessions = await getEndedSessions(studentClassroomIds, range.from, range.to);
  const sessionIds = sessions.map((s) => s._id);
  const attendanceDocs = sessionIds.length
    ? await Attendance.find({ session: { $in: sessionIds }, student: studentId })
    : [];

  const sessionsAttended = attendanceDocs.filter((a) => a.isPresent).length;
  const sessionsMissed = attendanceDocs.length - sessionsAttended;
  const attendancePct = attendanceDocs.length
    ? (sessionsAttended / attendanceDocs.length) * 100
    : 0;

  const attendanceBySessionDay = new Map(
    sessions.map((s) => [s._id.toString(), dayKey(s.startTime)]),
  );
  const attendanceTrend = attendanceDocs
    .map((a) => ({
      date: attendanceBySessionDay.get(a.session.toString()),
      present: a.isPresent,
    }))
    .filter((p) => p.date)
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const quizzes = await Quiz.find({
    classroom: { $in: studentClassroomIds },
    session: { $in: sessionIds },
  });
  const quizIds = quizzes.map((q) => q._id);
  const responses = quizIds.length
    ? await QuizResponse.find({ quiz: { $in: quizIds }, student: studentId })
    : [];
  const questionCountByQuiz = new Map(
    quizzes.map((q) => [q._id.toString(), q.questions.length || 0]),
  );
  const scorePcts = responses
    .map((r) => {
      const total = questionCountByQuiz.get(r.quiz.toString()) || 0;
      return total > 0 ? (r.score / total) * 100 : null;
    })
    .filter((v) => v !== null);

  const performanceTimeline = responses
    .map((r) => ({
      date: dayKey(r.createdAt),
      quizScore: questionCountByQuiz.get(r.quiz.toString())
        ? round1((r.score / questionCountByQuiz.get(r.quiz.toString())) * 100)
        : null,
    }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const avgTimeMinutes = attendanceDocs.length
    ? attendanceDocs.reduce((sum, a) => sum + (a.duration || 0), 0) /
      60 /
      attendanceDocs.length
    : 0;

  return {
    profile: {
      studentId: student._id,
      name: student.name,
      email: student.email,
      enrolledClasses: classrooms.map((c) => ({ id: c._id, name: c.name, subject: c.subject })),
    },
    attendance: {
      attendancePercentage: round1(attendancePct),
      sessionsAttended,
      sessionsMissed,
      trend: attendanceTrend,
    },
    quizPerformance: {
      totalAttempted: responses.length,
      averageScore: scorePcts.length
        ? round1(scorePcts.reduce((a, b) => a + b, 0) / scorePcts.length)
        : 0,
      highestScore: scorePcts.length ? round1(Math.max(...scorePcts)) : 0,
      lowestScore: scorePcts.length ? round1(Math.min(...scorePcts)) : 0,
      accuracy: scorePcts.length
        ? round1(scorePcts.reduce((a, b) => a + b, 0) / scorePcts.length)
        : 0,
    },
    engagement: {
      sessionsJoined: attendanceDocs.length,
      avgTimeMinutes: round1(avgTimeMinutes),
    },
    performanceTimeline,
  };
}

async function getStudentDetail({ teacherId, studentId, from, to }) {
  const classroomIds = await resolveClassroomScope(teacherId, "all");
  return buildStudentDetail({ studentId, classroomIds, from, to });
}

async function getMyAnalytics({ studentId, from, to }) {
  const classrooms = await Classroom.find({ students: studentId }).select("_id");
  const classroomIds = classrooms.map((c) => c._id);
  if (!classroomIds.length) {
    return buildStudentDetail({
      studentId,
      classroomIds: [],
      from,
      to,
    }).catch(() => ({
      profile: null,
      attendance: null,
      quizPerformance: null,
      engagement: null,
      performanceTimeline: [],
      empty: true,
    }));
  }
  return buildStudentDetail({ studentId, classroomIds, from, to });
}

module.exports = {
  AnalyticsAccessError,
  resolveDateRange,
  getPreviousPeriod,
  pctChange,
  attendanceStatus,
  questionDifficulty,
  getOverview,
  getAttendanceAnalytics,
  getSessionAnalytics,
  getQuizAnalytics,
  getClassComparison,
  getStudentDetail,
  getMyAnalytics,
};
