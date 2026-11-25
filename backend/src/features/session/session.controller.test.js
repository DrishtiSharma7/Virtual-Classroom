jest.mock("./session.model");
jest.mock("../classroom/classroom.model");
jest.mock("../chat/chat.model");
jest.mock("../attendance/attendance.service");
jest.mock("../../sockets/sessionLifecycle");

const Session = require("./session.model");
const Classroom = require("../classroom/classroom.model");
const { createSession } = require("./session.controller");

function makeResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("session.controller - createSession with rejoin support", () => {
  test("returns existing active live session if one is already running for the classroom", async () => {
    const req = {
      user: { id: "teacher-1" },
      body: { classroom: "class-123", title: "Math Class" },
    };
    const res = makeResponse();

    Classroom.findById.mockResolvedValue({
      _id: "class-123",
      teacher: { toString: () => "teacher-1" },
    });

    const activeLiveSession = {
      _id: "session-live-1",
      classroom: "class-123",
      status: "live",
      title: "Active Math Class",
    };
    Session.findOne.mockResolvedValue(activeLiveSession);

    await createSession(req, res);

    expect(Session.findOne).toHaveBeenCalledWith({
      classroom: "class-123",
      status: "live",
    });
    expect(Session.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Active live session already in progress",
        session: activeLiveSession,
        alreadyLive: true,
      })
    );
  });

  test("creates a new session if no live session exists", async () => {
    const req = {
      user: { id: "teacher-1" },
      body: { classroom: "class-123", title: "Math Class", startTime: new Date() },
    };
    const res = makeResponse();

    Classroom.findById.mockResolvedValue({
      _id: "class-123",
      teacher: { toString: () => "teacher-1" },
    });

    Session.findOne.mockResolvedValue(null);
    const newSession = {
      _id: "session-new-1",
      classroom: "class-123",
      title: "Math Class",
      status: "scheduled",
    };
    Session.create.mockResolvedValue(newSession);

    await createSession(req, res);

    expect(Session.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Session created",
        session: newSession,
      })
    );
  });

  test("rejects if non-teacher tries to create session", async () => {
    const req = {
      user: { id: "student-1" },
      body: { classroom: "class-123" },
    };
    const res = makeResponse();

    Classroom.findById.mockResolvedValue({
      _id: "class-123",
      teacher: { toString: () => "teacher-1" },
    });

    await createSession(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Not authorized",
      })
    );
  });
});
