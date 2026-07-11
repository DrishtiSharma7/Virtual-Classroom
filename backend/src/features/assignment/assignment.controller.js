const Assignment = require("./assignment.model");

// Create Assignment
exports.createAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.create({
      title: req.body.title,
      description: req.body.description,
      classroom: req.body.classroom,
      teacher: req.user.id,
      dueDate: req.body.dueDate,
    });

    res.status(201).json(assignment);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getAssignmentsByClassroom = async (req, res) => {
  try {
    const assignments = await Assignment.find({
      classroom: req.params.classroomId,
    });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        message: "Assignment not found",
      });
    }

    if (assignment.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    await assignment.deleteOne();

    res.json({
      message: "Assignment deleted",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
