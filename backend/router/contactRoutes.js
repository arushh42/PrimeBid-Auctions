import express from "express";
import { sendContactMessage } from "../controllers/contactController.js";
import { contactLimiter } from "../middlewares/rateLimiters.js";

const router = express.Router();

router.post("/", contactLimiter, sendContactMessage);

export default router;
