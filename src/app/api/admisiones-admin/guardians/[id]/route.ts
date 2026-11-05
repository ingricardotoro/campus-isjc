import { NextRequest, NextResponse } from "next/server";
import { canEdit, requireAdmissionsAccess } from "@/lib/admissions/admin-access";
import { forbiddenResponse, patchGuardian } from "@/lib/admissions/admin-mutations";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireAdmissionsAccess();
  if (access instanceof NextResponse) return access;
  if (!canEdit(access.role)) return forbiddenResponse();

  const { id } = await params;
  return patchGuardian(access.supabase, id, request);
}
