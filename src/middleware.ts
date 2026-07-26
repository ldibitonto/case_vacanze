import { NextRequest, NextResponse } from "next/server";

// Protegge tutta l'area /admin (pagine + API) con HTTP Basic Auth: il
// browser mostra il classico popup di login nativo e ricorda le
// credenziali per la sessione. Niente cookie/sessioni da gestire, niente
// pagina di login da costruire — sufficiente per un pannello interno con
// pochi utenti fidati.
// Le credenziali si impostano in .env: ADMIN_USERNAME / ADMIN_PASSWORD.
function isAuthorized(req: NextRequest): boolean {
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;

  // Se le credenziali non sono configurate, neghiamo l'accesso di default
  // invece di lasciare l'area admin aperta per errore.
  if (!expectedUser || !expectedPass) return false;

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) return false;

  const decoded = Buffer.from(authHeader.slice("Basic ".length), "base64").toString("utf-8");
  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex === -1) return false;

  const user = decoded.slice(0, separatorIndex);
  const pass = decoded.slice(separatorIndex + 1);

  return user === expectedUser && pass === expectedPass;
}

export function middleware(req: NextRequest) {
  if (isAuthorized(req)) {
    return NextResponse.next();
  }

  return new NextResponse("Accesso richiesto", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Area amministrazione", charset="UTF-8"',
    },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
