import nodeMailer from "nodemailer";

let transporter;
let warned = false;

const getTransporter = () => {
  if (!process.env.SMTP_MAIL || !process.env.SMTP_PASSWORD) {
    return null;
  }
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 465;
    transporter = nodeMailer.createTransport(
      process.env.SMTP_SERVICE
        ? {
            service: process.env.SMTP_SERVICE,
            auth: {
              user: process.env.SMTP_MAIL,
              pass: process.env.SMTP_PASSWORD,
            },
          }
        : {
            host: process.env.SMTP_HOST,
            port,
            secure: port === 465,
            auth: {
              user: process.env.SMTP_MAIL,
              pass: process.env.SMTP_PASSWORD,
            },
          }
    );
  }
  return transporter;
};

/**
 * Sends a plain-text email. Never throws: email problems are logged so they
 * cannot crash the request or the background jobs. Returns true on success.
 */
export const sendEmail = async ({ email, subject, message, replyTo }) => {
  const mailer = getTransporter();
  if (!mailer) {
    if (!warned) {
      console.warn("SMTP is not configured; emails are disabled.");
      warned = true;
    }
    return false;
  }
  try {
    await mailer.sendMail({
      from: `"${process.env.APP_NAME || "PrimeBid"}" <${process.env.SMTP_MAIL}>`,
      to: email,
      subject,
      text: message,
      ...(replyTo ? { replyTo } : {}),
    });
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${email}: ${error.message}`);
    return false;
  }
};
