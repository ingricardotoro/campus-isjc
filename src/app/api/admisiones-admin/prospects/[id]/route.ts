import { NextRequest, NextResponse } from "next/server";
import { canDelete, canEdit, requireAdmissionsAccess } from "@/lib/admissions/admin-access";
import {
  deleteProspect,
  forbiddenResponse,
  patchProspect,
} from "@/lib/admissions/admin-mutations";
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireAdmissionsAccess();
  if (access instanceof NextResponse) return access;
  if (!canEdit(access.role)) return forbiddenResponse();

  const { id } = await params;
  return patchProspect(access.supabase, id, request);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireAdmissionsAccess();
  if (access instanceof NextResponse) return access;
  if (!canDelete(access.role)) return forbiddenResponse();

  const { id } = await params;
  return deleteProspect(access.supabase, id);
}
