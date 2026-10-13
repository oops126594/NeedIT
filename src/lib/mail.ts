import nodemailer from "nodemailer";

export function mailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.MAIL_FROM);
}

export function appOrigin(): string {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export async function sendMail(input: { to: string; subject: string; text: string }): Promise<boolean> {
  if (!mailConfigured()) return false;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: user ? { user, pass: pass ?? "" } : undefined,
  });
  await transport.sendMail({
    from: process.env.MAIL_FROM,
    to: input.to,
    subject: input.subject,
    text: input.text,
  });
  return true;
}
