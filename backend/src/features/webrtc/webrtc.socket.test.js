jest.mock("../session/session.model", () => ({
  findByIdAndUpdate: jest.fn().mockResolvedValue({}),
}));

const registerWebRTCEvents = require("./webrtc.socket");
const registry = require("../../sockets/roomRegistry");

describe("WebRTC Socket - Mute/Unmute & Mic Status Controls", () => {
  const roomId = "test-room-1";
  const teacherSocketId = "teacher-sock";
  const studentSocketId = "student-sock";

  let io;
  let teacherSocket;
  let studentSocket;
  let teacherHandlers = {};
  let studentHandlers = {};

  beforeEach(() => {
    // Clear room registry
    registry.removeParticipant(roomId, teacherSocketId);
    registry.removeParticipant(roomId, studentSocketId);

    // Setup room
    registry.addParticipant(
      roomId,
      teacherSocketId,
      { id: "teacher-1", name: "Teacher", role: "teacher" },
      true
    );
    registry.addParticipant(
      roomId,
      studentSocketId,
      { id: "student-1", name: "Student", role: "student" },
      false
    );

    // Mock IO and Sockets
    teacherHandlers = {};
    studentHandlers = {};

    const emittedTo = {};
    io = {
      to: jest.fn((target) => {
        if (!emittedTo[target]) {
          emittedTo[target] = { emit: jest.fn() };
        }
        return emittedTo[target];
      }),
    };

    teacherSocket = {
      id: teacherSocketId,
      on: jest.fn((event, handler) => {
        teacherHandlers[event] = handler;
      }),
      emit: jest.fn(),
      to: jest.fn(() => ({
        emit: jest.fn(),
      })),
    };

    studentSocket = {
      id: studentSocketId,
      on: jest.fn((event, handler) => {
        studentHandlers[event] = handler;
      }),
      emit: jest.fn(),
      to: jest.fn(() => ({
        emit: jest.fn(),
      })),
    };

    registerWebRTCEvents(io, teacherSocket);
    registerWebRTCEvents(io, studentSocket);
  });

  afterEach(() => {
    registry.removeParticipant(roomId, teacherSocketId);
    registry.removeParticipant(roomId, studentSocketId);
  });

  test("Teacher can mute student -> forceMuted=true, micEnabled=false, emits force-mute and mic-status", () => {
    registry.setParticipantMicEnabled(roomId, studentSocketId, true);
    expect(registry.findParticipant(roomId, studentSocketId).micEnabled).toBe(true);

    teacherHandlers["mute-student"]({
      roomId,
      targetSocketId: studentSocketId,
    });

    const student = registry.findParticipant(roomId, studentSocketId);
    expect(student.micEnabled).toBe(false);
    expect(student.forceMuted).toBe(true);
    expect(registry.isForceMuted(roomId, studentSocketId)).toBe(true);

    expect(io.to).toHaveBeenCalledWith(studentSocketId);
    expect(io.to(studentSocketId).emit).toHaveBeenCalledWith("force-mute", {
      by: teacherSocketId,
    });
    expect(io.to).toHaveBeenCalledWith(roomId);
    expect(io.to(roomId).emit).toHaveBeenCalledWith("student-muted", {
      socketId: studentSocketId,
    });
    expect(io.to(roomId).emit).toHaveBeenCalledWith("mic-status", {
      sender: studentSocketId,
      enabled: false,
    });
  });

  test("Teacher can unmute student -> forceMuted=false, micEnabled=true, emits force-unmute and mic-status", () => {
    registry.setParticipantForceMuted(roomId, studentSocketId, true);
    registry.setParticipantMicEnabled(roomId, studentSocketId, false);

    teacherHandlers["unmute-student"]({
      roomId,
      targetSocketId: studentSocketId,
    });

    const student = registry.findParticipant(roomId, studentSocketId);
    expect(student.micEnabled).toBe(true);
    expect(student.forceMuted).toBe(false);
    expect(registry.isForceMuted(roomId, studentSocketId)).toBe(false);

    expect(io.to).toHaveBeenCalledWith(studentSocketId);
    expect(io.to(studentSocketId).emit).toHaveBeenCalledWith("force-unmute", {
      by: teacherSocketId,
    });
    expect(io.to).toHaveBeenCalledWith(roomId);
    expect(io.to(roomId).emit).toHaveBeenCalledWith("student-unmuted", {
      socketId: studentSocketId,
    });
    expect(io.to(roomId).emit).toHaveBeenCalledWith("mic-status", {
      sender: studentSocketId,
      enabled: true,
    });
  });

  test("Non-host cannot mute or unmute students", () => {
    studentHandlers["mute-student"]({
      roomId,
      targetSocketId: teacherSocketId,
    });

    expect(studentSocket.emit).toHaveBeenCalledWith("action-denied", {
      action: "mute-student",
      message: "Only the host can mute participants.",
    });

    studentHandlers["unmute-student"]({
      roomId,
      targetSocketId: teacherSocketId,
    });

    expect(studentSocket.emit).toHaveBeenCalledWith("action-denied", {
      action: "unmute-student",
      message: "Only the host can unmute participants.",
    });
  });

  test("Force-muted student cannot unmute via mic-status", () => {
    registry.setParticipantForceMuted(roomId, studentSocketId, true);

    studentHandlers["mic-status"]({
      roomId,
      enabled: true,
    });

    expect(studentSocket.emit).toHaveBeenCalledWith("action-denied", {
      action: "mic-status",
      message: "You were muted by the host and cannot unmute yourself.",
    });
    expect(registry.findParticipant(roomId, studentSocketId).micEnabled).toBe(false);
  });

  test("Unmuted student can toggle mic-status freely", () => {
    registry.setParticipantForceMuted(roomId, studentSocketId, false);

    const roomBroadcast = { emit: jest.fn() };
    studentSocket.to.mockReturnValue(roomBroadcast);

    studentHandlers["mic-status"]({
      roomId,
      enabled: true,
    });

    expect(registry.findParticipant(roomId, studentSocketId).micEnabled).toBe(true);
    expect(studentSocket.to).toHaveBeenCalledWith(roomId);
    expect(roomBroadcast.emit).toHaveBeenCalledWith("mic-status", {
      sender: studentSocketId,
      enabled: true,
    });
  });

  test("Teacher can kick student -> student marked kicked, removed from session, cannot rejoin", async () => {
    await teacherHandlers["kick-student"]({
      roomId,
      targetSocketId: studentSocketId,
    });

    expect(registry.isKicked(roomId, "student-1")).toBe(true);
    expect(registry.findParticipant(roomId, studentSocketId)).toBeNull();

    expect(io.to).toHaveBeenCalledWith(studentSocketId);
    expect(io.to(studentSocketId).emit).toHaveBeenCalledWith(
      "removed-from-session",
      {
        message:
          "You have been removed from this session by the host and cannot rejoin.",
      }
    );
    expect(io.to(roomId).emit).toHaveBeenCalledWith("user-left", {
      socketId: studentSocketId,
      user: { id: "student-1", name: "Student", role: "student" },
      kicked: true,
    });
  });

  test("Non-host cannot kick students", async () => {
    await studentHandlers["kick-student"]({
      roomId,
      targetSocketId: teacherSocketId,
    });

    expect(studentSocket.emit).toHaveBeenCalledWith("action-denied", {
      action: "kick-student",
      message: "Only the host can remove participants.",
    });
    expect(registry.isKicked(roomId, "teacher-1")).toBe(false);
  });
});
