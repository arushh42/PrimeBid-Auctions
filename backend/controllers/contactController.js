import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { sendEmail } from "../utils/sendEmail.js";
import { env } from "../config/env.js";

const str = (value, max) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

export const sendContactMessage = catchAsyncErrors(async (req, res, next) => {
  const name = str(req.body.name, 80);
  const email = str(req.body.email, 120);
  const phone = str(req.body.phone, 20);
  const subject = str(req.body.subject, 150);
  const message = str(req.body.message, 5000);

  if (!name || !email || !subject || !message) {
    return next(new ErrorHandler("Please fill in all required fields.", 400));
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return next(new ErrorHandler("Please provide a valid email.", 400));
  }
  if (!env.contactReceiver) {
    return next(new ErrorHandler("The contact form is not available right now.", 503));
  }

  const sent = await sendEmail({
    email: env.contactReceiver,
    replyTo: email,
    subject: `[${env.appName} Contact] ${subject}`,
    message: `New contact form message\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || "-"}\n\n${message}`,
  });
  if (!sent) {
    return next(new ErrorHandler("Failed to send message. Please try again later.", 502));
  }

  res.status(200).json({
    success: true,
    message: "Thank you! Your message has been sent.",
  });
});
