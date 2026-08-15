import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if (typeof body.grade === "string" && body.grade.trim()) updates.grade = body.grade.trim();
  if (typeof body.section_letter === "string" && body.section_letter.trim()) {
    updates.section_letter = body.section_letter.trim().toUpperCase();
  }
  if (typeof body.is_active === "boolean") updates.is_active = body.is_active;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("sections")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Ya existe una sección con ese grado y letra." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ section: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase.from("sections").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar: esta sección ya tiene evaluaciones registradas. Desactívala en su lugar.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
