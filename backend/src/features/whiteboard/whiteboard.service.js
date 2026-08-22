const Whiteboard = require("./whiteboard.model");

// Single place that guarantees a session's Whiteboard doc exists AND is in
// the current multi-page shape ({pages: [{pageId, name, elements}]}).
// Used by both the REST controller and every socket handler that touches a
// board so a session created before multi-page support shipped still loads
// correctly instead of silently losing its content — its old flat
// `elements` array is wrapped into a single "Page 1" the first time this
// runs for that doc, in place, once.
async function getOrInitBoard(sessionId) {
  let board = await Whiteboard.findOne({ session: sessionId });

  if (!board) {
    return Whiteboard.create({
      session: sessionId,
      pages: [{ pageId: "page-1", name: "Page 1", elements: [] }],
    });
  }

  if (!Array.isArray(board.pages) || board.pages.length === 0) {
    const legacyElements = Array.isArray(board.get("elements", null, { strict: false }))
      ? board.get("elements", null, { strict: false })
      : [];
    board.pages = [{ pageId: "page-1", name: "Page 1", elements: legacyElements }];
    board.set("elements", undefined, { strict: false });
    await board.save();
  }

  return board;
}

module.exports = { getOrInitBoard };
