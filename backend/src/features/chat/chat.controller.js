const Chat = require("./chat.model");

// Get messages by session

exports.getMessagesBySession = async (req, res) => {
  try {
    const messages = await Chat.find({
      session: req.params.sessionId,
    })

      .populate("sender", "name email")

      .sort({
        createdAt: 1,
      });

    res.json(messages);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// Delete Message

exports.deleteMessage = async (req, res) => {
  try {
    const message = await Chat.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    await message.deleteOne();

    res.json({
      message: "Message deleted",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
