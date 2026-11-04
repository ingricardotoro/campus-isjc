import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { POST } from "./route";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

const CONFIRMED_AT = "2026-01-01T00:00:00Z";
const ADMIN_EMAIL = "admin@example.com";
const NON_ADMIN_EMAIL = "other@example.com";
const CREDENTIALS = { email: ADMIN_EMAIL, password: "secret" };

const signInWithPassword = vi.fn();
const signOut = vi.fn();

function loginRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/evaluacion-docente-admin/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function signInSucceedsAs(email: string, emailConfirmedAt: string | null = CONFIRMED_AT) {
  signInWithPassword.mockResolvedValue({
    data: { user: { email, email_confirmed_at: emailConfirmedAt } },
    error: null,
  });
}

describe("POST /api/evaluacion-docente-admin/login", () => {
  beforeEach(() => {
    signInWithPassword.mockReset();
    signOut.mockReset().mockResolvedValue({ error: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { signInWithPassword, signOut },
    } as never);
    vi.stubEnv("EVAL_ADMIN_EMAILS", ADMIN_EMAIL);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps the session of an allowlisted admin", async () => {
    signInSucceedsAs(ADMIN_EMAIL);

    const result = await POST(loginRequest(CREDENTIALS));

    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ success: true });
    expect(signOut).not.toHaveBeenCalled();
  });

  it("signs out a non-admin and answers 403", async () => {
    signInSucceedsAs(NON_ADMIN_EMAIL);

    const result = await POST(loginRequest({ ...CREDENTIALS, email: NON_ADMIN_EMAIL }));

    expect(result.status).toBe(403);
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it("only ends the session just created, not the user's other sessions", async () => {
    signInSucceedsAs(NON_ADMIN_EMAIL);

    await POST(loginRequest({ ...CREDENTIALS, email: NON_ADMIN_EMAIL }));

    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("does not reveal the allowlist in the denial message", async () => {
    signInSucceedsAs(NON_ADMIN_EMAIL);

    const result = await POST(loginRequest({ ...CREDENTIALS, email: NON_ADMIN_EMAIL }));
    const { error } = await result.json();

    expect(error).toEqual(expect.any(String));
    expect(error).not.toContain(ADMIN_EMAIL);
    expect(error.toLowerCase()).not.toContain("lista");
  });

  it("signs out an allowlisted user whose email is not confirmed", async () => {
    signInSucceedsAs(ADMIN_EMAIL, null);

    const result = await POST(loginRequest(CREDENTIALS));

    expect(result.status).toBe(403);
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it("signs out everyone when the allowlist is empty", async () => {
    vi.stubEnv("EVAL_ADMIN_EMAILS", "");
    signInSucceedsAs(ADMIN_EMAIL);

    const result = await POST(loginRequest(CREDENTIALS));

    expect(result.status).toBe(403);
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it("still denies a non-admin when sign-out reports an error", async () => {
    signInSucceedsAs(NON_ADMIN_EMAIL);
    signOut.mockResolvedValue({ error: new Error("network") });

    const result = await POST(loginRequest({ ...CREDENTIALS, email: NON_ADMIN_EMAIL }));

    expect(result.status).toBe(403);
  });

  it("does not grant access when sign-out throws", async () => {
    signInSucceedsAs(NON_ADMIN_EMAIL);
    signOut.mockRejectedValue(new Error("network"));

    const result = await POST(loginRequest({ ...CREDENTIALS, email: NON_ADMIN_EMAIL }));

    expect(result.status).toBe(500);
    expect(await result.json()).not.toHaveProperty("success");
  });

  it("answers 401 on invalid credentials without signing out", async () => {
    signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: new Error("Invalid login credentials"),
    });

    const result = await POST(loginRequest(CREDENTIALS));

    expect(result.status).toBe(401);
    expect(signOut).not.toHaveBeenCalled();
  });

  it("answers 400 when credentials are missing", async () => {
    const result = await POST(loginRequest({ email: ADMIN_EMAIL }));

    expect(result.status).toBe(400);
    expect(signInWithPassword).not.toHaveBeenCalled();
  });
});
