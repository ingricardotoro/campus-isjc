import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasGateAccess } from "@/lib/evaluacion-docente/gate";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  if (!hasGateAccess(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { runId } = await params;
  const { teacherId, comment } = await request.json();

  if (!teacherId) {
    return NextResponse.json({ error: "Datos de comentario inválidos." }, { status: 400 });
  }

  const trimmed = typeof comment === "string" ? comment.trim() : "";
  if (!trimmed) {
    return NextResponse.json({ success: true, skipped: true });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("evaluation_comments")
    .upsert(
      { run_id: runId, teacher_id: teacherId, comment: trimmed },
      { onConflict: "run_id,teacher_id" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
