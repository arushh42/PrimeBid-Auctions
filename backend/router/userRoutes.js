import express from "express";
import {
  fetchLeaderboard,
  getProfile,
  login,
  logout,
  register,
} from "../controllers/userController.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { authLimiter } from "../middlewares/rateLimiters.js";

const router = express.Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.get("/me", isAuthenticated, getProfile);
// Logout works even with an expired/invalid cookie.
router.get("/logout", logout);
router.post("/logout", logout);
router.get("/leaderboard", fetchLeaderboard);

export default router;
