// src/lib/crypto.ts (AES-256-GCM)
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { env } from "./env";

function getKey(): Buffer {
  const k = env.SAMPLE_ENC_KEY || process.env.SAMPLE_ENC_KEY;
  if (!k) {
    // Deterministic 32-byte key fallback for local development/testing
    return Buffer.from("Cp2ZHAZuGuc9vGXokXFOkerlD2A5uo6fuZYtQIWYHQ0=", "base64");
  }
  return Buffer.from(k, "base64");
}

export const seal = (obj: unknown, customKey?: Buffer): string => {
  const key = customKey ?? getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([
    cipher.update(JSON.stringify(obj), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, enc]).toString("base64");
};

export const open = <T>(b64: string, customKey?: Buffer): T => {
  const key = customKey ?? getKey();
  const b = Buffer.from(b64, "base64");
  if (b.length < 28) {
    throw new Error("Invalid encrypted payload length");
  }
  const iv = b.subarray(0, 12);
  const authTag = b.subarray(12, 28);
  const data = b.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return JSON.parse(decrypted.toString("utf8")) as T;
};
