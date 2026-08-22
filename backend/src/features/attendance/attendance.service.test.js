const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const Classroom = require("../classroom/classroom.model");
const Session = require("../session/session.model");
const User = require("../auth/auth.model");
const Attendance = require("./attendance.model");
const attendanceService = require("./attendance.service");
const attendanceController = require("./attendance.controller");
const attendanceRoutes = require("./attendance.routes");

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
  jest.useRealTimers();
  await Promise.all([
    Classroom.deleteMany({}),
    Session.deleteMany({}),
    User.deleteMany({}),
    Attendance.deleteMany({}),
  ]);
});

function minutes(n) {
  return n * 60 * 1000;
}

async function makeFixture() {
  fixtureCounter += 1;
  const n = fixtureCounter;

  const teacher = await User.create({
    name: "Teacher",
    email: `teacher${n}@example.com`,
    password: "hashed",
    role: "teacher",
  });
  const student = await User.create({
    name: "Student",
    email: `student${n}@example.com`,
    password: "hashed",
    role: "student",
  });
  const classroom = await Classroom.create({
    name: "Classroom",
    subject: "Subject",
    code: `CODE${n}`,
    teacher: teacher._id,
    students: [student._id],
  });

  const startTime = new Date("2024-01-01T10:00:00Z");
  const session = await Session.create({
    classroom: classroom._id,
    title: "Session",
    startTime,
    status: "live",
    createdBy: teacher._id,
  });

  return { teacher, student, classroom, session, startTime };
}

async function endSessionAfter(session, startTime, minutesElapsed) {
  const endTime = new Date(startTime.getTime() + minutes(minutesElapsed));
  session.status = "ended";
  session.endTime = endTime;
  await session.save();
  return endTime;
}

describe("attendance.service", () => {
  test("1. full session attendance -> 100%", async () => {
    const { student, classroom, session, startTime } = await makeFixture();
    jest.useFakeTimers({ doNotFake: ["nextTick"] });
    jest.setSystemTime(startTime);

    await attendanceService.recordConnect({
      session,
      classroomId: classroom._id,
      studentId: student._id.toString(),
    });

    jest.setSystemTime(new Date(startTime.getTime() + minutes(60)));
    await endSessionAfter(session, startTime, 60);
    await attendanceService.completeSessionAttendance(session._id);

    const record = await Attendance.findOne({
      session: session._id,
      student: student._id,
    });

    expect(record.duration).toBe(60 * 60);
    expect(record.attendancePercentage).toBeCloseTo(100, 0);
    expect(record.isPresent).toBe(true);
    expect(record.status).toBe("COMPLETED");
  });

  test("2. joins halfway -> ~50%", async () => {
    const { student, classroom, session, startTime } = await makeFixture();
    jest.useFakeTimers({ doNotFake: ["nextTick"] });
    jest.setSystemTime(new Date(startTime.getTime() + minutes(30)));

    await attendanceService.recordConnect({
      session,
      classroomId: classroom._id,
      studentId: student._id.toString(),
    });

    jest.setSystemTime(new Date(startTime.getTime() + minutes(60)));
    await endSessionAfter(session, startTime, 60);
    await attendanceService.completeSessionAttendance(session._id);

    const record = await Attendance.findOne({
      session: session._id,
      student: student._id,
    });

    expect(record.attendancePercentage).toBeCloseTo(50, 0);
  });

  test("3. leaves early -> correct %", async () => {
    const { student, classroom, session, startTime } = await makeFixture();
    jest.useFakeTimers({ doNotFake: ["nextTick"] });
    jest.setSystemTime(startTime);

    await attendanceService.recordConnect({
      session,
      classroomId: classroom._id,
      studentId: student._id.toString(),
    });

    jest.setSystemTime(new Date(startTime.getTime() + minutes(40)));
    await attendanceService.recordDisconnect({
      sessionId: session._id,
      studentId: student._id.toString(),
    });

    jest.setSystemTime(new Date(startTime.getTime() + minutes(60)));
    await endSessionAfter(session, startTime, 60);
    await attendanceService.completeSessionAttendance(session._id);

    const record = await Attendance.findOne({
      session: session._id,
      student: student._id,
    });

    expect(record.duration).toBe(40 * 60);
    expect(record.attendancePercentage).toBeCloseTo((40 / 60) * 100, 0);
  });

  test("4. late join + early leave -> correct %", async () => {
    const { student, classroom, session, startTime } = await makeFixture();
    jest.useFakeTimers({ doNotFake: ["nextTick"] });
    jest.setSystemTime(new Date(startTime.getTime() + minutes(10)));

    await attendanceService.recordConnect({
      session,
      classroomId: classroom._id,
      studentId: student._id.toString(),
    });

    jest.setSystemTime(new Date(startTime.getTime() + minutes(40)));
    await attendanceService.recordDisconnect({
      sessionId: session._id,
      studentId: student._id.toString(),
    });

    jest.setSystemTime(new Date(startTime.getTime() + minutes(60)));
    await endSessionAfter(session, startTime, 60);
    await attendanceService.completeSessionAttendance(session._id);

    const record = await Attendance.findOne({
      session: session._id,
      student: student._id,
    });

    expect(record.duration).toBe(30 * 60);
    expect(record.attendancePercentage).toBeCloseTo(50, 0);
  });

  test("5. 1-minute disconnect and reconnect -> gap excluded", async () => {
    const { student, classroom, session, startTime } = await makeFixture();
    jest.useFakeTimers({ doNotFake: ["nextTick"] });
    jest.setSystemTime(startTime);

    await attendanceService.recordConnect({
      session,
      classroomId: classroom._id,
      studentId: student._id.toString(),
    });

    jest.setSystemTime(new Date(startTime.getTime() + minutes(10)));
    await attendanceService.recordDisconnect({
      sessionId: session._id,
      studentId: student._id.toString(),
    });

    jest.setSystemTime(new Date(startTime.getTime() + minutes(11)));
    await attendanceService.recordConnect({
      session,
      classroomId: classroom._id,
      studentId: student._id.toString(),
    });

    jest.setSystemTime(new Date(startTime.getTime() + minutes(20)));
    await endSessionAfter(session, startTime, 20);
    await attendanceService.completeSessionAttendance(session._id);

    const record = await Attendance.findOne({
      session: session._id,
      student: student._id,
    });

    expect(record.duration).toBe(19 * 60);
  });

  test("6. disconnect longer than the reconnect grace window -> still finalized correctly", async () => {
    const { student, classroom, session, startTime } = await makeFixture();
    jest.useFakeTimers({ doNotFake: ["nextTick"] });
    jest.setSystemTime(startTime);

    await attendanceService.recordConnect({
      session,
      classroomId: classroom._id,
      studentId: student._id.toString(),
    });

    jest.setSystemTime(new Date(startTime.getTime() + minutes(5)));
    await attendanceService.recordDisconnect({
      sessionId: session._id,
      studentId: student._id.toString(),
    });

    jest.setSystemTime(new Date(startTime.getTime() + minutes(10)));
    await attendanceService.recordConnect({
      session,
      classroomId: classroom._id,
      studentId: student._id.toString(),
    });

    jest.setSystemTime(new Date(startTime.getTime() + minutes(20)));
    await endSessionAfter(session, startTime, 20);
    await attendanceService.completeSessionAttendance(session._id);

    const record = await Attendance.findOne({
      session: session._id,
      student: student._id,
    });

    expect(record.duration).toBe(15 * 60);
    expect(record.attendancePercentage).toBeCloseTo(75, 0);
    expect(record.status).toBe("COMPLETED");
  });

  test("7. reconnects multiple times -> time accumulates correctly", async () => {
    const { student, classroom, session, startTime } = await makeFixture();
    jest.useFakeTimers({ doNotFake: ["nextTick"] });

    jest.setSystemTime(startTime);
    await attendanceService.recordConnect({
      session,
      classroomId: classroom._id,
      studentId: student._id.toString(),
    });

    jest.setSystemTime(new Date(startTime.getTime() + minutes(10)));
    await attendanceService.recordDisconnect({
      sessionId: session._id,
      studentId: student._id.toString(),
    });

    jest.setSystemTime(new Date(startTime.getTime() + minutes(11)));
    await attendanceService.recordConnect({
      session,
      classroomId: classroom._id,
      studentId: student._id.toString(),
    });

    jest.setSystemTime(new Date(startTime.getTime() + minutes(31)));
    await attendanceService.recordDisconnect({
      sessionId: session._id,
      studentId: student._id.toString(),
    });

    jest.setSystemTime(new Date(startTime.getTime() + minutes(34)));
    await attendanceService.recordConnect({
      session,
      classroomId: classroom._id,
      studentId: student._id.toString(),
    });

    jest.setSystemTime(new Date(startTime.getTime() + minutes(49)));
    await endSessionAfter(session, startTime, 49);
    await attendanceService.completeSessionAttendance(session._id);

    const record = await Attendance.findOne({
      session: session._id,
      student: student._id,
    });

    expect(record.connectedIntervals).toHaveLength(3);
    expect(record.duration).toBe((10 + 20 + 15) * 60);
  });

  test("8. duplicate connect while already connected -> no duplicate record, no double interval", async () => {
    const { student, classroom, session, startTime } = await makeFixture();
    jest.useFakeTimers({ doNotFake: ["nextTick"] });
    jest.setSystemTime(startTime);

    await attendanceService.recordConnect({
      session,
      classroomId: classroom._id,
      studentId: student._id.toString(),
    });
    await attendanceService.recordConnect({
      session,
      classroomId: classroom._id,
      studentId: student._id.toString(),
    });

    const count = await Attendance.countDocuments({
      session: session._id,
      student: student._id,
    });
    const record = await Attendance.findOne({
      session: session._id,
      student: student._id,
    });

    expect(count).toBe(1);
    expect(record.connectedIntervals).toHaveLength(1);
  });

  test("9. two concurrent connects (simulated tabs) -> single record, single open interval", async () => {
    const { student, classroom, session } = await makeFixture();

    await Promise.all([
      attendanceService.recordConnect({
        session,
        classroomId: classroom._id,
        studentId: student._id.toString(),
      }),
      attendanceService.recordConnect({
        session,
        classroomId: classroom._id,
        studentId: student._id.toString(),
      }),
    ]);

    const count = await Attendance.countDocuments({
      session: session._id,
      student: student._id,
    });
    const record = await Attendance.findOne({
      session: session._id,
      student: student._id,
    });

    expect(count).toBe(1);
    expect(record.connectedIntervals).toHaveLength(1);
  });

  test("10. completeSessionAttendance finalizes every IN_SESSION record", async () => {
    const { classroom, session, startTime } = await makeFixture();
    const studentB = await User.create({
      name: "Student B",
      email: `studentB-${Date.now()}@example.com`,
      password: "hashed",
      role: "student",
    });
    await Classroom.findByIdAndUpdate(classroom._id, {
      $push: { students: studentB._id },
    });

    jest.useFakeTimers({ doNotFake: ["nextTick"] });
    jest.setSystemTime(startTime);

    const studentA = classroom.students[0];

    await attendanceService.recordConnect({
      session,
      classroomId: classroom._id,
      studentId: studentA.toString(),
    });
    await attendanceService.recordConnect({
      session,
      classroomId: classroom._id,
      studentId: studentB._id.toString(),
    });

    jest.setSystemTime(new Date(startTime.getTime() + minutes(60)));
    await endSessionAfter(session, startTime, 60);
    await attendanceService.completeSessionAttendance(session._id);

    const records = await Attendance.find({ session: session._id });
    expect(records).toHaveLength(2);
    records.forEach((r) => {
      expect(r.status).toBe("COMPLETED");
      expect(r.attendancePercentage).toBeCloseTo(100, 0);
    });
  });

  test("13. session runs longer than a typical duration -> uses actual endTime - startTime", async () => {
    const { student, classroom, session, startTime } = await makeFixture();
    jest.useFakeTimers({ doNotFake: ["nextTick"] });
    jest.setSystemTime(startTime);

    await attendanceService.recordConnect({
      session,
      classroomId: classroom._id,
      studentId: student._id.toString(),
    });

    jest.setSystemTime(new Date(startTime.getTime() + minutes(90)));
    await attendanceService.recordDisconnect({
      sessionId: session._id,
      studentId: student._id.toString(),
    });

    jest.setSystemTime(new Date(startTime.getTime() + minutes(180)));
    await endSessionAfter(session, startTime, 180);
    await attendanceService.completeSessionAttendance(session._id);

    const record = await Attendance.findOne({
      session: session._id,
      student: student._id,
    });

    expect(record.duration).toBe(90 * 60);
    expect(record.attendancePercentage).toBeCloseTo(50, 0);
  });

  test("14. duplicate disconnect calls -> idempotent, no negative/duplicate duration", async () => {
    const { student, classroom, session, startTime } = await makeFixture();
    jest.useFakeTimers({ doNotFake: ["nextTick"] });
    jest.setSystemTime(startTime);

    await attendanceService.recordConnect({
      session,
      classroomId: classroom._id,
      studentId: student._id.toString(),
    });

    jest.setSystemTime(new Date(startTime.getTime() + minutes(10)));
    await attendanceService.recordDisconnect({
      sessionId: session._id,
      studentId: student._id.toString(),
    });
    const first = await Attendance.findOne({
      session: session._id,
      student: student._id,
    });

    jest.setSystemTime(new Date(startTime.getTime() + minutes(15)));
    await attendanceService.recordDisconnect({
      sessionId: session._id,
      studentId: student._id.toString(),
    });
    const second = await Attendance.findOne({
      session: session._id,
      student: student._id,
    });

    expect(second.connectedIntervals).toHaveLength(1);
    expect(second.duration).toBe(first.duration);
    expect(second.duration).toBe(10 * 60);
  });

  test("15. no client-writable attendance path exists", async () => {
    expect(attendanceController.joinSession).toBeUndefined();
    expect(attendanceController.leaveSession).toBeUndefined();

    const registeredPaths = attendanceRoutes.stack
      .filter((layer) => layer.route)
      .map((layer) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));

    const hasJoinOrLeave = registeredPaths.some(
      (r) =>
        (r.path === "/join" || r.path === "/leave") &&
        r.methods.includes("post"),
    );

    expect(hasJoinOrLeave).toBe(false);

    expect(attendanceService.recordConnect.length).toBeLessThanOrEqual(1);
    expect(attendanceService.recordDisconnect.length).toBeLessThanOrEqual(1);
  });
});
