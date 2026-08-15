import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("teachers")
    .select("*")
    .order("full_name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ teachers: data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";

  if (!fullName) {
    return NextResponse.json(
      { error: "El nombre completo es obligatorio." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("teachers")
    .insert({ full_name: fullName, is_active: body.is_active ?? true })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ teacher: data }, { status: 201 });
}
