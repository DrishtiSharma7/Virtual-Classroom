const Whiteboard = require("./whiteboard.model");

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
