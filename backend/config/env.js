import { config as loadDotenv } from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Local development reads backend/config/config.env (or backend/.env).
// On a hosting provider, set these as real environment variables instead.
for (const file of [
  path.join(__dirname, "config.env"),
  path.join(__dirname, "..", ".env"),
]) {
  if (fs.existsSync(file)) {
    loadDotenv({ path: file });
  }
}

const REQUIRED = [
  "MONGO_URI",
  "JWT_SECRET_KEY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

export const assertRequiredEnv = () => {
  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(
      `Missing required environment variables: ${missing.join(", ")}.\n` +
        "Copy backend/config/config.env.example to backend/config/config.env " +
        "for local development, or set them in your hosting provider."
    );
    process.exit(1);
  }
  if (
    process.env.NODE_ENV === "production" &&
    process.env.JWT_SECRET_KEY.length < 32
  ) {
    console.error("JWT_SECRET_KEY must be at least 32 characters in production.");
    process.exit(1);
  }
};

const toList = (value) =>
  (value || "")
    .split(",")
    .map((item) => item.trim().replace(/\/$/, ""))
    .filter(Boolean);

const sameSite = (process.env.COOKIE_SAMESITE || "lax").toLowerCase();

export const env = {
  isProduction: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGO_URI,
  dbName: process.env.DB_NAME || "MERN_AUCTION_PLATFORM",
  frontendUrls: toList(process.env.FRONTEND_URL),
  jwtSecret: process.env.JWT_SECRET_KEY,
  jwtExpire: process.env.JWT_EXPIRE || "7d",
  cookieExpireDays: Number(process.env.COOKIE_EXPIRE) || 7,
  cookieSameSite: ["lax", "strict", "none"].includes(sameSite) ? sameSite : "lax",
  trustProxy: process.env.TRUST_PROXY ?? "1",
  commissionRate: Number(process.env.COMMISSION_RATE) || 0.05,
  appName: process.env.APP_NAME || "PrimeBid",
  contactReceiver: process.env.CONTACT_RECEIVER_EMAIL || process.env.SMTP_MAIL,
  enableCron: process.env.ENABLE_CRON !== "false",
  serveClient: process.env.SERVE_CLIENT !== "false",
};
