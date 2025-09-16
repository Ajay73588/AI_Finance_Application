"use server";

import { Resend } from "resend";

export async function sendEmail({ to, subject, react }) {
  console.log(`Attempting to send email to: ${to}`);
  console.log(`RESEND_API_KEY exists: ${!!process.env.RESEND_API_KEY}`);
  
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set in environment variables");
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    console.log(`Sending email with subject: ${subject}`);
    const data = await resend.emails.send({
      from: "Finance App <onboarding@resend.dev>",
      to,
      subject,
      react,
    });

    console.log("Email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}