import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { requireAdmissionsAccess } from "@/lib/admissions/admin-access";
import { AdmissionsQueryError, loadDashboard } from "@/lib/admissions/admin-queries";
import { GET } from "./route";

vi.mock("@/lib/admissions/admin-access", () => ({ requireAdmissionsAccess: vi.fn() }));
vi.mock("@/lib/admissions/admin-queries", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/admissions/admin-queries")>()),
  loadDashboard: vi.fn(),
}));

const supabase = { session: true };

describe("GET /api/admisiones-admin/dashboard", () => {
  beforeEach(() => {
    vi.mocked(requireAdmissionsAccess).mockReset().mockResolvedValue({
      supabase,
      user: {},
      role: "admissions_viewer",
    } as never);
    vi.mocked(loadDashboard).mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([401, 403])("passes a %i through without querying", async (status) => {
    const denied = NextResponse.json({ error: "x" }, { status });
    vi.mocked(requireAdmissionsAccess).mockResolvedValue(denied);

    expect(await GET()).toBe(denied);
    expect(loadDashboard).not.toHaveBeenCalled();
  });

  it("answers the data through the session client, with no-store", async () => {
    const data = { statuses: [], newLast7Days: 1, unassigned: 2 };
    vi.mocked(loadDashboard).mockResolvedValue(data);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual(data);
    expect(vi.mocked(loadDashboard).mock.calls[0][0]).toBe(supabase);
  });

  it.each([
    ["a query error", new AdmissionsQueryError("42501")],
    ["an exception", new Error("persona@example.com")],
  ])("answers a generic 500 on %s", async (_label, failure) => {
    vi.mocked(loadDashboard).mockRejectedValue(failure);

    const response = await GET();

    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ error: "No se pudieron cargar los datos." });
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("persona@example.com");
  });
});
