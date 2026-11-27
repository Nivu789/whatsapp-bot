const express = require("express");

const {
  getStats,
} = require("../controllers/dashboard.controller");

const {
  authenticate,
  authorize,
} = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authenticate);
router.use(authorize("admin", "staff"));

router.get("/stats", getStats);

module.exports = router;