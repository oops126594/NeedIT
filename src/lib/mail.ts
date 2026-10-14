const SENDER_NAME = "NEEDIT";

type MailjetCredentials = { key: string; secret: string };

function credentials(): MailjetCredentials | null {
  const key = process.env.MAIL_JET_API_KEY || process.env.MAILJET_API_KEY;
  const secret =
    process.env.MAIL_JET_API_SECRET || process.env.MAILJET_API_SECRET || process.env.MAILJET_SECRET_KEY;
  if (!key || !secret) return null;
  return { key, secret };
}

export function mailConfigured(): boolean {
  return credentials() !== null || Boolean(process.env.SMTP_HOST && process.env.MAIL_FROM);
}

export function appOrigin(): string {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

function parseFrom(value: string): { Email: string; Name: string } {
  const wrapped = value.match(/^(.*)<([^>]+)>$/);
  if (wrapped) return { Name: wrapped[1].trim() || SENDER_NAME, Email: wrapped[2].trim() };
  return { Name: SENDER_NAME, Email: value.trim() };
}

let cachedFrom: { Email: string; Name: string } | null = null;

async function mailjetFrom(auth: MailjetCredentials): Promise<{ Email: string; Name: string } | null> {
  if (process.env.MAIL_FROM) return parseFrom(process.env.MAIL_FROM);
  if (cachedFrom) return cachedFrom;
  const response = await fetch("https://api.mailjet.com/v3/REST/sender", {
    headers: { Authorization: basicAuth(auth) },
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as { Data?: { Email?: string; Status?: string; Name?: string }[] };
  const sender = payload.Data?.find((item) => item.Status === "Active" && item.Email);
  if (!sender?.Email) return null;
  cachedFrom = { Email: sender.Email, Name: sender.Name || SENDER_NAME };
  return cachedFrom;
}

function basicAuth(auth: MailjetCredentials): string {
  return `Basic ${Buffer.from(`${auth.key}:${auth.secret}`).toString("base64")}`;
}

async function sendWithMailjet(input: { to: string; subject: string; text: string }): Promise<boolean> {
  const auth = credentials();
  if (!auth) return false;
  const from = await mailjetFrom(auth);
  if (!from) {
    console.error("Mailjet has no active sender. Add MAIL_FROM with an address validated in Mailjet.");
    return false;
  }
  const response = await fetch("https://api.mailjet.com/v3.1/send", {
    method: "POST",
    headers: { Authorization: basicAuth(auth), "Content-Type": "application/json" },
    body: JSON.stringify({
      Messages: [
        {
          From: from,
          To: [{ Email: input.to }],
          Subject: input.subject,
          TextPart: input.text,
        },
      ],
    }),
  });
  const payload = (await response.json().catch(() => null)) as {
    Messages?: { Status?: string; Errors?: { ErrorMessage?: string }[] }[];
  } | null;
  const message = payload?.Messages?.[0];
  if (!response.ok || message?.Status !== "success") {
    console.error("Mailjet send failed", message?.Errors?.[0]?.ErrorMessage || response.status);
    return false;
  }
  return true;
}

export async function sendMail(input: { to: string; subject: string; text: string }): Promise<boolean> {
  if (credentials()) return sendWithMailjet(input);
  if (!process.env.SMTP_HOST || !process.env.MAIL_FROM) return false;
  const nodemailer = await import("nodemailer");
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
