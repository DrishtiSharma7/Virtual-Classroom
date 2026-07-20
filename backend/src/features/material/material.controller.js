const Material = require("./material.model");

// Upload Material
exports.uploadMaterial = async (req, res) => {
  try {
    const material = await Material.create({
      classroom: req.body.classroom,
      title: req.body.title,
      description: req.body.description,
      fileUrl: req.file.path,
      uploadedBy: req.user.id,
    });

    res.status(201).json({
      message: "Material uploaded",
      material,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// Get Materials by Classroom
exports.getMaterials = async (req, res) => {
  try {
    const materials = await Material.find({
      classroom: req.params.classroomId,
    })
      .populate("uploadedBy", "name email")
      .sort({
        createdAt: -1,
      });

    res.json(materials);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// Delete Material
exports.deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        message: "Material not found",
      });
    }

    if (material.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    await material.deleteOne();

    res.json({
      message: "Material deleted",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
