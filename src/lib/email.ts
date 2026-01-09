import nodemailer from 'nodemailer';
import { config } from './env.js';

export type MailPayload = {
  subject: string;
  text: string;
};

export async function sendMail(payload: MailPayload): Promise<{ sent: boolean; reason?: string }> {
  if (!config.mail.host || !config.mail.to || !config.mail.from) {
    return { sent: false, reason: 'SMTP not configured' };
  }

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
    to: config.mail.to,
    subject: payload.subject,
    text: payload.text,
  });

  return { sent: true };
}
