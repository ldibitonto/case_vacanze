import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_COOKIE_MAX_AGE_SECONDS, createSessionValue, verifyLoginToken } from "@/lib/guestAuth";

// GET /api/auth/verify?token=... — destinazione del link ricevuto via mail.
// Verifica la firma/scadenza del token, imposta il cookie di sessione (che
// usa la stessa logica di firma, solo con validità più lunga) e reindirizza
// alla home. Se il token non è valido/è scaduto, reindirizza comunque alla
// home ma senza impostare alcun cookie: niente pagina di errore dedicata,
// l'utente può semplicemente richiedere un nuovo link.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const email = token ? verifyLoginToken(token) : null;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;

  const redirectUrl = new URL("/", baseUrl);
  if (!email) {
    redirectUrl.searchParams.set("login", "expired");
  }

  const res = NextResponse.redirect(redirectUrl);

  if (email) {
    res.cookies.set(SESSION_COOKIE, createSessionValue(email), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
    });
  }

  return res;
}
