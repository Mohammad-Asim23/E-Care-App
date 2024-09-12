// lib/emailService.js
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.NEXT_PUBLIC_SENDGRID_API_KEY);

export const sendEmail = async (to, subject, text) => {
  try {
    const msg = {
      to,
      from: "mohasim541@gmail.com",
      subject,
      text,
    };
    await sgMail.send(msg);
    console.log("Email sent to:", to);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
