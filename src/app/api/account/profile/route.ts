import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, verifySessionValue } from "@/lib/guestAuth";

export const dynamic = "force-dynamic";

function getSessionEmail(req: NextRequest): string | null {
  return verifySessionValue(req.cookies.get(SESSION_COOKIE)?.value);
}

// GET /api/account/profile — dati del profilo dell'ospite loggato. Se non
// ha ancora salvato nulla (primo accesso), torna campi vuoti invece di 404:
// la pagina /account mostra comunque il form, pronto da compilare.
export async function GET(req: NextRequest) {
  const email = getSessionEmail(req);
  if (!email) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const profile = await prisma.guestProfile.findUnique({ where: { email } });

  return NextResponse.json({
    email,
    name: profile?.name ?? "",
    surname: profile?.surname ?? "",
    phone: profile?.phone ?? "",
    address: profile?.address ?? "",
    zip: profile?.zip ?? "",
    city: profile?.city ?? "",
  });
}

interface UpdateBody {
  name?: string;
  surname?: string;
  phone?: string;
  address?: string;
  zip?: string;
  city?: string;
}

// PUT /api/account/profile — crea/aggiorna il profilo (upsert: al primo
// salvataggio la riga in GuestProfile ancora non esiste).
export async function PUT(req: NextRequest) {
  const email = getSessionEmail(req);
  if (!email) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as UpdateBody | null;
  if (!body) {
    return NextResponse.json({ error: "Corpo della richiesta non valido." }, { status: 400 });
  }

  const data = {
    name: (body.name ?? "").trim(),
    surname: (body.surname ?? "").trim(),
    phone: (body.phone ?? "").trim(),
    address: (body.address ?? "").trim(),
    zip: (body.zip ?? "").trim(),
    city: (body.city ?? "").trim(),
  };

  const profile = await prisma.guestProfile.upsert({
    where: { email },
    create: { email, ...data },
    update: data,
  });

  return NextResponse.json({
    email: profile.email,
    name: profile.name,
    surname: profile.surname,
    phone: profile.phone,
    address: profile.address,
    zip: profile.zip,
    city: profile.city,
  });
}
