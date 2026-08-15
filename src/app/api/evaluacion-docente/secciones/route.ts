import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasGateAccess } from "@/lib/evaluacion-docente/gate";

export async function GET(request: NextRequest) {
  if (!hasGateAccess(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: sections, error: sectionsError } = await supabase
    .from("sections")
    .select("*")
    .eq("is_active", true)
    .order("grade")
    .order("section_letter");

  if (sectionsError) {
    return NextResponse.json({ error: sectionsError.message }, { status: 500 });
  }

  const { data: assignments, error: assignmentsError } = await supabase
    .from("assignments")
    .select("section_id, teachers!inner(is_active)")
    .eq("teachers.is_active", true);

  if (assignmentsError) {
    return NextResponse.json({ error: assignmentsError.message }, { status: 500 });
  }

  const sectionIdsWithTeachers = new Set(assignments.map((a) => a.section_id));
  const availableSections = sections.filter((section) => sectionIdsWithTeachers.has(section.id));

  return NextResponse.json({ sections: availableSections });
}
