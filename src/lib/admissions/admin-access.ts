import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ADMISSIONS_ROLES = [
  "admin",
  "admissions_manager",
  "admissions_agent",
  "admissions_viewer",
] as const;

export type AdmissionsRole = (typeof ADMISSIONS_ROLES)[number];

export type AdmissionsAccess = {
  supabase: SupabaseClient;
  user: User;
  role: AdmissionsRole;
};

function isAdmissionsRole(value: unknown): value is AdmissionsRole {
  return ADMISSIONS_ROLES.includes(value as AdmissionsRole);
}

/**
 * Resolves the role of the user bound to the given session client.
 *
 * Fails closed: an RPC error, NULL, or an unknown value all mean no access (null).
 * Only the error code is logged, because Supabase messages can carry personal data.
 */
export async function resolveAdmissionsRole(
  supabase: Pick<SupabaseClient, "rpc">
): Promise<AdmissionsRole | null> {
  try {
    const { data, error } = await supabase.rpc("admissions_current_role");
    if (error) {
      console.error("[admissions] Role lookup failed:", error.code ?? "unknown");
      return null;
    }
    return isAdmissionsRole(data) ? data : null;
  } catch {
    console.error("[admissions] Role lookup failed:", "exception");
    return null;
  }
}

export function canEdit(role: AdmissionsRole | null): boolean {
  return role === "admin" || role === "admissions_manager" || role === "admissions_agent";
}

export function canDelete(role: AdmissionsRole | null): boolean {
  return role === "admin";
}

/**
 * Permission check for every admissions admin route handler, so that access does not
 * rely on middleware alone. Data access goes through the returned session client so
 * RLS applies; the service-role client must not be used in this area.
 *
 * Returns the access context, or a ready 401/403 response:
 *   const access = await requireAdmissionsAccess();
 *   if (access instanceof NextResponse) return access;
 */
export async function requireAdmissionsAccess(): Promise<AdmissionsAccess | NextResponse> {
  const session = await loadSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const role = await resolveAdmissionsRole(session.supabase);
  if (!role) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  return { ...session, role };
}

/** Fails closed: anything that prevents reading the user counts as no session. */
async function loadSession(): Promise<Omit<AdmissionsAccess, "role"> | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ? { supabase, user } : null;
  } catch {
    return null;
  }
}
