import { NextRequest, NextResponse } from "next/server";
import { isEvaluationAdmin } from "@/lib/evaluacion-docente/admin-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Correo y contraseña son obligatorios." },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return NextResponse.json(
        { error: "Credenciales inválidas." },
        { status: 401 }
      );
    }

    if (!isEvaluationAdmin(data.user)) {
      // Local scope ends only this session: the Auth project is shared with other modules.
      await supabase.auth.signOut({ scope: "local" });
      return NextResponse.json(
        { error: "Esta cuenta no tiene acceso a este módulo." },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "No se pudo procesar la solicitud." },
      { status: 500 }
    );
  }
}
