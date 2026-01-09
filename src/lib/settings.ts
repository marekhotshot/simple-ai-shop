import crypto from 'crypto';
import { config } from './env.js';
import { query } from '../db.js';

const KEY_LENGTH = 32;

function decodeKey(): Buffer {
  const key = Buffer.from(config.settingsMasterKey, 'base64');
  if (key.length !== KEY_LENGTH) {
    throw new Error('SETTINGS_MASTER_KEY must be 32 bytes base64');
  }
  return key;
}

export type SecureSetting = {
  key: string;
  valueEncrypted: Buffer;
  valueLast4: string | null;
};

export function encryptSetting(key: string, value: string): SecureSetting {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', decodeKey(), iv);
  cipher.setAAD(Buffer.from(key));
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const valueEncrypted = Buffer.concat([iv, tag, encrypted]);
  const valueLast4 = value.length >= 4 ? value.slice(-4) : value;
  return { key, valueEncrypted, valueLast4 };
}

export function decryptSetting(key: string, valueEncrypted: Buffer): string {
  const iv = valueEncrypted.subarray(0, 12);
  const tag = valueEncrypted.subarray(12, 28);
  const encrypted = valueEncrypted.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', decodeKey(), iv);
  decipher.setAAD(Buffer.from(key));
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

export async function saveSetting(key: string, value: string, updatedBy: string | null) {
  const encrypted = encryptSetting(key, value);
  await query(
    `INSERT INTO settings_secure (key, value_encrypted, value_last4, updated_at, updated_by)
     VALUES ($1, $2, $3, NOW(), $4)
     ON CONFLICT (key)
     DO UPDATE SET value_encrypted = EXCLUDED.value_encrypted,
       value_last4 = EXCLUDED.value_last4,
       updated_at = NOW(),
       updated_by = EXCLUDED.updated_by`,
    [encrypted.key, encrypted.valueEncrypted, encrypted.valueLast4, updatedBy],
  );
}

export async function loadSetting(key: string): Promise<string | null> {
  const rows = await query<{ value_encrypted: Buffer }>(
    'SELECT value_encrypted FROM settings_secure WHERE key = $1',
    [key],
  );
  if (!rows[0]) {
    return null;
  }
  return decryptSetting(key, rows[0].value_encrypted);
}

export async function loadSettingFlags(keys: string[]) {
  const rows = await query<{ key: string; value_last4: string | null }>(
    'SELECT key, value_last4 FROM settings_secure WHERE key = ANY($1)',
    [keys],
  );
  return rows.reduce<Record<string, { configured: boolean; last4: string | null }>>(
    (acc, row) => {
      acc[row.key] = { configured: true, last4: row.value_last4 };
      return acc;
    },
    {},
  );
}
