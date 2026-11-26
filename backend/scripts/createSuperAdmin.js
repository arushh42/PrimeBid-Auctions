/**
 * Creates (or promotes) a Super Admin account.
 *
 *   ADMIN_NAME="Site Admin" ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='...' npm run create-admin
 *   npm run create-admin -- --name "Site Admin" --email admin@example.com --password '...'
 *
 * Public sign-up can never create Super Admins; this script is the only way.
 */
import mongoose from "mongoose";
import { assertRequiredEnv, env } from "../config/env.js";
import { User } from "../models/userSchema.js";

const arg = (name) => {
  const index = process.argv.indexOf(`--${name}`);
  return index > -1 ? process.argv[index + 1] : undefined;
};

const name = arg("name") || process.env.ADMIN_NAME || "Super Admin";
const email = (arg("email") || process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const password = arg("password") || process.env.ADMIN_PASSWORD || "";

if (!email || password.length < 8) {
  console.error(
    "Provide ADMIN_EMAIL and ADMIN_PASSWORD (min 8 chars), via env vars or --email/--password."
  );
  process.exit(1);
}

assertRequiredEnv();
await mongoose.connect(env.mongoUri, { dbName: env.dbName });

try {
  const existing = await User.findOne({ email }).select("+password");
  if (existing) {
    existing.role = "Super Admin";
    existing.password = password;
    await existing.save();
    console.log(`Updated ${email}: role set to Super Admin and password reset.`);
  } else {
    await User.create({ userName: name, email, password, role: "Super Admin" });
    console.log(`Created Super Admin ${email}.`);
  }
} catch (error) {
  console.error("Failed to create Super Admin:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
