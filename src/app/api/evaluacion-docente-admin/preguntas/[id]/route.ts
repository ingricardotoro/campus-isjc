import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if (typeof body.text === "string") {
    const text = body.text.trim();
    if (!text) {
      return NextResponse.json({ error: "El texto de la pregunta es obligatorio." }, { status: 400 });
    }
    updates.text = text;
  }
  if (typeof body.is_active === "boolean") updates.is_active = body.is_active;
  if (typeof body.order_index === "number") updates.order_index = body.order_index;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("questions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ question: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase.from("questions").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar: esta pregunta ya tiene respuestas registradas. Desactívala en su lugar.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
