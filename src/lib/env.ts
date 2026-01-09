import dotenv from 'dotenv';

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var ${key}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: requireEnv('DATABASE_URL'),
  dataRoot: process.env.DATA_ROOT ?? './data/uploads',
  settingsMasterKey: requireEnv('SETTINGS_MASTER_KEY'),
  mail: {
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    to: process.env.MAIL_TO ?? '',
    from: process.env.MAIL_FROM ?? '',
  },
  paypal: {
    mode: process.env.PAYPAL_MODE ?? 'sandbox',
    sandboxBaseUrl: process.env.PAYPAL_SANDBOX_BASE_URL ?? 'https://api-m.sandbox.paypal.com',
    liveBaseUrl: process.env.PAYPAL_LIVE_BASE_URL ?? 'https://api-m.paypal.com',
  },
  google: {
    apiBaseUrl: process.env.GOOGLE_API_BASE_URL ?? 'https://generativelanguage.googleapis.com',
  },
  apiBaseUrl: process.env.API_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`,
  imageBaseUrl: process.env.IMAGE_BASE_URL ?? process.env.API_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`,
};
