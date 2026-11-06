import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SIGN_OUT_FAILED_MESSAGE = "No se pudo cerrar la sesión.";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    // Local scope ends only this session: the Auth project is shared with other modules.
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) {
      return NextResponse.json({ error: SIGN_OUT_FAILED_MESSAGE }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: SIGN_OUT_FAILED_MESSAGE }, { status: 500 });
  }
}
