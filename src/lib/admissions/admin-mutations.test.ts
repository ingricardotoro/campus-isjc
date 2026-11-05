import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  deleteProspect,
  guardianPatchSchema,
  INTERNAL_NOTES_MAX_LENGTH,
  MAX_PATCH_BODY_BYTES,
  patchGuardian,
  patchProspect,
  prospectPatchSchema,
} from "./admin-mutations";

const ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ID = "22222222-2222-4222-8222-222222222222";
const SECRET = "persona@example.com";

type Result = { data?: unknown; error?: { code?: string; message?: string } | null };
type Op = [string, ...unknown[]];

/** Answers each awaited query with the next result, recording what was called on it. */
function fakeClient(results: Result[]) {
  const queries: { table: string; ops: Op[] }[] = [];
  const next = () => {
    const result = results.shift();
    if (!result) throw new Error("Unexpected query");
    return { data: result.data ?? null, error: result.error ?? null };
  };
  const client = {
    from(table: string) {
      const ops: Op[] = [];
      queries.push({ table, ops });
      const builder: unknown = new Proxy(
        {},
        {
          get(_target, name: string) {
            if (name === "then") {
              return (resolveResult: (value: unknown) => unknown) => resolveResult(next());
            }
            return (...args: unknown[]) => {
              ops.push([name, ...args]);
              return builder;
            };
          },
        }
      );
      return builder;
    },
    rpc: vi.fn(async () => next()),
  };
  return { client: client as unknown as SupabaseClient, queries, rpc: client.rpc };
}

const updated = { data: [{ id: ID }] };
const noRow = { data: [] };
const opsOf = (query: { ops: Op[] }, name: string) => query.ops.filter(([op]) => op === name);
const payloadOf = (query: { ops: Op[] }) => opsOf(query, "update")[0]?.[1];

function jsonRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/x", {
    method: "PATCH",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const currentGuardian = (overrides: Record<string, unknown> = {}) => ({
  phone: "9999-0000",
  email: "ana@example.com",
  phone_normalized: "50499990000",
  email_normalized: "ana@example.com",
  preferred_contact_method: null,
  ...overrides,
});

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("prospectPatchSchema", () => {
  it.each([
    "consent_to_contact",
    "consentToContact",
    "consent_at",
    "privacy_notice_version",
    "utm_source",
    "utmSource",
    "landing_page",
    "source_id",
    "campaign_id",
    "guardian_id",
    "guardianId",
    "closed_at",
    "academic_year_id",
  ])("rejects the key %s, even next to a valid field", (key) => {
    expect(prospectPatchSchema.safeParse({ internalNotes: "x", [key]: "y" }).success).toBe(false);
  });

  it("rejects an empty object and non-objects", () => {
    for (const body of [{}, [], null, "text", 1]) {
      expect(prospectPatchSchema.safeParse(body).success).toBe(false);
    }
  });

  it("does not turn an absent field into null", () => {
    expect(prospectPatchSchema.parse({ statusId: ID })).toEqual({ statusId: ID });
  });

  it("accepts null only where clearing is allowed", () => {
    expect(prospectPatchSchema.parse({ assignedTo: null, modalityId: null })).toEqual({
      assignedTo: null,
      modalityId: null,
    });
    expect(prospectPatchSchema.safeParse({ statusId: null }).success).toBe(false);
    expect(prospectPatchSchema.safeParse({ gradeId: null }).success).toBe(false);
  });

  it.each(["statusId", "assignedTo", "gradeId", "modalityId"])("rejects a bad uuid in %s", (key) => {
    expect(prospectPatchSchema.safeParse({ [key]: "not-a-uuid" }).success).toBe(false);
    expect(prospectPatchSchema.safeParse({ [key]: "" }).success).toBe(false);
  });

  it("trims text and stores empty optional text as null", () => {
    expect(prospectPatchSchema.parse({ internalNotes: "  nota  ", studentName: "  Ana " })).toEqual({
      internalNotes: "nota",
      studentName: "Ana",
    });
    expect(prospectPatchSchema.parse({ internalNotes: "   ", studentName: "" })).toEqual({
      internalNotes: null,
      studentName: null,
    });
    expect(prospectPatchSchema.parse({ internalNotes: null, studentName: null })).toEqual({
      internalNotes: null,
      studentName: null,
    });
  });

  it("enforces the length limits on the trimmed text", () => {
    const notes = "n".repeat(INTERNAL_NOTES_MAX_LENGTH);
    expect(prospectPatchSchema.safeParse({ internalNotes: ` ${notes} ` }).success).toBe(true);
    expect(prospectPatchSchema.safeParse({ internalNotes: `${notes}n` }).success).toBe(false);
    expect(prospectPatchSchema.safeParse({ studentName: "s".repeat(150) }).success).toBe(true);
    expect(prospectPatchSchema.safeParse({ studentName: "s".repeat(151) }).success).toBe(false);
  });

  it("rejects non-text values for text fields", () => {
    expect(prospectPatchSchema.safeParse({ internalNotes: 5 }).success).toBe(false);
    expect(prospectPatchSchema.safeParse({ studentName: {} }).success).toBe(false);
  });
});

describe("guardianPatchSchema", () => {
  it.each(["phone_normalized", "email_normalized", "full_name", "id", "consent_at", "utm_source"])(
    "rejects the key %s",
    (key) => {
      expect(guardianPatchSchema.safeParse({ name: "Ana", [key]: "y" }).success).toBe(false);
    }
  );

  it("rejects an empty object", () => {
    expect(guardianPatchSchema.safeParse({}).success).toBe(false);
  });

  it("does not turn an absent field into null", () => {
    expect(guardianPatchSchema.parse({ name: "Ana" })).toEqual({ name: "Ana" });
  });

  it("applies the public form's rules", () => {
    expect(guardianPatchSchema.parse({ name: "  Ana  " })).toEqual({ name: "Ana" });
    expect(guardianPatchSchema.parse({ email: "  ANA@Example.COM " })).toEqual({
      email: "ana@example.com",
    });
    expect(guardianPatchSchema.parse({ phone: " +504 9999-0000 " })).toEqual({
      phone: "+504 9999-0000",
    });
    expect(guardianPatchSchema.parse({ phone: "  ", email: "" })).toEqual({
      phone: null,
      email: null,
    });
    for (const invalid of [
      { name: "A" },
      { name: null },
      { name: "n".repeat(151) },
      { phone: "1234" },
      { phone: "abc12345678" },
      { email: "not-an-email" },
      { preferredContactMethod: "fax" },
    ]) {
      expect(guardianPatchSchema.safeParse(invalid).success).toBe(false);
    }
  });

  it("allows clearing the preferred method", () => {
    expect(guardianPatchSchema.parse({ preferredContactMethod: null })).toEqual({
      preferredContactMethod: null,
    });
  });
});

describe("patchProspect", () => {
  it("writes only the sent fields, under their column names, filtered by id", async () => {
    const { client, queries } = fakeClient([updated]);

    const response = await patchProspect(
      client,
      ID,
      jsonRequest({
        statusId: OTHER_ID,
        assignedTo: null,
        gradeId: OTHER_ID,
        modalityId: OTHER_ID,
        internalNotes: " nota ",
        studentName: "",
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(queries[0].table).toBe("admissions_prospects");
    expect(payloadOf(queries[0])).toEqual({
      status_id: OTHER_ID,
      assigned_to: null,
      grade_id: OTHER_ID,
      modality_id: OTHER_ID,
      internal_notes: "nota",
      student_name: null,
    });
    expect(opsOf(queries[0], "eq")).toEqual([["eq", "id", ID]]);
  });

  it("does not touch the modality when only the grade changes", async () => {
    const { client, queries } = fakeClient([updated]);

    await patchProspect(client, ID, jsonRequest({ gradeId: OTHER_ID }));

    expect(payloadOf(queries[0])).toEqual({ grade_id: OTHER_ID });
  });

  it("assigns to a uuid", async () => {
    const { client, queries } = fakeClient([updated]);

    await patchProspect(client, ID, jsonRequest({ assignedTo: OTHER_ID }));

    expect(payloadOf(queries[0])).toEqual({ assigned_to: OTHER_ID });
  });

  it("answers 404 when no row was affected", async () => {
    const { client } = fakeClient([noRow]);

    const response = await patchProspect(client, ID, jsonRequest({ internalNotes: "x" }));

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it.each([
    ["22023", 400],
    ["23514", 400],
    ["23503", 400],
    ["23505", 409],
    ["42501", 500],
    ["PGRST301", 500],
    [undefined, 500],
  ])("maps database error %s to %i without leaking the message", async (code, status) => {
    const { client } = fakeClient([{ error: { code, message: `boom ${SECRET}` } }]);

    const response = await patchProspect(client, ID, jsonRequest({ gradeId: OTHER_ID }));

    expect(response.status).toBe(status);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(JSON.stringify(await response.json())).not.toContain(SECRET);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(SECRET);
  });

  it("answers a validation message when the pair of grade and modality is rejected", async () => {
    const { client } = fakeClient([{ error: { code: "23503" } }]);

    const response = await patchProspect(client, ID, jsonRequest({ gradeId: OTHER_ID }));

    expect((await response.json()).error).toMatch(/grado y modalidad/);
  });

  it("logs only the code on a generic failure", async () => {
    const { client } = fakeClient([{ error: { code: "XX000", message: SECRET } }]);

    await patchProspect(client, ID, jsonRequest({ internalNotes: SECRET }));

    expect(vi.mocked(console.error).mock.calls).toEqual([
      ["[admissions] Admin write failed:", "XX000"],
    ]);
  });

  it("answers a generic 500 when the client throws", async () => {
    const client = {
      from() {
        throw new Error(SECRET);
      },
    } as unknown as SupabaseClient;

    const response = await patchProspect(client, ID, jsonRequest({ internalNotes: "x" }));

    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain(SECRET);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(SECRET);
  });

  describe("request guards, none of which reach the database", () => {
    const expectRejected = async (request: NextRequest, status: number, id = ID) => {
      const { client, queries } = fakeClient([]);

      const response = await patchProspect(client, id, request);

      expect(response.status).toBe(status);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(typeof (await response.json()).error).toBe("string");
      expect(queries).toEqual([]);
    };

    it("rejects an invalid uuid", () =>
      expectRejected(jsonRequest({ internalNotes: "x" }), 400, "not-a-uuid"));
    it("rejects an empty object", () => expectRejected(jsonRequest({}), 400));
    it("rejects invalid JSON", () => expectRejected(jsonRequest("{oops"), 400));
    it("rejects an empty body", () => expectRejected(jsonRequest(""), 400));
    it("rejects a JSON array", () => expectRejected(jsonRequest([]), 400));
    it("rejects an unknown key", () =>
      expectRejected(jsonRequest({ internalNotes: "x", utm_source: "y" }), 400));
    it("rejects a wrong content type", () =>
      expectRejected(jsonRequest({ internalNotes: "x" }, { "content-type": "text/plain" }), 415));
    it("rejects a form content type", () =>
      expectRejected(
        jsonRequest("internalNotes=x", { "content-type": "application/x-www-form-urlencoded" }),
        415
      ));
    it("rejects a lookalike content type", () =>
      expectRejected(
        jsonRequest({ internalNotes: "x" }, { "content-type": "application/jsonp" }),
        415
      ));
    it("rejects a declared oversized body", () =>
      expectRejected(
        jsonRequest({ internalNotes: "x" }, { "content-length": String(MAX_PATCH_BODY_BYTES + 1) }),
        413
      ));
    it("rejects an oversized body that does not declare its size", () =>
      expectRejected(jsonRequest({ internalNotes: "x".repeat(MAX_PATCH_BODY_BYTES) }), 413));
  });

  it("accepts a charset in the content type", async () => {
    const { client } = fakeClient([updated]);

    const response = await patchProspect(
      client,
      ID,
      jsonRequest({ internalNotes: "x" }, { "content-type": "Application/JSON; charset=utf-8" })
    );

    expect(response.status).toBe(200);
  });

  it("fits the longest valid notes in the body limit, even fully escaped", async () => {
    const { client } = fakeClient([updated]);
    const body = `{"internalNotes":"${"\\u00e9".repeat(INTERNAL_NOTES_MAX_LENGTH)}"}`;

    const response = await patchProspect(client, ID, jsonRequest(body));

    expect(response.status).toBe(200);
  });

  it("does not echo unknown keys or values in the validation answer", async () => {
    const { client } = fakeClient([]);

    const response = await patchProspect(client, ID, jsonRequest({ [SECRET]: SECRET }));

    expect(response.status).toBe(400);
    expect(JSON.stringify(await response.json())).not.toContain(SECRET);
  });

  it("reports which field failed", async () => {
    const { client } = fakeClient([]);

    const response = await patchProspect(client, ID, jsonRequest({ studentName: "s".repeat(151) }));

    expect((await response.json()).fieldErrors).toEqual({
      studentName: expect.any(String),
    });
  });
});

describe("patchGuardian", () => {
  it("updates only the name without reading the contact data", async () => {
    const { client, queries } = fakeClient([updated]);

    const response = await patchGuardian(client, ID, jsonRequest({ name: " Ana " }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(queries).toHaveLength(1);
    expect(queries[0].table).toBe("admissions_guardians");
    expect(payloadOf(queries[0])).toEqual({ full_name: "Ana" });
    expect(opsOf(queries[0], "eq")).toEqual([["eq", "id", ID]]);
  });

  it("answers 404 when a name update affected no row", async () => {
    const { client } = fakeClient([noRow]);

    expect((await patchGuardian(client, ID, jsonRequest({ name: "Ana" }))).status).toBe(404);
  });

  it("answers 404 when the guardian to check does not exist", async () => {
    const { client, queries } = fakeClient([{ data: null }]);

    const response = await patchGuardian(client, ID, jsonRequest({ phone: "9999-1111" }));

    expect(response.status).toBe(404);
    expect(queries).toHaveLength(1);
  });

  it("never writes the generated columns", async () => {
    const { client, queries } = fakeClient([{ data: currentGuardian() }, updated]);

    await patchGuardian(
      client,
      ID,
      jsonRequest({ phone: "9999-1111", email: "B@Example.com", preferredContactMethod: "email" })
    );

    expect(payloadOf(queries[1])).toEqual({
      phone: "9999-1111",
      email: "b@example.com",
      preferred_contact_method: "email",
    });
  });

  it.each([
    ["clearing the phone keeps the current email", { phone: null }, currentGuardian()],
    ["clearing the email keeps the current phone", { email: "" }, currentGuardian()],
    [
      "clearing one while replacing the other",
      { phone: null, email: "b@example.com" },
      currentGuardian({ email: null, email_normalized: null }),
    ],
    [
      "clearing the email moves the preference to the phone",
      { email: null, preferredContactMethod: "whatsapp" },
      currentGuardian({ preferred_contact_method: "email" }),
    ],
    [
      "clearing the phone with a preference for email",
      { phone: null },
      currentGuardian({ preferred_contact_method: "email" }),
    ],
    [
      "clearing the preference and the contact it needed",
      { phone: null, preferredContactMethod: null },
      currentGuardian({ preferred_contact_method: "phone" }),
    ],
  ])("accepts %s", async (_label, patch, current) => {
    const { client } = fakeClient([{ data: current }, updated]);

    expect((await patchGuardian(client, ID, jsonRequest(patch))).status).toBe(200);
  });

  it.each([
    ["clearing both", { phone: null, email: null }, currentGuardian(), ["phone"]],
    [
      "clearing the only phone",
      { phone: null },
      currentGuardian({ email: null, email_normalized: null }),
      ["phone"],
    ],
    [
      "clearing the only email",
      { email: null },
      currentGuardian({ phone: null, phone_normalized: null }),
      ["phone"],
    ],
    [
      "clearing the email while it is the preferred method",
      { email: null },
      currentGuardian({ preferred_contact_method: "email" }),
      ["email"],
    ],
    [
      "clearing the phone while calls are preferred",
      { phone: null },
      currentGuardian({ preferred_contact_method: "phone" }),
      ["phone"],
    ],
    [
      "clearing the phone while WhatsApp is preferred",
      { phone: "" },
      currentGuardian({ preferred_contact_method: "whatsapp" }),
      ["phone"],
    ],
    [
      "preferring email without one",
      { preferredContactMethod: "email" },
      currentGuardian({ email: null, email_normalized: null }),
      ["email"],
    ],
    [
      "preferring WhatsApp without a phone",
      { preferredContactMethod: "whatsapp" },
      currentGuardian({ phone: null, phone_normalized: null }),
      ["phone"],
    ],
  ])("rejects %s, using the current row, without writing", async (_label, patch, current, fields) => {
    const { client, queries } = fakeClient([{ data: current }]);

    const response = await patchGuardian(client, ID, jsonRequest(patch));

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(Object.keys((await response.json()).fieldErrors)).toEqual(fields);
    expect(queries).toHaveLength(1);
    expect(opsOf(queries[0], "update")).toEqual([]);
  });

  it("counts a stored value that normalizes to nothing as no contact", async () => {
    const { client } = fakeClient([
      { data: currentGuardian({ phone: "---", phone_normalized: null }) },
    ]);

    const response = await patchGuardian(client, ID, jsonRequest({ email: null }));

    expect(response.status).toBe(400);
  });

  it("writes only if the contact data is still what was checked", async () => {
    const { client, queries } = fakeClient([
      { data: currentGuardian({ email: null, preferred_contact_method: "phone" }) },
      updated,
    ]);

    await patchGuardian(client, ID, jsonRequest({ name: "Ana", phone: "9999-1111" }));

    expect(opsOf(queries[1], "eq")).toEqual([
      ["eq", "id", ID],
      ["eq", "phone", "9999-0000"],
      ["eq", "preferred_contact_method", "phone"],
    ]);
    expect(opsOf(queries[1], "is")).toEqual([["is", "email", null]]);
  });

  it("answers 409 when the contact data changed after the check", async () => {
    const { client } = fakeClient([{ data: currentGuardian() }, noRow, { data: currentGuardian() }]);

    const response = await patchGuardian(client, ID, jsonRequest({ phone: "9999-1111" }));

    expect(response.status).toBe(409);
    expect((await response.json()).error).toMatch(/intente de nuevo/i);
  });

  it("answers 404 when the guardian disappeared after the check", async () => {
    const { client } = fakeClient([{ data: currentGuardian() }, noRow, { data: null }]);

    const response = await patchGuardian(client, ID, jsonRequest({ phone: "9999-1111" }));

    expect(response.status).toBe(404);
  });

  it("answers a generic 500 when the read after an unmatched update fails", async () => {
    const { client, queries } = fakeClient([
      { data: currentGuardian() },
      noRow,
      { error: { code: "XX000", message: SECRET } },
    ]);

    const response = await patchGuardian(client, ID, jsonRequest({ phone: "9999-1111" }));

    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(JSON.stringify(await response.json())).not.toContain(SECRET);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(SECRET);
    expect(queries).toHaveLength(3);
  });

  it("answers a generic 409 on a unique conflict, without data of another family", async () => {
    const { client } = fakeClient([
      { data: currentGuardian() },
      {
        error: {
          code: "23505",
          message: `duplicate key ${SECRET} phone_normalized (50488880000)`,
        },
      },
    ]);

    const response = await patchGuardian(client, ID, jsonRequest({ phone: "8888-0000" }));
    const text = JSON.stringify(await response.json());

    expect(response.status).toBe(409);
    expect(text).not.toContain(SECRET);
    expect(text).not.toContain("50488880000");
    expect(text).not.toContain("8888-0000");
  });

  it.each([
    ["22023", 400],
    ["23514", 400],
    ["XX000", 500],
  ])("maps %s to %i, on the name update too", async (code, status) => {
    const { client } = fakeClient([{ error: { code, message: SECRET } }]);

    const response = await patchGuardian(client, ID, jsonRequest({ name: "Ana" }));

    expect(response.status).toBe(status);
    expect(JSON.stringify(await response.json())).not.toContain(SECRET);
  });

  it("answers a generic 500 when the check fails, without writing", async () => {
    const { client, queries } = fakeClient([{ error: { code: "XX000", message: SECRET } }]);

    const response = await patchGuardian(client, ID, jsonRequest({ email: null }));

    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain(SECRET);
    expect(queries).toHaveLength(1);
  });

  it("rejects an invalid uuid, an empty body, and invalid JSON before any query", async () => {
    const { client, queries } = fakeClient([]);

    expect((await patchGuardian(client, "x", jsonRequest({ name: "Ana" }))).status).toBe(400);
    expect((await patchGuardian(client, ID, jsonRequest({}))).status).toBe(400);
    expect((await patchGuardian(client, ID, jsonRequest("{oops"))).status).toBe(400);
    expect(
      (
        await patchGuardian(
          client,
          ID,
          jsonRequest({ name: "Ana" }, { "content-type": "text/plain" })
        )
      ).status
    ).toBe(415);
    expect(queries).toEqual([]);
  });
});

describe("deleteProspect", () => {
  it("calls the RPC with the id and answers ok", async () => {
    const { client, rpc, queries } = fakeClient([{}]);

    const response = await deleteProspect(client, ID);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith("admissions_delete_prospect", { p_prospect_id: ID });
    expect(queries).toEqual([]);
  });

  it("rejects an invalid uuid without calling the RPC", async () => {
    const { client, rpc } = fakeClient([]);

    expect((await deleteProspect(client, "not-a-uuid")).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it.each([
    ["42501", 403],
    ["P0002", 404],
    ["40001", 409],
    ["22023", 400],
    ["23514", 400],
    ["XX000", 500],
    [undefined, 500],
  ])("maps %s to %i and logs only the code and the id", async (code, status) => {
    const { client } = fakeClient([{ error: { code, message: `boom ${SECRET}` } }]);

    const response = await deleteProspect(client, ID);

    expect(response.status).toBe(status);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(JSON.stringify(await response.json())).not.toContain(SECRET);
    expect(vi.mocked(console.error).mock.calls).toEqual([
      ["[admissions] Prospect deletion failed:", code ?? "unknown", ID],
    ]);
  });

  it("tells the user to retry on 40001", async () => {
    const { client } = fakeClient([{ error: { code: "40001" } }]);

    expect((await (await deleteProspect(client, ID)).json()).error).toMatch(/intente de nuevo/i);
  });

  it("answers a generic 500 when the RPC throws, logging only the id", async () => {
    const client = {
      rpc: async () => {
        throw new Error(SECRET);
      },
    } as unknown as SupabaseClient;

    const response = await deleteProspect(client, ID);

    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain(SECRET);
    expect(vi.mocked(console.error).mock.calls).toEqual([
      ["[admissions] Prospect deletion failed:", "exception", ID],
    ]);
  });
});

describe("privileged access", () => {
  it.each([
    "src/lib/admissions/admin-mutations.ts",
    "src/app/api/admisiones-admin/prospects/[id]/route.ts",
    "src/app/api/admisiones-admin/guardians/[id]/route.ts",
  ])("%s does not use the admin client", (path) => {
    const source = readFileSync(resolve(process.cwd(), path), "utf8");

    expect(source).not.toMatch(/createAdminClient|supabase\/admin|SERVICE_ROLE/);
  });
});
