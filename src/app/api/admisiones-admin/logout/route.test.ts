import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { POST } from "./route";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

const signOut = vi.fn();

describe("POST /api/admisiones-admin/logout", () => {
  beforeEach(() => {
    signOut.mockReset().mockResolvedValue({ error: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({ auth: { signOut } } as never);
  });

  it("ends only this session, because Auth is shared with other modules", async () => {
    const result = await POST();

    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ success: true });
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("does not report success when sign-out returns an error", async () => {
    signOut.mockResolvedValue({ error: new Error("network") });

    const result = await POST();

    expect(result.status).toBe(500);
    expect(await result.json()).not.toHaveProperty("success");
  });

  it("answers a generic 500 when sign-out throws", async () => {
    signOut.mockRejectedValue(new Error("internal detail"));

    const result = await POST();

    expect(result.status).toBe(500);
    expect(JSON.stringify(await result.json())).not.toContain("internal detail");
  });
});
