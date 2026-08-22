const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const Classroom = require("../classroom/classroom.model");
const Session = require("../session/session.model");
const User = require("../auth/auth.model");
const Attendance = require("../attendance/attendance.model");
const Quiz = require("../Quiz/quiz.model");
const QuizResponse = require("../Quiz/quizResponse.model");
const analyticsService = require("./analytics.service");

let mongod;
let fixtureCounter = 0;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await Promise.all([
    Classroom.deleteMany({}),
    Session.deleteMany({}),
    User.deleteMany({}),
    Attendance.deleteMany({}),
    Quiz.deleteMany({}),
    QuizResponse.deleteMany({}),
  ]);
});

async function makeFixture() {
  fixtureCounter += 1;
  const n = fixtureCounter;

  const teacher = await User.create({
    name: "Teacher",
    email: `teacher${n}@example.com`,
    password: "hashed",
    role: "teacher",
  });
  const studentA = await User.create({
    name: "Student A",
    email: `studentA${n}@example.com`,
    password: "hashed",
    role: "student",
  });
  const studentB = await User.create({
    name: "Student B",
    email: `studentB${n}@example.com`,
    password: "hashed",
    role: "student",
  });
  const classroom = await Classroom.create({
    name: "Classroom",
    subject: "Subject",
    code: `CODE${n}`,
    teacher: teacher._id,
    students: [studentA._id, studentB._id],
  });

  return { teacher, studentA, studentB, classroom };
}

async function makeEndedSession(classroom, teacher, startTime, durationMinutes) {
  return Session.create({
    classroom: classroom._id,
    title: "Session",
    startTime,
    endTime: new Date(startTime.getTime() + durationMinutes * 60 * 1000),
    status: "ended",
    createdBy: teacher._id,
  });
}

describe("analytics.service", () => {
  test("getOverview: average attendance % = present / total attendance docs", async () => {
    const { teacher, studentA, studentB, classroom } = await makeFixture();
    const session = await makeEndedSession(
      classroom,
      teacher,
      new Date("2024-01-05T10:00:00Z"),
      60,
    );

    await Attendance.create({
      classroom: classroom._id,
      session: session._id,
      student: studentA._id,
      duration: 3600,
      attendancePercentage: 100,
      isPresent: true,
      status: "COMPLETED",
    });
    await Attendance.create({
      classroom: classroom._id,
      session: session._id,
      student: studentB._id,
      duration: 0,
      attendancePercentage: 0,
      isPresent: false,
      status: "COMPLETED",
    });

    const result = await analyticsService.getOverview({
      teacherId: teacher._id.toString(),
      classroomId: "all",
      from: "2024-01-01T00:00:00Z",
      to: "2024-01-10T00:00:00Z",
    });

    const avgAttendance = result.kpis.find((k) => k.key === "avgAttendance");
    expect(avgAttendance.value).toBe(50);
    expect(avgAttendance.trend).toBeNull(); // no attendance data in the previous period
  });

  test("getOverview: quiz participation % = distinct respondents / enrolled students", async () => {
    const { teacher, studentA, studentB, classroom } = await makeFixture();
    const session = await makeEndedSession(
      classroom,
      teacher,
      new Date("2024-01-05T10:00:00Z"),
      60,
    );
    const quiz = await Quiz.create({
      title: "Quiz 1",
      session: session._id,
      classroom: classroom._id,
      createdBy: teacher._id,
      questions: [
        { question: "Q1", options: ["a", "b"], correctAnswer: 0 },
        { question: "Q2", options: ["a", "b"], correctAnswer: 1 },
      ],
    });
    await QuizResponse.create({
      quiz: quiz._id,
      student: studentA._id,
      answers: [0, 1],
      score: 2,
      source: "live",
    });

    const result = await analyticsService.getOverview({
      teacherId: teacher._id.toString(),
      classroomId: "all",
      from: "2024-01-01T00:00:00Z",
      to: "2024-01-10T00:00:00Z",
    });

    const participation = result.kpis.find((k) => k.key === "quizParticipation");
    const avgScore = result.kpis.find((k) => k.key === "avgQuizScore");
    expect(participation.value).toBe(50); // 1 of 2 enrolled students
    expect(avgScore.value).toBe(100); // 2/2 correct
  });

  test("pctChange returns null instead of a fake number when previous period has no data", () => {
    expect(analyticsService.pctChange(10, 0)).toBeNull();
    expect(analyticsService.pctChange(0, 0)).toBe(0);
    expect(analyticsService.pctChange(20, 10)).toBe(100);
  });

  test("attendanceStatus bands map correctly", () => {
    expect(analyticsService.attendanceStatus(95)).toBe("Excellent");
    expect(analyticsService.attendanceStatus(80)).toBe("Good");
    expect(analyticsService.attendanceStatus(60)).toBe("Needs Attention");
    expect(analyticsService.attendanceStatus(20)).toBe("Critical");
  });

  test("getStudentDetail: throws when the student is not in any of the teacher's classrooms", async () => {
    const { teacher } = await makeFixture();
    const outsideStudent = await User.create({
      name: "Outsider",
      email: "outsider@example.com",
      password: "hashed",
      role: "student",
    });

    await expect(
      analyticsService.getStudentDetail({
        teacherId: teacher._id.toString(),
        studentId: outsideStudent._id.toString(),
      }),
    ).rejects.toMatchObject({ status: 404 });
  });

  test("getStudentDetail: succeeds for a student enrolled in the teacher's classroom", async () => {
    const { teacher, studentA, classroom } = await makeFixture();
    const session = await makeEndedSession(
      classroom,
      teacher,
      new Date("2024-01-05T10:00:00Z"),
      60,
    );
    await Attendance.create({
      classroom: classroom._id,
      session: session._id,
      student: studentA._id,
      duration: 3600,
      attendancePercentage: 100,
      isPresent: true,
      status: "COMPLETED",
    });

    const detail = await analyticsService.getStudentDetail({
      teacherId: teacher._id.toString(),
      studentId: studentA._id.toString(),
      from: "2024-01-01T00:00:00Z",
      to: "2024-01-10T00:00:00Z",
    });

    expect(detail.profile.name).toBe("Student A");
    expect(detail.attendance.attendancePercentage).toBe(100);
    expect(detail.attendance.sessionsAttended).toBe(1);
  });
});
