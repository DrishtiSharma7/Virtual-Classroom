const { getAuthorizedSession } = require("../session/session.service");
const { getOrInitBoard } = require("./whiteboard.service");
const registry = require("../../sockets/roomregistry");

// Used on load/reconnect as a REST fallback, same pattern as chat history —
// lets the client paint the current board before the socket has even
// finished connecting. Gated by the same session-membership check as the
// socket path so a board can't be read by an account outside that
// session's classroom just by knowing its id.
exports.getBoardBySession = async (req, res) => {
  try {
    await getAuthorizedSession(req.params.sessionId, req.user);
    const board = await getOrInitBoard(req.params.sessionId);

    res.json({
      pages: board.pages,
      // Same fallback as the socket path: no host has switched pages this
      // server run yet, so default to the first page.
      activePageId:
        registry.getActivePage(req.params.sessionId) ||
        board.pages[0]?.pageId ||
        null,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};
