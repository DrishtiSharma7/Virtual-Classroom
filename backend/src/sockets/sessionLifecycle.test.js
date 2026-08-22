jest.mock("../features/session/session.model");
jest.mock("../features/chat/chat.model");
jest.mock("../features/attendance/attendance.service");

const Session = require("../features/session/session.model");
const Chat = require("../features/chat/chat.model");
const attendanceService = require("../features/attendance/attendance.service");
const { scheduleAutoEnd, cancelAutoEnd } = require("./sessionLifecycle");

function makeIo() {
  return { to: jest.fn().mockReturnThis(), emit: jest.fn() };
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  Chat.deleteMany.mockResolvedValue();
  attendanceService.completeSessionAttendance.mockResolvedValue(true);
});

afterEach(() => {
  jest.useRealTimers();
});

describe("sessionLifecycle (teacher inactivity auto-end)", () => {
  test("11. host reconnects within the timeout -> session stays live, attendance untouched", async () => {
    const fakeSession = {
      _id: "session-11",
      status: "live",
      startTime: new Date(),
      save: jest.fn().mockResolvedValue(),
    };
    Session.findById.mockResolvedValue(fakeSession);
    const io = makeIo();

    scheduleAutoEnd("session-11", io);

    // Host rejoins well before the 20-minute default grace period elapses.
    await jest.advanceTimersByTimeAsync(19 * 60 * 1000);
    cancelAutoEnd("session-11");

    // Advance well past the original timeout to be sure nothing fires late.
    await jest.advanceTimersByTimeAsync(5 * 60 * 1000);

    expect(fakeSession.save).not.toHaveBeenCalled();
    expect(attendanceService.completeSessionAttendance).not.toHaveBeenCalled();
    expect(io.emit).not.toHaveBeenCalled();
  });

  test("12. host never reconnects -> session auto-ends and attendance is finalized", async () => {
    const fakeSession = {
      _id: "session-12",
      status: "live",
      startTime: new Date(),
      save: jest.fn().mockResolvedValue(),
    };
    Session.findById.mockResolvedValue(fakeSession);
    const io = makeIo();

    scheduleAutoEnd("session-12", io);

    await jest.advanceTimersByTimeAsync(20 * 60 * 1000 + 1000);

    expect(fakeSession.status).toBe("ended");
    expect(fakeSession.endTime).toBeInstanceOf(Date);
    expect(fakeSession.save).toHaveBeenCalledTimes(1);
    expect(attendanceService.completeSessionAttendance).toHaveBeenCalledWith(
      fakeSession._id,
    );
    expect(Chat.deleteMany).toHaveBeenCalledWith({ session: fakeSession._id });
    expect(io.to).toHaveBeenCalledWith("session-12");
    expect(io.emit).toHaveBeenCalledWith(
      "session-ended",
      expect.objectContaining({ message: expect.any(String) }),
    );
  });
});
