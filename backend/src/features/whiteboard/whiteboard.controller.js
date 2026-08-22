const { getAuthorizedSession } = require("../session/session.service");
const { getOrInitBoard } = require("./whiteboard.service");
const registry = require("../../sockets/roomRegistry");

exports.getBoardBySession = async (req, res) => {
  try {
    await getAuthorizedSession(req.params.sessionId, req.user);
    const board = await getOrInitBoard(req.params.sessionId);

    res.json({
      pages: board.pages,
      activePageId: registry.getActivePage(req.params.sessionId) ||
      board.pages[0]?.pageId ||
      null,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};
