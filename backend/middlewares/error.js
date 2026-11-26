import { env } from "../config/env.js";

class ErrorHandler extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

// eslint-disable-next-line no-unused-vars
export const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error.";

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid session. Please log in again.";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Your session has expired. Please log in again.";
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}.`;
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((error) => error.message)
      .join(" ");
  } else if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || "value";
    message = `An account with this ${field} already exists.`;
  } else if (err.type === "entity.too.large") {
    statusCode = 413;
    message = "Request body is too large.";
  } else if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Malformed JSON body.";
  }

  if (statusCode >= 500) {
    const expected = err instanceof ErrorHandler;
    console.error(expected ? `[${statusCode}] ${message}` : err);
    if (env.isProduction && !expected) {
      message = "Something went wrong. Please try again later.";
    }
  }

  return res.status(statusCode).json({
    success: false,
    message,
  });
};

export default ErrorHandler;
