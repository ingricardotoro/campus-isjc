import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .order("order_index", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ questions: data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const text = typeof body.text === "string" ? body.text.trim() : "";

  if (!text) {
    return NextResponse.json({ error: "El texto de la pregunta es obligatorio." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: maxRow } = await supabase
    .from("questions")
    .select("order_index")
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (maxRow?.order_index ?? 0) + 1;

  const { data, error } = await supabase
    .from("questions")
    .insert({ text, order_index: nextOrder, is_active: body.is_active ?? true })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ question: data }, { status: 201 });
}
