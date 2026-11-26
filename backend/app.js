import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./config/env.js";
import ErrorHandler, { errorMiddleware } from "./middlewares/error.js";
import { apiLimiter } from "./middlewares/rateLimiters.js";
import userRouter from "./router/userRoutes.js";
import auctionItemRouter from "./router/auctionItemRoutes.js";
import bidRouter from "./router/bidRoutes.js";
import commissionRouter from "./router/commissionRouter.js";
import superAdminRouter from "./router/superAdminRoutes.js";
import contactRouter from "./router/contactRoutes.js";
import { MAX_UPLOAD_BYTES, discardUploads } from "./utils/cloudinary.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, "../frontend/dist");
const serveClient =
  env.serveClient && fs.existsSync(path.join(clientDist, "index.html"));

const app = express();

const trustProxy = /^\d+$/.test(env.trustProxy)
  ? Number(env.trustProxy)
  : env.trustProxy === "true" || env.trustProxy;
app.set("trust proxy", trustProxy);
app.disable("x-powered-by");

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Same-origin requests and non-browser clients send no Origin header.
      if (!origin || env.frontendUrls.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: os.tmpdir(),
    limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  })
);

// Remove any uploaded temp files once the response is done.
app.use((req, res, next) => {
  res.on("finish", () => discardUploads(req.files));
  next();
});

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ success: true, status: "ok" });
});

app.use("/api", apiLimiter);

// CSRF defence: state-changing API calls must carry a custom header, which
// browsers only allow cross-origin after a CORS preflight we control.
app.use("/api", (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  if (req.get("X-Requested-With") !== "XMLHttpRequest") {
    return next(new ErrorHandler("Missing X-Requested-With header.", 403));
  }
  next();
});
app.use("/api/v1/user", userRouter);
app.use("/api/v1/auctionitem", auctionItemRouter);
app.use("/api/v1/bid", bidRouter);
app.use("/api/v1/commission", commissionRouter);
app.use("/api/v1/superadmin", superAdminRouter);
app.use("/api/v1/contact", contactRouter);

app.use("/api", (req, res, next) => {
  next(new ErrorHandler(`Route not found: ${req.method} ${req.originalUrl}`, 404));
});

if (serveClient) {
  app.use(
    "/assets",
    express.static(path.join(clientDist, "assets"), {
      immutable: true,
      maxAge: "1y",
    })
  );
  app.use(express.static(clientDist, { index: false, maxAge: "1h" }));
  // Single-page app: every non-API GET falls back to index.html.
  app.get(/^(?!\/api(\/|$)).*/, (req, res) => {
    res.set("Cache-Control", "no-cache");
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use(errorMiddleware);

export default app;
