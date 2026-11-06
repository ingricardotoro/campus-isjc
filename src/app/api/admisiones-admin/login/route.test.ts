import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  AuthApiError,
  AuthInvalidTokenResponseError,
  AuthRetryableFetchError,
  AuthUnknownError,
} from "@supabase/supabase-js";
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
const BAD_CREDENTIALS_MESSAGE = "Credenciales inválidas.";
const RATE_LIMITED_MESSAGE = "Demasiados intentos. Espere unos minutos e intente de nuevo.";
const UNAVAILABLE_MESSAGE =
  "El servicio no está disponible en este momento. Intente de nuevo más tarde.";
const NO_ACCESS_MESSAGE = "Esta cuenta no tiene acceso a este módulo.";

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

function signInFailsWith(error: unknown) {
  signInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error });
}

function loggedText() {
  return JSON.stringify([
    ...vi.mocked(console.error).mock.calls,
    ...vi.mocked(console.warn).mock.calls,
    ...vi.mocked(console.log).mock.calls,
  ]);
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
    ])("ends only this session and answers 403 with %s", async (_label, rpcResult) => {
      signInSucceeds();
      rpc.mockResolvedValue(rpcResult);

      const result = await POST(loginRequest(CREDENTIALS));

      expect(result.status).toBe(403);
      expect(await result.json()).toEqual({ error: NO_ACCESS_MESSAGE });
      expect(signOut).toHaveBeenCalledTimes(1);
      expect(signOut).toHaveBeenCalledWith({ scope: "local" });
    });

    it("still answers 403 and logs only the code when sign-out reports an error", async () => {
      signInSucceeds();
      rpc.mockResolvedValue({ data: null, error: null });
      signOut.mockResolvedValue({ error: new AuthApiError(EMAIL, 502, "unexpected_failure") });

      const result = await POST(loginRequest(CREDENTIALS));

      expect(result.status).toBe(403);
      expect(await result.json()).toEqual({ error: NO_ACCESS_MESSAGE });
      expect(loggedText()).toContain("unexpected_failure");
      expect(loggedText()).not.toContain(EMAIL);
    });

    it("still answers 403 and logs no raw error when sign-out throws", async () => {
      signInSucceeds();
      rpc.mockResolvedValue({ data: null, error: null });
      signOut.mockRejectedValue(new Error(EMAIL));

      const result = await POST(loginRequest(CREDENTIALS));

      expect(result.status).toBe(403);
      expect(await result.json()).toEqual({ error: NO_ACCESS_MESSAGE });
      expect(console.error).toHaveBeenCalled();
      expect(vi.mocked(console.error).mock.calls.flat().some((v) => v instanceof Error)).toBe(false);
      expect(loggedText()).not.toContain(EMAIL);
    });

    it("does not log when sign-out succeeds", async () => {
      signInSucceeds();
      rpc.mockResolvedValue({ data: null, error: null });

      await POST(loginRequest(CREDENTIALS));

      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe("role lookup failure", () => {
    it.each([
      ["an RPC error", () => rpc.mockResolvedValue({ data: null, error: { code: "PGRST301" } })],
      [
        "an RPC error next to a role",
        () => rpc.mockResolvedValue({ data: "admin", error: { code: "PGRST301" } }),
      ],
      ["a rejected call", () => rpc.mockRejectedValue(new Error("network"))],
    ])("ends only this session and answers 503 on %s", async (_label, arrange) => {
      signInSucceeds();
      arrange();

      const result = await POST(loginRequest(CREDENTIALS));

      expect(result.status).toBe(503);
      expect(await result.json()).toEqual({ error: UNAVAILABLE_MESSAGE });
      expect(signOut).toHaveBeenCalledTimes(1);
      expect(signOut).toHaveBeenCalledWith({ scope: "local" });
    });

    it.each([
      [
        "reports an error",
        () => signOut.mockResolvedValue({ error: new AuthApiError("x", 500, "z") }),
      ],
      ["throws", () => signOut.mockRejectedValue(new Error("network"))],
    ])("still answers 503 when sign-out %s", async (_label, arrange) => {
      signInSucceeds();
      rpc.mockResolvedValue({ data: null, error: { code: "PGRST301" } });
      arrange();

      const result = await POST(loginRequest(CREDENTIALS));

      expect(result.status).toBe(503);
      expect(await result.json()).toEqual({ error: UNAVAILABLE_MESSAGE });
    });
  });

  describe("bad credentials", () => {
    it("answers 401 without looking up a role or signing out", async () => {
      signInFailsWith(new AuthApiError("Invalid login credentials", 400, "invalid_credentials"));

      const result = await POST(loginRequest(CREDENTIALS));

      expect(result.status).toBe(401);
      expect(rpc).not.toHaveBeenCalled();
      expect(signOut).not.toHaveBeenCalled();
    });

    it("gives one status and message whatever the state of the account", async () => {
      const answers: string[] = [];
      for (const [status, code] of [
        [400, "invalid_credentials"],
        [400, "email_not_confirmed"],
        [400, "user_banned"],
        [403, "user_banned"],
        [404, "user_not_found"],
        [422, "validation_failed"],
      ] as const) {
        signInFailsWith(new AuthApiError(`${EMAIL} ${code}`, status, code));
        const result = await POST(loginRequest(CREDENTIALS));
        answers.push(`${result.status} ${(await result.json()).error}`);
      }

      expect(new Set(answers)).toEqual(new Set([`401 ${BAD_CREDENTIALS_MESSAGE}`]));
      expect(loggedText()).not.toContain(EMAIL);
    });

    it("answers 401 when sign-in returns neither a user nor an error", async () => {
      signInWithPassword.mockResolvedValue({ data: { user: null }, error: null });

      const result = await POST(loginRequest(CREDENTIALS));

      expect(result.status).toBe(401);
    });
  });

  describe("provider failures, which never read as a wrong password", () => {
    it.each([
      ["a rate limit by code", new AuthApiError("slow", 429, "over_request_rate_limit")],
      ["a rate limit without a code", new AuthApiError("slow", 429, undefined)],
      ["a rate limit under a credential code", new AuthApiError("slow", 429, "invalid_credentials")],
    ])("answers 429 on %s, without a role lookup", async (_label, error) => {
      signInFailsWith(error);

      const result = await POST(loginRequest(CREDENTIALS));

      expect(result.status).toBe(429);
      expect(await result.json()).toEqual({ error: RATE_LIMITED_MESSAGE });
      expect(rpc).not.toHaveBeenCalled();
      expect(signOut).not.toHaveBeenCalled();
    });

    it.each([
      ["no response from the server", new AuthRetryableFetchError("fetch failed", 0)],
      ["a gateway failure", new AuthRetryableFetchError("bad gateway", 502)],
      ["an API 500", new AuthApiError("boom", 500, "unexpected_failure")],
      ["a response that could not be parsed", new AuthUnknownError("bad json", new Error("x"))],
      ["a token response without a session", new AuthInvalidTokenResponseError()],
      ["a request timeout code on a 504", new AuthApiError("slow", 504, "request_timeout")],
      ["an unrecognized 4xx code", new AuthApiError("no", 400, "captcha_failed")],
      ["a 4xx without a code", new AuthApiError("no", 400, undefined)],
      ["a credential code on a 5xx", new AuthApiError("no", 500, "invalid_credentials")],
      ["a credential code without a status", { code: "invalid_credentials" }],
      ["a plain error", new Error("Invalid login credentials")],
    ])("answers a generic 503 on %s", async (_label, error) => {
      signInFailsWith(error);

      const result = await POST(loginRequest(CREDENTIALS));

      expect(result.status).toBe(503);
      expect(await result.json()).toEqual({ error: UNAVAILABLE_MESSAGE });
      expect(rpc).not.toHaveBeenCalled();
      expect(signOut).not.toHaveBeenCalled();
    });

    it("answers a failure next to a user as a failure, never as success", async () => {
      signInWithPassword.mockResolvedValue({
        data: { user: { id: "user-1", email: EMAIL } },
        error: new AuthRetryableFetchError("fetch failed", 0),
      });
      rpc.mockResolvedValue({ data: "admin", error: null });

      const result = await POST(loginRequest(CREDENTIALS));

      expect(result.status).toBe(503);
      expect(await result.json()).not.toHaveProperty("success");
    });

    it.each([
      [new AuthApiError(`slow ${EMAIL}`, 429, "over_request_rate_limit"), "over_request_rate_limit"],
      [new AuthRetryableFetchError(`down ${EMAIL} ${PASSWORD}`, 502), "502"],
    ])("logs only the code or status", async (error, expected) => {
      signInFailsWith(error);

      await POST(loginRequest(CREDENTIALS));

      expect(loggedText()).toContain(expected);
      expect(loggedText()).not.toContain(EMAIL);
      expect(loggedText()).not.toContain(PASSWORD);
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

    expect(loggedText()).not.toContain(EMAIL);
    expect(loggedText()).not.toContain(PASSWORD);
  });
});
