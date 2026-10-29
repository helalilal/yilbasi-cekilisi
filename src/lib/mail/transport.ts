import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export type Mail = { to: string; subject: string; html: string; text: string };

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT ?? 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

/** Sends via SMTP, or — when SMTP is not configured — writes the mail to ./.dev-mails for local testing. */
export async function sendMail(mail: Mail): Promise<void> {
  const t = getTransporter();
  if (!t) {
    if (process.env.NODE_ENV === "production") throw new Error("SMTP is not configured");
    const dir = path.join(process.cwd(), ".dev-mails");
    await mkdir(dir, { recursive: true });
    const file = `${Date.now()}-${mail.to.replace(/[^a-z0-9]/gi, "_")}.html`;
    await writeFile(
      path.join(dir, file),
      `<!-- To: ${mail.to} | Subject: ${mail.subject} -->\n${mail.html}`,
    );
    console.log(`[dev-mail] ${mail.to} :: ${mail.subject} -> .dev-mails/${file}`);
    return;
  }
  await t.sendMail({
    from: process.env.MAIL_FROM ?? process.env.SMTP_USER,
    to: mail.to,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });
}
