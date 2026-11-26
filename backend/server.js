import mongoose from "mongoose";
import { assertRequiredEnv, env } from "./config/env.js";
import { configureCloudinary } from "./utils/cloudinary.js";
import { connection } from "./database/connection.js";
import { endedAuctionCron } from "./automation/endedAuctionCron.js";
import { verifyCommissionCron } from "./automation/verifyCommissionCron.js";
import app from "./app.js";

assertRequiredEnv();
configureCloudinary();
await connection();

const server = app.listen(env.port, () => {
  console.log(`Server listening on port ${env.port}`);
});

const jobs = env.enableCron ? [endedAuctionCron(), verifyCommissionCron()] : [];
if (!env.enableCron) {
  console.log("Background jobs disabled (ENABLE_CRON=false).");
}

const shutdown = (signal) => {
  console.log(`${signal} received, shutting down...`);
  jobs.forEach((job) => job?.stop?.());
  server.close(async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});
