import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasGateAccess } from "@/lib/evaluacion-docente/gate";

export async function POST(request: NextRequest) {
  if (!hasGateAccess(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { sectionId } = await request.json();
  if (!sectionId) {
    return NextResponse.json({ error: "sectionId es obligatorio." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: section, error: sectionError } = await supabase
    .from("sections")
    .select("*")
    .eq("id", sectionId)
    .eq("is_active", true)
    .single();

  if (sectionError || !section) {
    return NextResponse.json({ error: "Sección no encontrada." }, { status: 404 });
  }

  const { data: assignments, error: assignmentsError } = await supabase
    .from("assignments")
    .select("teachers!inner(*)")
    .eq("section_id", sectionId)
    .eq("teachers.is_active", true);

  if (assignmentsError) {
    return NextResponse.json({ error: assignmentsError.message }, { status: 500 });
  }

  const teachers = assignments.map((a) => a.teachers).filter(Boolean);

  if (teachers.length === 0) {
    return NextResponse.json(
      { error: "Esta sección no tiene docentes asignados." },
      { status: 409 }
    );
  }

  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select("*")
    .eq("is_active", true)
    .order("order_index");

  if (questionsError) {
    return NextResponse.json({ error: questionsError.message }, { status: 500 });
  }

  if (!questions || questions.length === 0) {
    return NextResponse.json(
      { error: "No hay preguntas activas configuradas." },
      { status: 409 }
    );
  }

  const { data: run, error: runError } = await supabase
    .from("evaluation_runs")
    .insert({ section_id: sectionId })
    .select()
    .single();

  if (runError) {
    return NextResponse.json({ error: runError.message }, { status: 500 });
  }

  return NextResponse.json({
    runId: run.id,
    section,
    teachers,
    questions,
  });
}
