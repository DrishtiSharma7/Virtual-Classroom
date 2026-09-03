const Recording = require("./recording.model");
const Classroom = require("../classroom/classroom.model");
const path = require("path");
const fs = require("fs");

exports.uploadRecording = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "A video file is required.",
      });
    }

    const { classroom, title, description, session } = req.body;
    if (!classroom) {
      return res.status(400).json({
        message: "Classroom ID is required.",
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Recording title is required.",
      });
    }

    const classroomDoc = await Classroom.findById(classroom);
    if (!classroomDoc) {
      return res.status(404).json({
        message: "Classroom not found.",
      });
    }

    if (classroomDoc.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Only the classroom teacher can upload recordings.",
      });
    }

    const recording = await Recording.create({
      classroom,
      session: session || undefined,
      title: title.trim(),
      description: description ? description.trim() : "",
      fileUrl: "uploads/" + req.file.filename,
      uploadedBy: req.user.id,
    });

    await recording.populate("uploadedBy", "name email");

    res.status(201).json({
      message: "Recording uploaded successfully",
      recording,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getRecordings = async (req, res) => {
  try {
    const recordings = await Recording.find({
      classroom: req.params.classroomId,
    })
      .populate("uploadedBy", "name email")
      .sort({
        createdAt: -1,
      });

    res.json(recordings);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.deleteRecording = async (req, res) => {
  try {
    const recording = await Recording.findById(req.params.id);

    if (!recording) {
      return res.status(404).json({
        message: "Recording not found",
      });
    }

    const classroomDoc = await Classroom.findById(recording.classroom);
    if (
      recording.uploadedBy.toString() !== req.user.id &&
      classroomDoc?.teacher.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: "Not authorized to delete this recording",
      });
    }

    if (recording.fileUrl) {
      const filePath = path.join(__dirname, "../../../", recording.fileUrl);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn("Could not delete recording file from disk:", e.message);
        }
      }
    }

    await recording.deleteOne();

    res.json({
      message: "Recording deleted successfully",
      recordingId: req.params.id,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
