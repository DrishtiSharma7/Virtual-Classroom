const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/auth.middleware");
const { getDashboard } = require("./dashboard.controller");

router.get("/", authMiddleware, getDashboard);

module.exports = router;
