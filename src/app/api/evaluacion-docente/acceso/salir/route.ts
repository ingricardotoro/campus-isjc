import { NextResponse } from "next/server";
import { GATE_COOKIE } from "@/lib/evaluacion-docente/gate";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(GATE_COOKIE, "", { maxAge: 0, path: "/" });
  return response;
}
