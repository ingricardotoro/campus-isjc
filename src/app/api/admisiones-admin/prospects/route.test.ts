import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmissionsAccess } from "@/lib/admissions/admin-access";
import { AdmissionsQueryError, listProspects } from "@/lib/admissions/admin-queries";
import { GET } from "./route";

vi.mock("@/lib/admissions/admin-access", () => ({ requireAdmissionsAccess: vi.fn() }));
vi.mock("@/lib/admissions/admin-queries", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/admissions/admin-queries")>()),
  listProspects: vi.fn(),
}));

const supabase = { session: true };
const request = (query = "") =>
  new NextRequest(`http://localhost/api/admisiones-admin/prospects${query}`);

describe("GET /api/admisiones-admin/prospects", () => {
  beforeEach(() => {
    vi.mocked(requireAdmissionsAccess).mockReset().mockResolvedValue({
      supabase,
      user: {},
      role: "admissions_viewer",
    } as never);
    vi.mocked(listProspects).mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([401, 403])("passes a %i through, before validating", async (status) => {
    const denied = NextResponse.json({ error: "x" }, { status });
    vi.mocked(requireAdmissionsAccess).mockResolvedValue(denied);

    expect(await GET(request("?page=abc"))).toBe(denied);
    expect(listProspects).not.toHaveBeenCalled();
  });

  it.each(["?page=abc", "?sort=internal_notes", "?statusId=abc", "?assignedTo=nadie", "?dir=x"])(
    "answers a generic 400 for %s",
    async (query) => {
      const response = await GET(request(query));

      expect(response.status).toBe(400);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(await response.json()).toEqual({ error: "Parámetros de consulta inválidos." });
      expect(listProspects).not.toHaveBeenCalled();
    }
  );

  it("answers the list through the session client, with no-store and validated params", async () => {
    const data = { rows: [], total: 0, page: 2, pageSize: 100, searchTruncated: false };
    vi.mocked(listProspects).mockResolvedValue(data);

    const response = await GET(request("?page=2&pageSize=500&assignedTo=unassigned"));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual(data);
    expect(listProspects).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({ page: 2, pageSize: 100, assignedTo: "unassigned" })
    );
  });

  it.each([
    ["a query error", new AdmissionsQueryError("42501")],
    ["an exception", new Error("persona@example.com")],
  ])("answers a generic 500 on %s", async (_label, failure) => {
    vi.mocked(listProspects).mockRejectedValue(failure);

    const response = await GET(request());

    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ error: "No se pudieron cargar los datos." });
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("persona@example.com");
  });
});
