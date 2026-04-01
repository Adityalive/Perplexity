import nodemailer from "nodemailer";

const emailUser = process.env.EMAIL_USER;
const emailAppPassword =
  process.env.EMAIL_APP_PASSWORD || process.env["Email_App-PASSWORD"];

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: emailUser,
    pass: emailAppPassword,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("Error connecting to email server:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});

export const sendEmail = async (to, subject, text, html) => {
  try {
    if (!to) {
      throw new Error("Recipient email is required");
    }

    const details = await transporter.sendMail({
      from: `"Perplexity" <${emailUser}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("Email sent:", details.messageId);
    return details;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
