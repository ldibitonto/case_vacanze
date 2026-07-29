import { NextRequest, NextResponse } from "next/server";
import {
  HOST_SESSION_COOKIE,
  HOST_SESSION_MAX_AGE_SECONDS,
  createHostSessionValue,
  verifyHostCredentials,
} from "@/lib/hostAuth";
import { SESSION_COOKIE as GUEST_SESSION_COOKIE } from "@/lib/guestAuth";

// POST /api/auth/host-login — "Accedi come SuperHost": username/password
// controllati contro ADMIN_USERNAME/ADMIN_PASSWORD (variabili d'ambiente
// Vercel), non contro un utente nel DB. Se corrette, imposta il cookie di
// sessione firmato che il middleware verifica per tutta l'area /admin.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { username?: string; password?: string }
    | null;

  if (!body?.username || !body?.password) {
    return NextResponse.json({ error: "Username e password richiesti." }, { status: 400 });
  }

  if (!verifyHostCredentials(body.username, body.password)) {
    return NextResponse.json({ error: "Credenziali non valide." }, { status: 401 });
  }

  const sessionValue = await createHostSessionValue();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(HOST_SESSION_COOKIE, sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: HOST_SESSION_MAX_AGE_SECONDS,
  });
  // Le due sessioni (guest e SuperHost) sono mutuamente esclusive: se prima
  // avevi fatto accesso come guest, l'accesso come SuperHost ti disconnette
  // da quella sessione (evita stati ambigui con entrambi i cookie attivi).
  res.cookies.delete(GUEST_SESSION_COOKIE);
  return res;
}
