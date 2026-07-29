// Sessione "Accedi come SuperHost" (pannello /admin): un'unica credenziale
// condivisa, letta da variabili d'ambiente Vercel (ADMIN_USERNAME /
// ADMIN_PASSWORD — le stesse già usate finora per il Basic Auth nativo del
// browser, che questo file sostituisce con una vera pagina di login).
//
// Firma il cookie di sessione con HMAC-SHA256 usando Web Crypto
// (crypto.subtle) invece del modulo "crypto" di Node: queste funzioni
// vengono eseguite anche da middleware.ts, che su Next.js gira sull'Edge
// Runtime e non supporta l'API "crypto" di Node né il global Buffer — per
// questo qui sotto uso solo API disponibili in entrambi gli ambienti
// (TextEncoder/TextDecoder, crypto.subtle, atob/btoa).

export const HOST_SESSION_COOKIE = "host_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 giorni
export const HOST_SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000;

function getSecret(): string {
  return process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || "dev-only-insecure-secret";
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const withPadding = padded + "=".repeat((4 - (padded.length % 4)) % 4);
  const binary = atob(withPadding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Confronto a tempo costante "manuale": crypto.subtle non espone un
// equivalente di crypto.timingSafeEqual di Node.
function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacSign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toBase64Url(signature);
}

export function verifyHostCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;
  if (!expectedUser || !expectedPass) return false;
  return timingSafeEqualStr(username, expectedUser) && timingSafeEqualStr(password, expectedPass);
}

export async function createHostSessionValue(): Promise<string> {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `host.${expiresAt}`;
  const signature = await hmacSign(payload);
  return toBase64Url(new TextEncoder().encode(`${payload}.${signature}`));
}

export async function verifyHostSessionValue(value: string | undefined | null): Promise<boolean> {
  if (!value) return false;

  let decoded: string;
  try {
    decoded = new TextDecoder().decode(fromBase64Url(value));
  } catch {
    return false;
  }

  const lastDot = decoded.lastIndexOf(".");
  if (lastDot === -1) return false;
  const payload = decoded.slice(0, lastDot);
  const signature = decoded.slice(lastDot + 1);

  const expectedSignature = await hmacSign(payload);
  if (!timingSafeEqualStr(signature, expectedSignature)) return false;

  const [marker, expiresAtStr] = payload.split(".");
  if (marker !== "host") return false;

  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  return true;
}
