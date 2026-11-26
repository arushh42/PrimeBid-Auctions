import { env } from "../config/env.js";

export const cookieOptions = () => ({
  httpOnly: true,
  sameSite: env.cookieSameSite,
  // SameSite=None requires Secure; always use Secure in production.
  secure: env.isProduction || env.cookieSameSite === "none",
  path: "/",
});

export const generateToken = (user, message, statusCode, res) => {
  const token = user.generateJsonWebToken();
  res
    .status(statusCode)
    .cookie("token", token, {
      ...cookieOptions(),
      maxAge: env.cookieExpireDays * 24 * 60 * 60 * 1000,
    })
    .json({
      success: true,
      message,
      user,
    });
};

export const clearToken = (res) => {
  res.clearCookie("token", cookieOptions());
};
