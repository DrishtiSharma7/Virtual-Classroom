const recordingController = require("./recording.controller");
const Recording = require("./recording.model");
const Classroom = require("../classroom/classroom.model");

jest.mock("./recording.model");
jest.mock("../classroom/classroom.model");

describe("Recording Controller - Upload, Get, and Delete", () => {
  const teacherId = "teacher-123";
  const otherUserId = "other-456";
  const classroomId = "classroom-789";
  const recordingId = "recording-001";

  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("uploadRecording", () => {
    test("returns 400 if no file is provided", async () => {
      req = {
        user: { id: teacherId },
        body: { classroom: classroomId, title: "Lecture 1" },
      };

      await recordingController.uploadRecording(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "A video file is required.",
      });
    });

    test("returns 400 if title is missing", async () => {
      req = {
        user: { id: teacherId },
        file: { filename: "sample.mp4" },
        body: { classroom: classroomId, title: "   " },
      };

      await recordingController.uploadRecording(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Recording title is required.",
      });
    });

    test("returns 403 if user is not the classroom teacher", async () => {
      req = {
        user: { id: otherUserId },
        file: { filename: "sample.mp4" },
        body: { classroom: classroomId, title: "Lecture 1" },
      };

      Classroom.findById.mockResolvedValue({
        _id: classroomId,
        teacher: teacherId,
      });

      await recordingController.uploadRecording(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Only the classroom teacher can upload recordings.",
      });
    });

    test("successfully uploads recording when caller is the teacher", async () => {
      req = {
        user: { id: teacherId },
        file: { filename: "lecture.mp4" },
        body: {
          classroom: classroomId,
          title: "Lecture 1: Intro",
          description: "Overview of course",
        },
      };

      Classroom.findById.mockResolvedValue({
        _id: classroomId,
        teacher: teacherId,
      });

      const fakeRecording = {
        _id: recordingId,
        classroom: classroomId,
        title: "Lecture 1: Intro",
        description: "Overview of course",
        fileUrl: "uploads/lecture.mp4",
        uploadedBy: teacherId,
        populate: jest.fn().mockResolvedValue(true),
      };

      Recording.create.mockResolvedValue(fakeRecording);

      await recordingController.uploadRecording(req, res);

      expect(Recording.create).toHaveBeenCalledWith({
        classroom: classroomId,
        session: undefined,
        title: "Lecture 1: Intro",
        description: "Overview of course",
        fileUrl: "uploads/lecture.mp4",
        uploadedBy: teacherId,
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Recording uploaded successfully",
        recording: fakeRecording,
      });
    });
  });

  describe("deleteRecording", () => {
    test("allows teacher to delete recording", async () => {
      req = {
        params: { id: recordingId },
        user: { id: teacherId },
      };

      const fakeRecording = {
        _id: recordingId,
        classroom: classroomId,
        uploadedBy: otherUserId,
        fileUrl: "uploads/nonexistent.mp4",
        deleteOne: jest.fn().mockResolvedValue(true),
      };

      Recording.findById.mockResolvedValue(fakeRecording);
      Classroom.findById.mockResolvedValue({
        _id: classroomId,
        teacher: teacherId,
      });

      await recordingController.deleteRecording(req, res);

      expect(fakeRecording.deleteOne).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "Recording deleted successfully",
        recordingId,
      });
    });

    test("rejects unauthorized non-teacher from deleting recording", async () => {
      req = {
        params: { id: recordingId },
        user: { id: "stranger-999" },
      };

      const fakeRecording = {
        _id: recordingId,
        classroom: classroomId,
        uploadedBy: teacherId,
      };

      Recording.findById.mockResolvedValue(fakeRecording);
      Classroom.findById.mockResolvedValue({
        _id: classroomId,
        teacher: teacherId,
      });

      await recordingController.deleteRecording(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Not authorized to delete this recording",
      });
    });
  });
});
