const Recording = require("./recording.model");

// Upload Recording
exports.uploadRecording = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "A video file is required.",
      });
    }

    const recording = await Recording.create({
      classroom: req.body.classroom,
      session: req.body.session || undefined,
      title: req.body.title,
      description: req.body.description,
      fileUrl: req.file.path,
      uploadedBy: req.user.id,
    });

    res.status(201).json({
      message: "Recording uploaded",
      recording,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// Get Recordings by Classroom
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

// Delete Recording
exports.deleteRecording = async (req, res) => {
  try {
    const recording = await Recording.findById(req.params.id);

    if (!recording) {
      return res.status(404).json({
        message: "Recording not found",
      });
    }

    if (recording.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    await recording.deleteOne();

    res.json({
      message: "Recording deleted",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
