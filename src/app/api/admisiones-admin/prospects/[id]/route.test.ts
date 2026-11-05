import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmissionsAccess } from "@/lib/admissions/admin-access";
import { deleteProspect, patchProspect } from "@/lib/admissions/admin-mutations";
import { AdmissionsQueryError, getProspect } from "@/lib/admissions/admin-queries";
import { DELETE, GET, PATCH } from "./route";

vi.mock("@/lib/admissions/admin-access", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/admissions/admin-access")>()),
  requireAdmissionsAccess: vi.fn(),
}));
vi.mock("@/lib/admissions/admin-mutations", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/admissions/admin-mutations")>()),
  patchProspect: vi.fn(),
  deleteProspect: vi.fn(),
}));
vi.mock("@/lib/admissions/admin-queries", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/admissions/admin-queries")>()),
  getProspect: vi.fn(),
}));

const ID = "11111111-1111-4111-8111-111111111111";
const supabase = { session: true };
const call = (id: string) =>
  GET(new NextRequest(`http://localhost/api/admisiones-admin/prospects/${id}`), {
    params: Promise.resolve({ id }),
  });

describe("GET /api/admisiones-admin/prospects/[id]", () => {
  beforeEach(() => {
    vi.mocked(requireAdmissionsAccess).mockReset().mockResolvedValue({
      supabase,
      user: {},
      role: "admissions_viewer",
    } as never);
    vi.mocked(getProspect).mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([401, 403])("passes a %i through, before validating", async (status) => {
    const denied = NextResponse.json({ error: "x" }, { status });
    vi.mocked(requireAdmissionsAccess).mockResolvedValue(denied);

    expect(await call("not-a-uuid")).toBe(denied);
    expect(getProspect).not.toHaveBeenCalled();
  });

  it("answers 400 for an invalid uuid, without querying", async () => {
    const response = await call("not-a-uuid");

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ error: "Identificador inválido." });
    expect(getProspect).not.toHaveBeenCalled();
  });

  it("answers 404 when not found", async () => {
    vi.mocked(getProspect).mockResolvedValue(null);

    const response = await call(ID);

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ error: "Prospecto no encontrado." });
  });

  it("answers the record through the session client, with no-store", async () => {
    const record = { id: ID };
    vi.mocked(getProspect).mockResolvedValue(record as never);

    const response = await call(ID);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual(record);
    expect(getProspect).toHaveBeenCalledWith(supabase, ID);
  });

  it.each([
    ["a query error", new AdmissionsQueryError("42501")],
    ["an exception", new Error("persona@example.com")],
  ])("answers a generic 500 on %s", async (_label, failure) => {
    vi.mocked(getProspect).mockRejectedValue(failure);

    const response = await call(ID);

    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ error: "No se pudieron cargar los datos." });
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("persona@example.com");
  });
});

describe("writes to /api/admisiones-admin/prospects/[id]", () => {
  const url = `http://localhost/api/admisiones-admin/prospects/${ID}`;
  const patchRequest = new NextRequest(url, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ internalNotes: "x" }),
  });
  const context = { params: Promise.resolve({ id: ID }) };
  const callPatch = () => PATCH(patchRequest, context);
  const callDelete = () => DELETE(new NextRequest(url, { method: "DELETE" }), context);
  const signedInAs = (role: string) =>
    vi.mocked(requireAdmissionsAccess).mockResolvedValue({ supabase, user: {}, role } as never);

  beforeEach(() => {
    vi.mocked(requireAdmissionsAccess).mockReset();
    vi.mocked(patchProspect).mockReset().mockResolvedValue(NextResponse.json({ ok: true }));
    vi.mocked(deleteProspect).mockReset().mockResolvedValue(NextResponse.json({ ok: true }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([401, 403])("passes a %i through on both methods", async (status) => {
    const denied = NextResponse.json({ error: "x" }, { status });
    vi.mocked(requireAdmissionsAccess).mockResolvedValue(denied);

    expect(await callPatch()).toBe(denied);
    expect(await callDelete()).toBe(denied);
    expect(patchProspect).not.toHaveBeenCalled();
    expect(deleteProspect).not.toHaveBeenCalled();
  });

  it("answers 403 to a viewer on PATCH", async () => {
    signedInAs("admissions_viewer");

    const response = await callPatch();

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(patchProspect).not.toHaveBeenCalled();
  });

  it.each(["admin", "admissions_manager", "admissions_agent"])(
    "lets %s edit through the session client",
    async (role) => {
      signedInAs(role);

      expect((await callPatch()).status).toBe(200);
      expect(patchProspect).toHaveBeenCalledWith(supabase, ID, patchRequest);
    }
  );

  it.each(["admissions_manager", "admissions_agent", "admissions_viewer"])(
    "answers 403 to %s on DELETE",
    async (role) => {
      signedInAs(role);

      const response = await callDelete();

      expect(response.status).toBe(403);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(deleteProspect).not.toHaveBeenCalled();
    }
  );

  it("lets an admin delete through the session client", async () => {
    signedInAs("admin");

    expect((await callDelete()).status).toBe(200);
    expect(deleteProspect).toHaveBeenCalledWith(supabase, ID);
  });
});
