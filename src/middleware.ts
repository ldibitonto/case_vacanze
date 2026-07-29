import { NextRequest, NextResponse } from "next/server";
import { HOST_SESSION_COOKIE, verifyHostSessionValue } from "@/lib/hostAuth";

// Protegge tutta l'area /admin (pagine + API): serve una sessione valida da
// "Accedi come SuperHost" (vedi /admin/login e /api/auth/host-login),
// verificata dal cookie firmato host_session. Sostituisce il precedente
// HTTP Basic Auth nativo del browser con una vera pagina di login in stile
// col resto del sito, così anche il link "Gestione case" nell'header può
// mostrarsi/nascondersi in base allo stato di accesso.
// Le credenziali restano le stesse di prima: ADMIN_USERNAME / ADMIN_PASSWORD.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // La pagina di login resta sempre raggiungibile senza sessione,
  // altrimenti nessuno potrebbe mai autenticarsi.
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const authed = await verifyHostSessionValue(req.cookies.get(HOST_SESSION_COOKIE)?.value);
  if (authed) {
    return NextResponse.next();
  }

  // Le chiamate API rispondono 401 JSON (le legge fetch lato client);
  // le pagine vengono rimandate alla schermata di login.
  if (pathname.startsWith("/api/admin/")) {
    return NextResponse.json({ error: "Accesso richiesto come SuperHost." }, { status: 401 });
  }

  const loginUrl = new URL("/admin/login", req.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
