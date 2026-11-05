import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmissionsAccess } from "@/lib/admissions/admin-access";
import { patchGuardian } from "@/lib/admissions/admin-mutations";
import { PATCH } from "./route";

vi.mock("@/lib/admissions/admin-access", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/admissions/admin-access")>()),
  requireAdmissionsAccess: vi.fn(),
}));
vi.mock("@/lib/admissions/admin-mutations", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/admissions/admin-mutations")>()),
  patchGuardian: vi.fn(),
}));

const ID = "11111111-1111-4111-8111-111111111111";
const supabase = { session: true };
const request = new NextRequest(`http://localhost/api/admisiones-admin/guardians/${ID}`, {
  method: "PATCH",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ name: "Ana" }),
});
const call = () => PATCH(request, { params: Promise.resolve({ id: ID }) });
const signedInAs = (role: string) =>
  vi.mocked(requireAdmissionsAccess).mockResolvedValue({ supabase, user: {}, role } as never);

describe("PATCH /api/admisiones-admin/guardians/[id]", () => {
  beforeEach(() => {
    vi.mocked(requireAdmissionsAccess).mockReset();
    vi.mocked(patchGuardian).mockReset().mockResolvedValue(NextResponse.json({ ok: true }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([401, 403])("passes a %i through", async (status) => {
    const denied = NextResponse.json({ error: "x" }, { status });
    vi.mocked(requireAdmissionsAccess).mockResolvedValue(denied);

    expect(await call()).toBe(denied);
    expect(patchGuardian).not.toHaveBeenCalled();
  });

  it("answers 403 to a viewer", async () => {
    signedInAs("admissions_viewer");

    const response = await call();

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(patchGuardian).not.toHaveBeenCalled();
  });

  it.each(["admin", "admissions_manager", "admissions_agent"])(
    "lets %s edit through the session client",
    async (role) => {
      signedInAs(role);

      const response = await call();

      expect(response.status).toBe(200);
      expect(patchGuardian).toHaveBeenCalledWith(supabase, ID, request);
    }
  );
});
