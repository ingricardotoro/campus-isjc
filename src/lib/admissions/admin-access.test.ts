import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  canDelete,
  canEdit,
  requireAdmissionsAccess,
  resolveAdmissionsRole,
  type AdmissionsRole,
} from "./admin-access";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

const USER = { id: "user-1", email: "persona@example.com" };
const ROLES: AdmissionsRole[] = [
  "admin",
  "admissions_manager",
  "admissions_agent",
  "admissions_viewer",
];

const rpc = vi.fn();
const getUser = vi.fn();
const client = () => ({ rpc }) as never;

function roleIs(data: unknown) {
  rpc.mockResolvedValue({ data, error: null });
}

describe("admissions admin access", () => {
  beforeEach(() => {
    rpc.mockReset();
    getUser.mockReset();
    vi.mocked(createAdminClient).mockReset();
    vi.mocked(createSupabaseServerClient).mockReset().mockResolvedValue({
      auth: { getUser },
      rpc,
    } as never);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("resolveAdmissionsRole", () => {
    it.each(ROLES)("returns %s", async (role) => {
      roleIs(role);

      await expect(resolveAdmissionsRole(client())).resolves.toBe(role);
      expect(rpc).toHaveBeenCalledWith("admissions_current_role");
    });

    it.each([
      ["NULL", null],
      ["an unknown value", "superuser"],
      ["a differently cased role", "ADMIN"],
      ["an inherited property name", "constructor"],
      ["an empty string", ""],
      ["a non-string", { role: "admin" }],
    ])("means no access for %s", async (_label, data) => {
      roleIs(data);

      await expect(resolveAdmissionsRole(client())).resolves.toBeNull();
    });

    it("means no access on an RPC error, even when data is present", async () => {
      rpc.mockResolvedValue({ data: "admin", error: { code: "42501", message: "denied" } });

      await expect(resolveAdmissionsRole(client())).resolves.toBeNull();
    });

    it("means no access when the call rejects", async () => {
      rpc.mockRejectedValue(new Error("network"));

      await expect(resolveAdmissionsRole(client())).resolves.toBeNull();
    });

    it("logs only the error code, never the message or details", async () => {
      rpc.mockResolvedValue({
        data: null,
        error: { code: "PGRST301", message: "persona@example.com", details: "persona@example.com" },
      });

      await resolveAdmissionsRole(client());

      const logged = JSON.stringify(vi.mocked(console.error).mock.calls);
      expect(logged).toContain("PGRST301");
      expect(logged).not.toContain("persona@example.com");
    });

    it("does not log the raw error when the call rejects", async () => {
      rpc.mockRejectedValue(new Error("persona@example.com"));

      await resolveAdmissionsRole(client());

      const logged = vi.mocked(console.error).mock.calls.flat();
      expect(logged.some((entry) => entry instanceof Error)).toBe(false);
      expect(JSON.stringify(logged)).not.toContain("persona@example.com");
    });

    it("does not log when the user simply has no role", async () => {
      roleIs(null);

      await resolveAdmissionsRole(client());

      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe("permissions", () => {
    it.each([
      ["admin", true, true],
      ["admissions_manager", true, false],
      ["admissions_agent", true, false],
      ["admissions_viewer", false, false],
    ] as const)("%s: edit %s, delete %s", (role, edit, del) => {
      expect(canEdit(role)).toBe(edit);
      expect(canDelete(role)).toBe(del);
    });

    it("grants nothing without a role", () => {
      expect(canEdit(null)).toBe(false);
      expect(canDelete(null)).toBe(false);
    });
  });

  describe("requireAdmissionsAccess", () => {
    it("answers 401 without a user and does not look up a role", async () => {
      getUser.mockResolvedValue({ data: { user: null }, error: null });

      const result = await requireAdmissionsAccess();

      expect(result).toBeInstanceOf(NextResponse);
      const response = result as NextResponse;
      expect(response.status).toBe(401);
      expect(response.headers.get("content-type")).toContain("application/json");
      expect(await response.json()).toEqual({ error: "No autenticado" });
      expect(rpc).not.toHaveBeenCalled();
    });

    it("answers 401 when reading the user fails", async () => {
      getUser.mockRejectedValue(new Error("network"));

      const result = await requireAdmissionsAccess();

      expect((result as NextResponse).status).toBe(401);
    });

    it("answers 401 when the session client cannot be built", async () => {
      vi.mocked(createSupabaseServerClient).mockRejectedValue(new Error("cookies"));

      const result = await requireAdmissionsAccess();

      expect((result as NextResponse).status).toBe(401);
    });

    it.each([
      ["no role", { data: null, error: null }],
      ["an unknown role", { data: "superuser", error: null }],
      ["an RPC error", { data: null, error: { code: "42501" } }],
    ])("answers 403 with %s", async (_label, rpcResult) => {
      getUser.mockResolvedValue({ data: { user: USER }, error: null });
      rpc.mockResolvedValue(rpcResult);

      const result = await requireAdmissionsAccess();

      expect(result).toBeInstanceOf(NextResponse);
      const response = result as NextResponse;
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ error: "No autorizado" });
    });

    it.each(ROLES)("returns the session client, user, and role for %s", async (role) => {
      getUser.mockResolvedValue({ data: { user: USER }, error: null });
      roleIs(role);
      const supabase = await vi.mocked(createSupabaseServerClient)();

      const result = await requireAdmissionsAccess();

      expect(result).toEqual({ supabase, user: USER, role });
    });

    it("never builds the service-role client", async () => {
      getUser.mockResolvedValue({ data: { user: USER }, error: null });
      roleIs("admin");

      await requireAdmissionsAccess();

      expect(createAdminClient).not.toHaveBeenCalled();
    });
  });
});
