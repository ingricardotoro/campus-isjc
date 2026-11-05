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

export type AdmissionsRoleLookup =
  | { status: "role"; role: AdmissionsRole }
  | { status: "none" }
  | { status: "failed" };

export type AdmissionsAccess = {
  supabase: SupabaseClient;
  user: User;
  role: AdmissionsRole;
};

function isAdmissionsRole(value: unknown): value is AdmissionsRole {
  return ADMISSIONS_ROLES.includes(value as AdmissionsRole);
}

/**
 * Looks up the role of the user bound to the given session client, keeping an outage
 * apart from a real absence of a role so that a caller can tell the user to retry.
 *
 * NULL or an unknown value mean no role. An RPC error is a failure, even next to data.
 * Only the error code is logged, because Supabase messages can carry personal data.
 */
export async function lookupAdmissionsRole(
  supabase: Pick<SupabaseClient, "rpc">
): Promise<AdmissionsRoleLookup> {
  try {
    const { data, error } = await supabase.rpc("admissions_current_role");
    if (error) {
      console.error("[admissions] Role lookup failed:", error.code ?? "unknown");
      return { status: "failed" };
    }
    return isAdmissionsRole(data) ? { status: "role", role: data } : { status: "none" };
  } catch {
    console.error("[admissions] Role lookup failed:", "exception");
    return { status: "failed" };
  }
}

/** Fails closed: anything other than a role, including a failed lookup, means no access (null). */
export async function resolveAdmissionsRole(
  supabase: Pick<SupabaseClient, "rpc">
): Promise<AdmissionsRole | null> {
  const lookup = await lookupAdmissionsRole(supabase);
  return lookup.status === "role" ? lookup.role : null;
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
