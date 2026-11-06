import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { middleware } from "@/middleware";
import { POST } from "./route";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: vi.fn(),
}));

const signOut = vi.fn();
const rpc = vi.fn();

describe("POST /api/admisiones-admin/logout", () => {
  beforeEach(() => {
    signOut.mockReset().mockResolvedValue({ error: null });
    rpc.mockReset().mockResolvedValue({ data: null, error: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({ auth: { signOut }, rpc } as never);
  });

  it("reaches the handler through middleware for a user without a role", async () => {
    vi.mocked(updateSession).mockReset().mockResolvedValue({
      response: NextResponse.next(),
      user: { email: "persona@example.com" },
      supabase: { rpc },
    } as never);

    const passed = await middleware(
      new NextRequest("http://localhost:3000/api/admisiones-admin/logout", { method: "POST" })
    );
    expect(passed.status).toBe(200);
    expect(passed.headers.get("x-middleware-next")).toBe("1");

    const result = await POST();

    expect(result.status).toBe(200);
    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(rpc).not.toHaveBeenCalled();
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
