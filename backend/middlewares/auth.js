import jwt from "jsonwebtoken";
import { User } from "../models/userSchema.js";
import { env } from "../config/env.js";
import ErrorHandler from "./error.js";
import { catchAsyncErrors } from "./catchAsyncErrors.js";

export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return next(new ErrorHandler("Please log in to continue.", 401));
  }
  const decoded = jwt.verify(token, env.jwtSecret);
  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new ErrorHandler("Account no longer exists.", 401));
  }
  req.user = user;
  next();
});

export const isAuthorized = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ErrorHandler("You are not allowed to access this resource.", 403)
      );
    }
    next();
  };
};
