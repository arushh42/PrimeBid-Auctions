import mongoose from "mongoose";
import { env } from "../config/env.js";

export const connection = async () => {
  try {
    await mongoose.connect(env.mongoUri, { dbName: env.dbName });
    console.log("Connected to database.");
  } catch (err) {
    console.error(`Could not connect to database: ${err.message}`);
    process.exit(1);
  }
};
