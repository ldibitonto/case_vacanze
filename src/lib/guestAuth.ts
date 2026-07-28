import { createHmac, timingSafeEqual } from "crypto";

// Login "senza password" (come "Accedi come guest" di HomeToGo): l'utente
// inserisce la mail, riceve un link firmato via email (vedi
// sendGuestLoginEmail in lib/email.ts) e cliccandolo ottiene un cookie di
// sessione, anch'esso solo un valore firmato — niente tabella
// utenti/password/sessioni nel DB, solo la mail stessa più una firma HMAC
// che ne garantisce l'autenticità e la scadenza. "Le tue prenotazioni"
// funziona di conseguenza cercando le Booking con quella stessa
// guestEmail, e il profilo (GuestProfile) è tenuto insieme dalla mail.
const SECRET = process.env.AUTH_SECRET || process.env.RESEND_API_KEY || "dev-only-insecure-secret";

if (!process.env.AUTH_SECRET && process.env.NODE_ENV === "production") {
  console.warn(
    "[guestAuth] AUTH_SECRET non impostata: uso un fallback meno robusto. Imposta AUTH_SECRET su Vercel per firmare i link di accesso in modo sicuro."
  );
}

export const SESSION_COOKIE = "guest_session";
const LOGIN_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minuti: il link scade in fretta
const SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 giorni: cookie di sessione lungo

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

function pack(email: string, expiresAt: number): string {
  const payload = `${email}.${expiresAt}`;
  const signature = sign(payload);
  return Buffer.from(`${payload}.${signature}`, "utf-8").toString("base64url");
}

function unpack(token: string): { email: string; expiresAt: number } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const lastDot = decoded.lastIndexOf(".");
    const secondLastDot = decoded.lastIndexOf(".", lastDot - 1);
    if (lastDot === -1 || secondLastDot === -1) return null;

    const payload = decoded.slice(0, lastDot);
    const signature = decoded.slice(lastDot + 1);
    const email = decoded.slice(0, secondLastDot);
    const expiresAtStr = decoded.slice(secondLastDot + 1, lastDot);
    const expiresAt = Number(expiresAtStr);
    if (!email || !Number.isFinite(expiresAt)) return null;

    const expected = sign(payload);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    return { email, expiresAt };
  } catch {
    return null;
  }
}

// Token per il link via mail: monouso solo nel senso che scade in 30 minuti
// (non c'è un elenco di token "già usati" da controllare, per restare senza
// tabelle dedicate — accettabile per un sito di prova).
export function createLoginToken(email: string): string {
  return pack(email.trim().toLowerCase(), Date.now() + LOGIN_TOKEN_TTL_MS);
}

export function verifyLoginToken(token: string): string | null {
  const unpacked = unpack(token);
  if (!unpacked || unpacked.expiresAt < Date.now()) return null;
  return unpacked.email;
}

// Valore del cookie di sessione: stessa logica, scadenza più lunga.
export function createSessionValue(email: string): string {
  return pack(email.trim().toLowerCase(), Date.now() + SESSION_TTL_MS);
}

export function verifySessionValue(value: string | undefined | null): string | null {
  if (!value) return null;
  const unpacked = unpack(value);
  if (!unpacked || unpacked.expiresAt < Date.now()) return null;
  return unpacked.email;
}

export const SESSION_COOKIE_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000;
