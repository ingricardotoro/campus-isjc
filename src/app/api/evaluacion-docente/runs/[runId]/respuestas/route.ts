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
  const { teacherId, questionId, score, totalExpected } = await request.json();

  if (!teacherId || !questionId || ![1, 2, 3, 4].includes(score)) {
    return NextResponse.json({ error: "Datos de respuesta inválidos." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { error: upsertError } = await supabase
    .from("evaluation_answers")
    .upsert(
      { run_id: runId, teacher_id: teacherId, question_id: questionId, score },
      { onConflict: "run_id,teacher_id,question_id" }
    );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  if (typeof totalExpected !== "number") {
    return NextResponse.json({ done: false });
  }

  const { count, error: countError } = await supabase
    .from("evaluation_answers")
    .select("id", { count: "exact", head: true })
    .eq("run_id", runId);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  const done = (count ?? 0) >= totalExpected;

  if (done) {
    await supabase
      .from("evaluation_runs")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", runId);
  }

  return NextResponse.json({ done });
}
