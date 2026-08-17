const Whiteboard = require("./whiteboard.model");

// Used on load/reconnect as a REST fallback, same pattern as chat history —
// lets the client paint the current board before the socket has even
// finished connecting.
exports.getBoardBySession = async (req, res) => {
  try {
    const board = await Whiteboard.findOne({
      session: req.params.sessionId,
    });

    res.json({
      elements: board?.elements || [],
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};