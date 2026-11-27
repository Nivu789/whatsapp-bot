const express = require("express");

const {
  getLeads,
  getLeadById,
  updateLeadStatus,
} = require("../controllers/lead.controller");

const {
  authenticate,
  authorize,
} = require("../middlewares/auth.middleware");

const router = express.Router();

// Protect all lead routes
router.use(authenticate);
router.use(authorize("admin", "staff"));

// Retrieve all leads
router.get("/", getLeads);

// Retrieve a specific lead
router.get("/:id", getLeadById);

// Confirm or cancel a booking
router.patch("/:id/status", updateLeadStatus);

module.exports = router;