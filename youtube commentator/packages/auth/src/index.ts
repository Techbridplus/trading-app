import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { UserPayload } from '@repo/types';

const SALT_ROUNDS = 12;

// ── Password Hashing ──
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ── JWT Token Generation ──
export function generateAccessToken(
  payload: UserPayload,
  secret: string,
  expiresIn: string = '15m'
): string {
  return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
}

export function generateRefreshToken(
  payload: { id: string },
  secret: string,
  expiresIn: string = '7d'
): string {
  return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
}

export function verifyToken<T = UserPayload>(token: string, secret: string): T {
  return jwt.verify(token, secret) as T;
}

// ── Token Encryption (for OAuth tokens at rest) ──
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

export function encryptToken(text: string, key: string): string {
  const keyBuffer = Buffer.from(key.padEnd(32, '0').slice(0, 32));
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, keyBuffer, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptToken(encryptedText: string, key: string): string {
  const keyBuffer = Buffer.from(key.padEnd(32, '0').slice(0, 32));
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, keyBuffer, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
