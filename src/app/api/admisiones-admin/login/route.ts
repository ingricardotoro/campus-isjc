import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveAdmissionsRole } from "@/lib/admissions/admin-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_BODY_BYTES = 4 * 1024;
const INVALID_BODY_MESSAGE = "Correo y contraseña son obligatorios.";

const credentialsSchema = z.object({
  email: z.string().trim().min(1).max(254),
  password: z.string().min(1),
});

/** Reads the body as text, stopping as soon as it exceeds the limit. */
async function readBodyWithLimit(request: NextRequest, limit: number): Promise<string | null> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > limit) return null;
  if (!request.body) return "";

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

function parseCredentials(raw: string | null) {
  if (raw === null) return null;
  try {
    const parsed = credentialsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const credentials = parseCredentials(await readBodyWithLimit(request, MAX_BODY_BYTES));
    if (!credentials) {
      return NextResponse.json({ error: INVALID_BODY_MESSAGE }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword(credentials);

    if (error || !data.user) {
      return NextResponse.json({ error: "Credenciales inválidas." }, { status: 401 });
    }

    if (!(await resolveAdmissionsRole(supabase))) {
      // Local scope ends only this session: the Auth project is shared with other modules.
      await supabase.auth.signOut({ scope: "local" });
      return NextResponse.json(
        { error: "Esta cuenta no tiene acceso a este módulo." },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "No se pudo procesar la solicitud." }, { status: 500 });
  }
}
