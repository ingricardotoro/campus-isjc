import { NextRequest, NextResponse } from "next/server";
import { GATE_COOKIE } from "@/lib/evaluacion-docente/gate";

const GATE_MAX_AGE_SECONDS = 60 * 60 * 2; // 2 horas, suficiente para una sesión de laboratorio

export async function POST(request: NextRequest) {
  const { passphrase } = await request.json();
  const expected = process.env.EVAL_DOCENTE_PASSPHRASE || "Alianza";

  if (typeof passphrase !== "string" || passphrase !== expected) {
    return NextResponse.json({ error: "Clave incorrecta." }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(GATE_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: GATE_MAX_AGE_SECONDS,
    path: "/",
  });

  return response;
}
