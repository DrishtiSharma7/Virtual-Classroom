const announcementController = require("./announcement.controller");
const Announcement = require("./announcement.model");
const Classroom = require("../classroom/classroom.model");

jest.mock("./announcement.model");
jest.mock("../classroom/classroom.model");

describe("Announcement Controller - Edit & Delete", () => {
  const teacherId = "teacher-123";
  const otherUserId = "user-456";
  const classroomId = "classroom-789";
  const announcementId = "announcement-001";

  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("updateAnnouncement", () => {
    test("allows classroom teacher to update announcement", async () => {
      req = {
        params: { id: announcementId },
        user: { id: teacherId },
        body: { title: "Updated Title", description: "Updated Desc" },
      };

      const fakeAnnouncement = {
        _id: announcementId,
        classroom: classroomId,
        postedBy: otherUserId,
        title: "Old Title",
        description: "Old Desc",
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue(true),
      };

      Announcement.findById.mockResolvedValue(fakeAnnouncement);
      Classroom.findById.mockResolvedValue({ _id: classroomId, teacher: teacherId });

      await announcementController.updateAnnouncement(req, res);

      expect(fakeAnnouncement.title).toBe("Updated Title");
      expect(fakeAnnouncement.description).toBe("Updated Desc");
      expect(fakeAnnouncement.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Announcement updated",
        })
      );
    });

    test("rejects unauthorized users from updating announcement", async () => {
      req = {
        params: { id: announcementId },
        user: { id: "random-user" },
        body: { title: "Hacked Title" },
      };

      const fakeAnnouncement = {
        _id: announcementId,
        classroom: classroomId,
        postedBy: otherUserId,
      };

      Announcement.findById.mockResolvedValue(fakeAnnouncement);
      Classroom.findById.mockResolvedValue({ _id: classroomId, teacher: teacherId });

      await announcementController.updateAnnouncement(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Not authorized to edit this announcement",
      });
    });

    test("validates non-empty title on update", async () => {
      req = {
        params: { id: announcementId },
        user: { id: teacherId },
        body: { title: "   " },
      };

      const fakeAnnouncement = {
        _id: announcementId,
        classroom: classroomId,
        postedBy: teacherId,
      };

      Announcement.findById.mockResolvedValue(fakeAnnouncement);
      Classroom.findById.mockResolvedValue({ _id: classroomId, teacher: teacherId });

      await announcementController.updateAnnouncement(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Title is required",
      });
    });
  });

  describe("deleteAnnouncement", () => {
    test("allows classroom teacher to delete announcement", async () => {
      req = {
        params: { id: announcementId },
        user: { id: teacherId },
      };

      const fakeAnnouncement = {
        _id: announcementId,
        classroom: classroomId,
        postedBy: otherUserId,
        deleteOne: jest.fn().mockResolvedValue(true),
      };

      Announcement.findById.mockResolvedValue(fakeAnnouncement);
      Classroom.findById.mockResolvedValue({ _id: classroomId, teacher: teacherId });

      await announcementController.deleteAnnouncement(req, res);

      expect(fakeAnnouncement.deleteOne).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "Announcement deleted",
        announcementId,
      });
    });

    test("rejects unauthorized users from deleting announcement", async () => {
      req = {
        params: { id: announcementId },
        user: { id: "random-user" },
      };

      const fakeAnnouncement = {
        _id: announcementId,
        classroom: classroomId,
        postedBy: otherUserId,
      };

      Announcement.findById.mockResolvedValue(fakeAnnouncement);
      Classroom.findById.mockResolvedValue({ _id: classroomId, teacher: teacherId });

      await announcementController.deleteAnnouncement(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Not authorized to delete this announcement",
      });
    });
  });
});
