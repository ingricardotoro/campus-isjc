import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { middleware } from "./middleware";

vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: vi.fn(),
}));

const ORIGIN = "http://localhost:3000";
const LOGIN_URL = `${ORIGIN}/evaluacion-docente-admin/login`;
const ADMIN_PAGE = "/evaluacion-docente-admin/docentes";
const ADMIN_API = "/api/evaluacion-docente-admin/docentes";

const ADMIN = { email: "admin@example.com", email_confirmed_at: "2026-01-01T00:00:00Z" };
const NON_ADMIN = { email: "other@example.com", email_confirmed_at: "2026-01-01T00:00:00Z" };

function requestTo(pathname: string) {
  return new NextRequest(`${ORIGIN}${pathname}`);
}

function sessionWith(user: typeof ADMIN | null) {
  const response = NextResponse.next();
  vi.mocked(updateSession).mockResolvedValue({ response, user } as never);
  return response;
}

describe("middleware", () => {
  beforeEach(() => {
    vi.mocked(updateSession).mockReset();
    vi.stubEnv("EVAL_ADMIN_EMAILS", ADMIN.email);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("admin pages", () => {
    it("redirects an unauthenticated visitor to the login page", async () => {
      sessionWith(null);

      const result = await middleware(requestTo(ADMIN_PAGE));

      expect(result.status).toBe(307);
      expect(result.headers.get("location")).toBe(LOGIN_URL);
    });

    it("redirects an authenticated non-admin to the login page", async () => {
      sessionWith(NON_ADMIN);

      const result = await middleware(requestTo(ADMIN_PAGE));

      expect(result.status).toBe(307);
      expect(result.headers.get("location")).toBe(LOGIN_URL);
    });

    it("lets an admin through with the refreshed session response", async () => {
      const response = sessionWith(ADMIN);

      const result = await middleware(requestTo(ADMIN_PAGE));

      expect(result).toBe(response);
    });

    it("protects the admin root page as well", async () => {
      sessionWith(NON_ADMIN);

      const result = await middleware(requestTo("/evaluacion-docente-admin"));

      expect(result.headers.get("location")).toBe(LOGIN_URL);
    });
  });

  describe("admin APIs", () => {
    it("returns 401 to an unauthenticated caller", async () => {
      sessionWith(null);

      const result = await middleware(requestTo(ADMIN_API));

      expect(result.status).toBe(401);
    });

    it("returns 403 JSON to an authenticated non-admin", async () => {
      sessionWith(NON_ADMIN);

      const result = await middleware(requestTo(ADMIN_API));

      expect(result.status).toBe(403);
      expect(result.headers.get("content-type")).toContain("application/json");
      expect(await result.json()).toEqual({ error: "No autorizado" });
    });

    it("lets an admin through with the refreshed session response", async () => {
      const response = sessionWith(ADMIN);

      const result = await middleware(requestTo(ADMIN_API));

      expect(result).toBe(response);
    });
  });

  describe("session cookies on denial", () => {
    it("keeps refreshed cookies on the non-admin redirect", async () => {
      sessionWith(NON_ADMIN).cookies.set("sb-token", "rotated");

      const result = await middleware(requestTo(ADMIN_PAGE));

      expect(result.cookies.get("sb-token")?.value).toBe("rotated");
    });

    it("keeps refreshed cookies on the non-admin 403", async () => {
      sessionWith(NON_ADMIN).cookies.set("sb-token", "rotated");

      const result = await middleware(requestTo(ADMIN_API));

      expect(result.cookies.get("sb-token")?.value).toBe("rotated");
    });
  });

  describe("exemptions", () => {
    it.each(["/evaluacion-docente-admin/login", "/api/evaluacion-docente-admin/login"])(
      "does not gate %s, so a signed-in non-admin cannot loop",
      async (pathname) => {
        sessionWith(NON_ADMIN);

        const result = await middleware(requestTo(pathname));

        expect(updateSession).not.toHaveBeenCalled();
        expect(result.status).toBe(200);
        expect(result.headers.get("location")).toBeNull();
      }
    );

    it("does not gate paths outside evaluation admin", async () => {
      const result = await middleware(requestTo("/admisiones-2027"));

      expect(updateSession).not.toHaveBeenCalled();
      expect(result.status).toBe(200);
    });
  });

  it("denies an otherwise valid user when the allowlist is empty", async () => {
    vi.stubEnv("EVAL_ADMIN_EMAILS", "");
    sessionWith(ADMIN);

    const result = await middleware(requestTo(ADMIN_API));

    expect(result.status).toBe(403);
  });
});
