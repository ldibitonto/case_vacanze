import { NextRequest, NextResponse } from "next/server";
import { createLoginToken } from "@/lib/guestAuth";
import { sendGuestLoginEmail } from "@/lib/email";

// POST /api/auth/request-login { email }
// "Accedi come guest": genera un link firmato (nessuna password, nessuna
// tabella di sessioni) e lo manda via mail. Risponde sempre con successo
// anche se l'invio fallisce/la mail non è configurata, per non rivelare a
// chi indovina indirizzi a caso se una mail "esiste" o meno nel sistema —
// qui non ha nemmeno senso dato che chiunque può accedere con qualunque
// mail, ma è comunque la forma corretta per un endpoint di login.
export const dynamic = "force-dynamic";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.trim().toLowerCase();

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Inserisci un indirizzo email valido." }, { status: 400 });
  }

  const token = createLoginToken(email);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const loginUrl = `${baseUrl}/api/auth/verify?token=${encodeURIComponent(token)}`;

  const result = await sendGuestLoginEmail({ to: email, loginUrl });

  // In sviluppo (niente RESEND_API_KEY) il link finisce solo nei log del
  // server: lo rimandiamo anche nella risposta, comodo per testare senza
  // dover configurare la mail. In produzione non lo esponiamo mai.
  return NextResponse.json({
    ok: true,
    devLoginUrl: !result.sent && process.env.NODE_ENV !== "production" ? loginUrl : undefined,
  });
}
