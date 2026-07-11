const Submission = require("./submission.model");

exports.submitAssignment = async (req, res) => {
  try {
    const existingSubmission = await Submission.findOne({
      assignment: req.body.assignmentId,
      student: req.user.id,
    });

    if (existingSubmission) {
      return res.status(400).json({
        message: "Already submitted",
      });
    }
    const submission = await Submission.create({
      assignment: req.body.assignmentId,
      student: req.user.id,
      content: req.body.content,
    });
    res.status(201).json({
      message: "Assignment submitted",
      submission,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({
      assignment: req.params.assignmentId,
    }).populate("student", "name email");
    res.json(submissions);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.giveMarks = async (req, res) => {
  try {
    const submission = await Submission.findByIdAndUpdate(
      req.params.id,
      {
        marks: req.body.marks,
      },
      {
        new: true,
      },
    );
    res.json({
      message: "Marks updated",
      submission,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
