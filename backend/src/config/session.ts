import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "./env";

// Duracion maxima de una sesion: un turno de trabajo. Pasado este tiempo hay que volver a entrar.
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

interface SessionPayload {
  userId: number;
  username: string;
  role: string;
  restaurantId: number | null;
}

// Short fingerprint of the password hash: changing the password closes every other session
export function passwordStamp(passwordHash: string) {
  return crypto.createHash("sha256").update(passwordHash).digest("hex").slice(0, 16);
}

export function signSessionToken(payload: SessionPayload, passwordHash: string): string {
  return jwt.sign({ ...payload, pv: passwordStamp(passwordHash) }, env.JWT_SECRET, { expiresIn: SESSION_TTL_SECONDS });
}

// Tokens cerrados con "Cerrar sesion". Se guarda solo el hash y se borra al vencer.
// Vive en memoria: si el servidor se reinicia, el token igual vence a las 8 horas.
const revoked = new Map<string, number>();
const hash = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

export function revokeToken(token: string) {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  const exp = decoded?.exp ? decoded.exp * 1000 : Date.now() + SESSION_TTL_SECONDS * 1000;
  revoked.set(hash(token), exp);
}

export function isTokenRevoked(token: string): boolean {
  return revoked.has(hash(token));
}

setInterval(() => {
  const now = Date.now();
  for (const [key, exp] of revoked) if (exp <= now) revoked.delete(key);
}, 10 * 60 * 1000).unref();
