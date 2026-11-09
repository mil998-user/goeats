import crypto from "crypto";
import { env } from "../config/env";

const PREFIX = "enc:v1:";
const IV_BYTES = 12;

export function canEncryptSecrets() {
  return Boolean(env.DATA_ENCRYPTION_KEY);
}

function getKey() {
  if (!env.DATA_ENCRYPTION_KEY) {
    throw new Error("DATA_ENCRYPTION_KEY is required to store or read encrypted data.");
  }
  return Buffer.from(env.DATA_ENCRYPTION_KEY, "base64");
}

export function encryptSecret(value: string) {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const parts = [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64"));
  return PREFIX + parts.join(":");
}

// Values saved before encryption existed have no prefix and are returned as they are
export function decryptSecret(value: string) {
  if (!value.startsWith(PREFIX)) return value;

  const [iv, tag, encrypted] = value.slice(PREFIX.length).split(":").map((part) => Buffer.from(part, "base64"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
