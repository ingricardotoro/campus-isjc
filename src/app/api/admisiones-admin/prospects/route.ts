import { NextRequest, NextResponse } from "next/server";
import { requireAdmissionsAccess } from "@/lib/admissions/admin-access";
import {
  listProspects,
  noStoreJson,
  parseProspectListParams,
  queryFailureResponse,
} from "@/lib/admissions/admin-queries";

export async function GET(request: NextRequest) {
  const access = await requireAdmissionsAccess();
  if (access instanceof NextResponse) return access;

  const params = parseProspectListParams(request.nextUrl.searchParams);
  if (!params) {
    return noStoreJson({ error: "Parámetros de consulta inválidos." }, 400);
  }

  try {
    return noStoreJson(await listProspects(access.supabase, params));
  } catch (error) {
    return queryFailureResponse(error);
  }
}
