import { NextRequest, NextResponse } from "next/server";
import { HOST_SESSION_COOKIE, verifyHostSessionValue } from "@/lib/hostAuth";

// GET /api/auth/host-me — usata dall'header (client component) per sapere
// se mostrare il link "Gestione case": visibile solo con una sessione
// SuperHost valida, non a chiunque visiti il sito.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const loggedIn = await verifyHostSessionValue(req.cookies.get(HOST_SESSION_COOKIE)?.value);
  return NextResponse.json({ loggedIn });
}
