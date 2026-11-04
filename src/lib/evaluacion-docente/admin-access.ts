import type { User } from "@supabase/supabase-js";

type EvaluationAdminCandidate = Partial<Pick<User, "email" | "email_confirmed_at">>;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/**
 * Decides whether a user may access evaluation admin.
 *
 * Evaluation admin handlers use the service-role client, and the Auth project is
 * shared with other modules, so being authenticated is not enough. Access requires
 * a confirmed email that exactly matches an entry of the server-only, comma-separated
 * EVAL_ADMIN_EMAILS variable. A missing or empty variable denies everyone.
 */
export function isEvaluationAdmin(user: EvaluationAdminCandidate | null | undefined) {
  if (!user?.email || !user.email_confirmed_at) {
    return false;
  }

  const allowlist = (process.env.EVAL_ADMIN_EMAILS ?? "")
    .split(",")
    .map(normalizeEmail)
    .filter(Boolean);

  return allowlist.includes(normalizeEmail(user.email));
}
