import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { MAX_CLOCK_SKEW_MS } from "@/lib/admissions/form-fields";
import { createAdminClient } from "@/lib/supabase/admin";
import { POST } from "./route";

const { send } = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: vi.fn(function () {
    return { emails: { send } };
  }),
}));

const URL = "http://localhost:3000/api/admissions";
const YEAR_ID = "11111111-1111-4111-8111-111111111111";
const GRADE_ID = "22222222-2222-4222-8222-222222222222";

const rpc = vi.fn();
const maybeSingle = vi.fn();
const from = vi.fn(() => ({
  select: () => ({ eq: () => ({ maybeSingle }) }),
}));

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    guardianName: "María López",
    phone: "9999-8888",
    email: "maria@example.com",
    preferredContactMethod: "whatsapp",
    studentName: "",
    academicYearId: YEAR_ID,
    gradeId: GRADE_ID,
    modalityId: "",
    wantsVisit: true,
    consentToContact: true,
    utmSource: "facebook",
    website: "",
    startedAt: Date.now() - 10_000,
    ...overrides,
  };
}

function post(body: unknown) {
  return POST(
    new NextRequest(URL, {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    })
  );
}

function rpcReturns(isNewProspect: boolean) {
  rpc.mockResolvedValue({
    data: [{ prospect_id: "p1", guardian_id: "g1", is_new_prospect: isNewProspect }],
    error: null,
  });
}

describe("POST /api/admissions", () => {
  beforeEach(() => {
    rpc.mockReset();
    from.mockClear();
    maybeSingle.mockReset().mockResolvedValue({ data: { name: "Primer grado" }, error: null });
    send.mockReset().mockResolvedValue({ data: { id: "email-1" }, error: null });
    vi.mocked(createAdminClient).mockReturnValue({ rpc, from } as never);
    vi.stubEnv("ADMISSIONS_NOTIFICATION_EMAILS", "admisiones@example.com, rectoria@example.com");
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("registers a new prospect, answers 200, and notifies the team", async () => {
    rpcReturns(true);

    const response = await post(validBody());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith(
      "admissions_register_public_interest",
      expect.objectContaining({
        p_guardian_name: "María López",
        p_source_code: "WEB_FORM",
        p_consent_to_contact: true,
        p_privacy_notice_version: "ADM-2027-v1-draft",
        p_utm_source: "facebook",
      })
    );
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Admisiones ISJC <contacto@sanjosedelcarmen.edu.hn>",
        to: ["admisiones@example.com", "rectoria@example.com"],
      })
    );
  });

  it("answers identically for a repeat registration and sends no email", async () => {
    rpcReturns(false);

    const response = await post(validBody());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(send).not.toHaveBeenCalled();
  });

  it("silently accepts a filled honeypot without registering", async () => {
    const response = await post(validBody({ website: "https://spam.example" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(rpc).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("silently accepts a submission that was too fast", async () => {
    const response = await post(validBody({ startedAt: Date.now() - 500 }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("registers a family whose device clock runs ahead of the server", async () => {
    rpcReturns(true);

    const response = await post(validBody({ startedAt: Date.now() + 60_000 }));

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("registers a family whose device clock is just inside the skew window", async () => {
    rpcReturns(true);

    const response = await post(validBody({ startedAt: Date.now() + MAX_CLOCK_SKEW_MS - 5_000 }));

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["just past the skew window", () => Date.now() + MAX_CLOCK_SKEW_MS + 5_000],
    ["at the largest safe integer", () => Number.MAX_SAFE_INTEGER],
  ])("asks the family to fix the device clock for a timestamp %s", async (_label, startedAt) => {
    const response = await post(validBody({ startedAt: startedAt() }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/fecha y hora de su dispositivo/);
    expect(body.error).toMatch(/recargue la página/);
    expect(rpc).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("silently accepts a submission without a render timestamp", async () => {
    const response = await post(validBody({ startedAt: undefined }));

    expect(response.status).toBe(200);
    expect(rpc).not.toHaveBeenCalled();
  });

  it.each([
    ["honeypot", () => ({ website: "https://spam.example" })],
    ["invalid_timestamp", () => ({ startedAt: "not-a-number" })],
    ["too_fast", () => ({ startedAt: Date.now() - 500 })],
    ["future_timestamp", () => ({ startedAt: Number.MAX_SAFE_INTEGER })],
  ])("logs the %s filter reason without personal data", async (reason, overrides) => {
    await post(validBody(overrides()));

    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith("[admissions] Submission filtered:", reason);
    const logged = JSON.stringify(vi.mocked(console.warn).mock.calls);
    for (const value of ["María", "maria@example.com", "9999-8888", "spam.example"]) {
      expect(logged).not.toContain(value);
    }
  });

  it("logs nothing for a submission that is not filtered", async () => {
    rpcReturns(false);

    await post(validBody());

    expect(console.warn).not.toHaveBeenCalled();
  });

  it("rejects an invalid body with 400 and generic messages", async () => {
    const response = await post(validBody({ phone: "", email: "", consentToContact: false }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(typeof json.error).toBe("string");
    expect(json.fields).toEqual(expect.arrayContaining(["phone", "consentToContact"]));
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON with 400", async () => {
    const response = await post("{not json");

    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects a non-object JSON body with 400", async () => {
    const response = await post("[1,2,3]");

    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects an oversized body with 413 before parsing", async () => {
    const response = await post(validBody({ studentName: "x".repeat(20 * 1024) }));

    expect(response.status).toBe(413);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("maps an RPC validation error (22023) to a generic 400", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { code: "22023", message: "grade is not available" },
    });

    const response = await post(validBody());
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(JSON.stringify(json)).not.toContain("grade is not available");
    expect(send).not.toHaveBeenCalled();
  });

  it("maps any other RPC error to a generic 500", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "P0002", message: "status NEW missing" } });

    const response = await post(validBody());
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(JSON.stringify(json)).not.toContain("status NEW missing");
  });

  it("answers 500 when the admin client cannot be created", async () => {
    vi.mocked(createAdminClient).mockImplementation(() => {
      throw new Error("missing env");
    });

    const response = await post(validBody());

    expect(response.status).toBe(500);
  });

  it("skips the email when no recipients are configured", async () => {
    vi.stubEnv("ADMISSIONS_NOTIFICATION_EMAILS", "");
    rpcReturns(true);

    const response = await post(validBody());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(send).not.toHaveBeenCalled();
  });

  it("still answers 200 when the email provider throws", async () => {
    send.mockRejectedValue(new Error("provider down"));
    rpcReturns(true);

    const response = await post(validBody());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("still answers 200 when the email provider returns an error", async () => {
    send.mockResolvedValue({ data: null, error: { name: "validation_error", message: "bad" } });
    rpcReturns(true);

    const response = await post(validBody());

    expect(response.status).toBe(200);
  });

  it("still notifies when catalog labels cannot be loaded", async () => {
    maybeSingle.mockRejectedValue(new Error("db down"));
    rpcReturns(true);

    const response = await post(validBody());

    expect(response.status).toBe(200);
    expect(send).toHaveBeenCalledTimes(1);
  });
});
