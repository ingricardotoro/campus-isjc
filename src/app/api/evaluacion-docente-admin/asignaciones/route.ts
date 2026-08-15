import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("assignments").select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ assignments: data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { teacher_id, section_id } = body;

  if (!teacher_id || !section_id) {
    return NextResponse.json(
      { error: "teacher_id y section_id son obligatorios." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("assignments")
    .insert({ teacher_id, section_id })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Este docente ya está asignado a esta sección." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ assignment: data }, { status: 201 });
}
