import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { POST } from "./route";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

const LOGIN_URL = "http://localhost:3000/api/admisiones-admin/login";
const EMAIL = "persona@example.com";
const PASSWORD = "contrasena-secreta";
const CREDENTIALS = { email: EMAIL, password: PASSWORD };
const MAX_BODY_BYTES = 4 * 1024;

const signInWithPassword = vi.fn();
const signOut = vi.fn();
const rpc = vi.fn();

function rawRequest(body: string, headers?: Record<string, string>) {
  return new NextRequest(LOGIN_URL, { method: "POST", body, headers });
}

function loginRequest(body: unknown) {
  return rawRequest(JSON.stringify(body));
}

function signInSucceeds() {
  signInWithPassword.mockResolvedValue({
    data: { user: { id: "user-1", email: EMAIL } },
    error: null,
  });
}

describe("POST /api/admisiones-admin/login", () => {
  beforeEach(() => {
    signInWithPassword.mockReset();
    signOut.mockReset().mockResolvedValue({ error: null });
    rpc.mockReset();
    vi.mocked(createSupabaseServerClient).mockReset().mockResolvedValue({
      auth: { signInWithPassword, signOut },
      rpc,
    } as never);
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(["admin", "admissions_manager", "admissions_agent", "admissions_viewer"])(
    "keeps the session of a user with role %s",
    async (role) => {
      signInSucceeds();
      rpc.mockResolvedValue({ data: role, error: null });

      const result = await POST(loginRequest(CREDENTIALS));

      expect(result.status).toBe(200);
      expect(await result.json()).toEqual({ success: true });
      expect(signInWithPassword).toHaveBeenCalledWith(CREDENTIALS);
      expect(signOut).not.toHaveBeenCalled();
    }
  );

  describe("signed in without a role", () => {
    it.each([
      ["no active role", { data: null, error: null }],
      ["an unknown role", { data: "superuser", error: null }],
      ["a failed role lookup", { data: null, error: { code: "PGRST301" } }],
    ])("ends only this session and answers 403 with %s", async (_label, rpcResult) => {
      signInSucceeds();
      rpc.mockResolvedValue(rpcResult);

      const result = await POST(loginRequest(CREDENTIALS));

      expect(result.status).toBe(403);
      expect(await result.json()).not.toHaveProperty("success");
      expect(signOut).toHaveBeenCalledTimes(1);
      expect(signOut).toHaveBeenCalledWith({ scope: "local" });
    });

    it("still answers 403 when sign-out reports an error", async () => {
      signInSucceeds();
      rpc.mockResolvedValue({ data: null, error: null });
      signOut.mockResolvedValue({ error: new Error("network") });

      const result = await POST(loginRequest(CREDENTIALS));

      expect(result.status).toBe(403);
    });

    it("does not grant access when sign-out throws", async () => {
      signInSucceeds();
      rpc.mockResolvedValue({ data: null, error: null });
      signOut.mockRejectedValue(new Error("network"));

      const result = await POST(loginRequest(CREDENTIALS));

      expect(result.status).toBe(500);
      expect(await result.json()).not.toHaveProperty("success");
    });
  });

  describe("bad credentials", () => {
    it("answers 401 without looking up a role or signing out", async () => {
      signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: new Error("Invalid login credentials"),
      });

      const result = await POST(loginRequest(CREDENTIALS));

      expect(result.status).toBe(401);
      expect(rpc).not.toHaveBeenCalled();
      expect(signOut).not.toHaveBeenCalled();
    });

    it("uses one message whatever reason the provider gave", async () => {
      const messages: string[] = [];
      for (const reason of ["Invalid login credentials", "Email not confirmed", "User banned"]) {
        signInWithPassword.mockResolvedValue({ data: { user: null }, error: new Error(reason) });
        const result = await POST(loginRequest(CREDENTIALS));
        messages.push((await result.json()).error);
      }

      expect(new Set(messages).size).toBe(1);
      expect(messages[0]).toBe("Credenciales inválidas.");
    });

    it("answers 401 when sign-in returns neither a user nor an error", async () => {
      signInWithPassword.mockResolvedValue({ data: { user: null }, error: null });

      const result = await POST(loginRequest(CREDENTIALS));

      expect(result.status).toBe(401);
    });
  });

  describe("invalid body", () => {
    it.each([
      ["malformed JSON", "{no es json"],
      ["an empty body", ""],
      ["a JSON array", "[]"],
      ["JSON null", "null"],
      ["a missing password", JSON.stringify({ email: EMAIL })],
      ["a missing email", JSON.stringify({ password: PASSWORD })],
      ["an empty email", JSON.stringify({ email: "", password: PASSWORD })],
      ["an empty password", JSON.stringify({ email: EMAIL, password: "" })],
      ["a non-string email", JSON.stringify({ email: { $ne: "" }, password: PASSWORD })],
      ["a non-string password", JSON.stringify({ email: EMAIL, password: 12345678 })],
    ])("answers 400 for %s", async (_label, body) => {
      const result = await POST(rawRequest(body));

      expect(result.status).toBe(400);
      expect(createSupabaseServerClient).not.toHaveBeenCalled();
      expect(signInWithPassword).not.toHaveBeenCalled();
    });

    it("answers 400 for a body over the limit", async () => {
      const body = JSON.stringify({ email: EMAIL, password: "x".repeat(MAX_BODY_BYTES) });

      const result = await POST(rawRequest(body));

      expect(result.status).toBe(400);
      expect(signInWithPassword).not.toHaveBeenCalled();
    });

    it("answers 400 when the declared length is over the limit", async () => {
      const result = await POST(
        rawRequest(JSON.stringify(CREDENTIALS), { "content-length": String(MAX_BODY_BYTES + 1) })
      );

      expect(result.status).toBe(400);
      expect(signInWithPassword).not.toHaveBeenCalled();
    });

    it("still enforces the limit when the declared length understates the body", async () => {
      const body = JSON.stringify({ email: EMAIL, password: "x".repeat(MAX_BODY_BYTES) });

      const result = await POST(rawRequest(body, { "content-length": "10" }));

      expect(result.status).toBe(400);
      expect(signInWithPassword).not.toHaveBeenCalled();
    });
  });

  it("answers a generic 500 when the provider throws", async () => {
    signInWithPassword.mockRejectedValue(new Error(`boom ${EMAIL}`));

    const result = await POST(loginRequest(CREDENTIALS));

    expect(result.status).toBe(500);
    expect(JSON.stringify(await result.json())).not.toContain(EMAIL);
  });

  it("never logs the email or the password", async () => {
    signInSucceeds();
    rpc.mockResolvedValue({ data: null, error: { code: "PGRST301", message: EMAIL } });
    signOut.mockRejectedValue(new Error(PASSWORD));

    await POST(loginRequest(CREDENTIALS));

    const logged = JSON.stringify([
      ...vi.mocked(console.error).mock.calls,
      ...vi.mocked(console.warn).mock.calls,
      ...vi.mocked(console.log).mock.calls,
    ]);
    expect(logged).not.toContain(EMAIL);
    expect(logged).not.toContain(PASSWORD);
  });
});
