import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionValue } from "@/lib/guestAuth";

// GET /api/auth/me — usata dall'header (client component) per sapere se
// c'è un ospite loggato e mostrare "Bentornato" invece del pulsante di
// accesso. Il cookie è httpOnly quindi il client non può leggerlo da solo.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const email = verifySessionValue(req.cookies.get(SESSION_COOKIE)?.value);
  return NextResponse.json({ email });
}
