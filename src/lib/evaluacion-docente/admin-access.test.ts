import { afterEach, describe, expect, it, vi } from "vitest";
import { isEvaluationAdmin } from "./admin-access";

const CONFIRMED_AT = "2026-01-01T00:00:00Z";

function confirmedUser(email: string) {
  return { email, email_confirmed_at: CONFIRMED_AT };
}

describe("isEvaluationAdmin", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows a confirmed user on the allowlist", () => {
    vi.stubEnv("EVAL_ADMIN_EMAILS", "admin@example.com");

    expect(isEvaluationAdmin(confirmedUser("admin@example.com"))).toBe(true);
  });

  it("allows any address of a multi-entry allowlist", () => {
    vi.stubEnv("EVAL_ADMIN_EMAILS", "first@example.com,second@example.com");

    expect(isEvaluationAdmin(confirmedUser("second@example.com"))).toBe(true);
  });

  it("denies a user who is not on the allowlist", () => {
    vi.stubEnv("EVAL_ADMIN_EMAILS", "admin@example.com");

    expect(isEvaluationAdmin(confirmedUser("other@example.com"))).toBe(false);
  });

  it("normalizes case and whitespace on both sides", () => {
    vi.stubEnv("EVAL_ADMIN_EMAILS", "  Admin@Example.COM , other@example.com ");

    expect(isEvaluationAdmin(confirmedUser("admin@example.com"))).toBe(true);
    expect(isEvaluationAdmin(confirmedUser(" ADMIN@example.com "))).toBe(true);
  });

  it("denies an allowlisted user whose email is not confirmed", () => {
    vi.stubEnv("EVAL_ADMIN_EMAILS", "admin@example.com");

    expect(isEvaluationAdmin({ email: "admin@example.com" })).toBe(false);
    expect(isEvaluationAdmin({ email: "admin@example.com", email_confirmed_at: "" })).toBe(false);
  });

  it("denies everyone when the variable is missing", () => {
    vi.stubEnv("EVAL_ADMIN_EMAILS", undefined);

    expect(isEvaluationAdmin(confirmedUser("admin@example.com"))).toBe(false);
  });

  it.each(["", "   ", ",", " , , "])("denies everyone when the variable is %j", (value) => {
    vi.stubEnv("EVAL_ADMIN_EMAILS", value);

    expect(isEvaluationAdmin(confirmedUser("admin@example.com"))).toBe(false);
  });

  it("denies addresses that only resemble an allowlisted one", () => {
    vi.stubEnv("EVAL_ADMIN_EMAILS", "admin@example.com");

    expect(isEvaluationAdmin(confirmedUser("admin@example.com.attacker.test"))).toBe(false);
    expect(isEvaluationAdmin(confirmedUser("admin@example.co"))).toBe(false);
    expect(isEvaluationAdmin(confirmedUser("xadmin@example.com"))).toBe(false);
    expect(isEvaluationAdmin(confirmedUser("admin"))).toBe(false);
  });

  it("denies a user without an email even if the allowlist has empty entries", () => {
    vi.stubEnv("EVAL_ADMIN_EMAILS", "admin@example.com,,");

    expect(isEvaluationAdmin({ email_confirmed_at: CONFIRMED_AT })).toBe(false);
    expect(isEvaluationAdmin(confirmedUser(""))).toBe(false);
    expect(isEvaluationAdmin(confirmedUser("   "))).toBe(false);
  });

  it("denies a null user", () => {
    vi.stubEnv("EVAL_ADMIN_EMAILS", "admin@example.com");

    expect(isEvaluationAdmin(null)).toBe(false);
  });
});
