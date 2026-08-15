import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if (typeof body.full_name === "string") {
    const fullName = body.full_name.trim();
    if (!fullName) {
      return NextResponse.json(
        { error: "El nombre completo es obligatorio." },
        { status: 400 }
      );
    }
    updates.full_name = fullName;
  }
  if (typeof body.is_active === "boolean") {
    updates.is_active = body.is_active;
  }
  updates.updated_at = new Date().toISOString();

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("teachers")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ teacher: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase.from("teachers").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar: este docente ya tiene evaluaciones registradas. Desactívalo en su lugar.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
