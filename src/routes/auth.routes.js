const express = require("express");
const { rateLimit } = require("express-rate-limit");

const {
  login,
  logout,
  getMe,
} = require("../controllers/auth.controller");

const {
  authenticate,
} = require("../middlewares/auth.middleware");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});

router.post("/login", loginLimiter, login);

router.post("/logout", logout);

router.get("/me", authenticate, getMe);

module.exports = router;