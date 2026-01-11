import nodemailer from 'nodemailer';
import { config } from './env.js';

export type MailPayload = {
  to?: string;
  subject: string;
  text?: string;
  html?: string;
};

export async function sendMail(payload: MailPayload): Promise<{ sent: boolean; reason?: string }> {
  if (!config.mail.host || !config.mail.from) {
    return { sent: false, reason: 'SMTP not configured' };
  }

  const to = payload.to || config.mail.to;
  if (!to) {
    return { sent: false, reason: 'No recipient email address' };
  }

  try {
  const transporter = nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    auth: config.mail.user
      ? {
          user: config.mail.user,
          pass: config.mail.pass,
        }
      : undefined,
  });

  await transporter.sendMail({
    from: config.mail.from,
    to,
    subject: payload.subject,
    text: payload.text || (payload.html ? payload.html.replace(/<[^>]*>/g, '') : ''),
    html: payload.html,
  });

  return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { sent: false, reason: `Failed to send email: ${message}` };
  }
}
