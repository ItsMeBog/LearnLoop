import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendReminderEmail = async ({ to, subject, html }) => {
  return await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
};