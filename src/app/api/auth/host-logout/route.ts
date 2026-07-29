import { NextResponse } from "next/server";
import { HOST_SESSION_COOKIE } from "@/lib/hostAuth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(HOST_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
