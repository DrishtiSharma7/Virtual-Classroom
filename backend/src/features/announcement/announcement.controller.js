const Announcement = require("./announcement.model");
const Classroom = require("../classroom/classroom.model");

exports.createAnnouncement = async (req, res) => {
  try {
    const { classroom, title, description } = req.body;
    if (!classroom || !title) {
      return res.status(400).json({
        message: "Classroom and title are required",
      });
    }

    const classroomDoc = await Classroom.findById(classroom);
    if (!classroomDoc) {
      return res.status(404).json({
        message: "Classroom not found",
      });
    }
    if (classroomDoc.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    const announcement = await Announcement.create({
      classroom,
      title,
      description,
      postedBy: req.user.id,
    });

    res.status(201).json({
      message: "Announcement posted",
      announcement,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({
      classroom: req.params.classroomId,
    })
      .populate("postedBy", "name email")
      .sort({ createdAt: -1 });

    res.json(announcements);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
