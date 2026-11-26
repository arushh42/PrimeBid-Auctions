import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const USER_ROLES = ["Auctioneer", "Bidder", "Super Admin"];
export const PUBLIC_SIGNUP_ROLES = ["Auctioneer", "Bidder"];

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    trim: true,
    required: [true, "Name is required."],
    minLength: [3, "Name must contain at least 3 characters."],
    maxLength: [40, "Name cannot exceed 40 characters."],
  },
  password: {
    type: String,
    required: [true, "Password is required."],
    select: false,
  },
  email: {
    type: String,
    required: [true, "Email is required."],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email."],
  },
  address: { type: String, trim: true, maxLength: 200 },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[0-9]{7,15}$/, "Phone number must be 7-15 digits."],
  },
  profileImage: {
    public_id: String,
    url: String,
  },
  paymentMethods: {
    bankTransfer: {
      bankAccountNumber: { type: String, trim: true },
      bankAccountName: { type: String, trim: true },
      bankName: { type: String, trim: true },
    },
    wallet: {
      provider: { type: String, trim: true },
      accountId: { type: String, trim: true },
    },
    paypal: {
      paypalEmail: { type: String, trim: true, lowercase: true },
    },
  },
  role: {
    type: String,
    enum: USER_ROLES,
    required: true,
  },
  unpaidCommission: {
    type: Number,
    default: 0,
    min: 0,
  },
  auctionsWon: {
    type: Number,
    default: 0,
  },
  moneySpent: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.index({ moneySpent: -1 });

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(String(enteredPassword), this.password);
};

userSchema.methods.generateJsonWebToken = function () {
  return jwt.sign({ id: this._id }, env.jwtSecret, {
    expiresIn: env.jwtExpire,
  });
};

userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model("User", userSchema);
