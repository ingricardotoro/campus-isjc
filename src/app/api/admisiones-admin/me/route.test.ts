import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { requireAdmissionsAccess } from "@/lib/admissions/admin-access";
import { GET } from "./route";

vi.mock("@/lib/admissions/admin-access", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/admissions/admin-access")>()),
  requireAdmissionsAccess: vi.fn(),
}));

const supabase = { from: vi.fn(), rpc: vi.fn() };

function grant(role: string) {
  vi.mocked(requireAdmissionsAccess).mockResolvedValue({
    supabase,
    user: { id: "user-1", email: "persona@example.com" },
    role,
  } as never);
}

describe("GET /api/admisiones-admin/me", () => {
  beforeEach(() => {
    vi.mocked(requireAdmissionsAccess).mockReset();
    supabase.from.mockReset();
    supabase.rpc.mockReset();
  });

  it.each([401, 403])("passes a %i through", async (status) => {
    const denied = NextResponse.json({ error: "x" }, { status });
    vi.mocked(requireAdmissionsAccess).mockResolvedValue(denied);

    expect(await GET()).toBe(denied);
  });

  it.each([
    ["admin", true, true],
    ["admissions_manager", true, false],
    ["admissions_agent", true, false],
    ["admissions_viewer", false, false],
  ])("answers the permissions of %s", async (role, canEdit, canDelete) => {
    grant(role);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ role, canEdit, canDelete });
  });

  it("is never cached", async () => {
    grant("admin");
    expect((await GET()).headers.get("cache-control")).toBe("no-store");
  });

  it("answers from the role alone, with no data query and no personal data", async () => {
    grant("admissions_agent");

    const body = JSON.stringify(await (await GET()).json());

    expect(supabase.from).not.toHaveBeenCalled();
    expect(supabase.rpc).not.toHaveBeenCalled();
    expect(body).not.toContain("persona@example.com");
    expect(body).not.toContain("user-1");
  });
});
