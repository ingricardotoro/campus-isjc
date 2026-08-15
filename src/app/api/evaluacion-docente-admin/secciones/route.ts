import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("sections")
    .select("*")
    .order("grade", { ascending: true })
    .order("section_letter", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sections: data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const grade = typeof body.grade === "string" ? body.grade.trim() : "";
  const sectionLetter =
    typeof body.section_letter === "string" ? body.section_letter.trim().toUpperCase() : "";

  if (!grade || !sectionLetter) {
    return NextResponse.json(
      { error: "El grado y la letra de sección son obligatorios." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("sections")
    .insert({ grade, section_letter: sectionLetter, is_active: body.is_active ?? true })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: `La sección ${grade}${sectionLetter} ya existe.` },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ section: data }, { status: 201 });
}
