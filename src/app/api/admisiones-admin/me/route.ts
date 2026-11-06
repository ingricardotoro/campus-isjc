import { NextResponse } from "next/server";
import { canDelete, canEdit, requireAdmissionsAccess } from "@/lib/admissions/admin-access";
import { noStoreJson } from "@/lib/admissions/admin-queries";
import type { AdmissionsMe } from "@/lib/admissions/admin-record";

/**
 * The current role and what it allows, so the panel can hide actions the user cannot take.
 * It is a display hint only: every write route checks the role again.
 */
export async function GET() {
  const access = await requireAdmissionsAccess();
  if (access instanceof NextResponse) return access;

  const me: AdmissionsMe = {
    role: access.role,
    canEdit: canEdit(access.role),
    canDelete: canDelete(access.role),
  };
  return noStoreJson(me);
}
