const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/auth.middleware");
const { cacheMiddleware } = require("../../middleware/cache.middleware");
const { getDashboard } = require("./dashboard.controller");

router.get(
  "/",
  authMiddleware,
  cacheMiddleware({ ttl: 30, prefix: "dashboard" }),
  getDashboard,
);

module.exports = router;
