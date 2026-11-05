import { NextResponse } from "next/server";
import { requireAdmissionsAccess } from "@/lib/admissions/admin-access";
import { loadCatalogs, noStoreJson, queryFailureResponse } from "@/lib/admissions/admin-queries";

export async function GET() {
  const access = await requireAdmissionsAccess();
  if (access instanceof NextResponse) return access;

  try {
    return noStoreJson(await loadCatalogs(access.supabase));
  } catch (error) {
    return queryFailureResponse(error);
  }
}
