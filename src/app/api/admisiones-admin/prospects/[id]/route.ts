import { NextRequest, NextResponse } from "next/server";
import { requireAdmissionsAccess } from "@/lib/admissions/admin-access";
import {
  getProspect,
  isValidProspectId,
  noStoreJson,
  queryFailureResponse,
} from "@/lib/admissions/admin-queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireAdmissionsAccess();
  if (access instanceof NextResponse) return access;

  const { id } = await params;
  if (!isValidProspectId(id)) {
    return noStoreJson({ error: "Identificador inválido." }, 400);
  }

  try {
    const prospect = await getProspect(access.supabase, id);
    if (!prospect) {
      return noStoreJson({ error: "Prospecto no encontrado." }, 404);
    }
    return noStoreJson(prospect);
  } catch (error) {
    return queryFailureResponse(error);
  }
}
