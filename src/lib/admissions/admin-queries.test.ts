import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AdmissionsQueryError,
  GUARDIAN_SEARCH_LIMIT,
  buildGuardianSearchFilter,
  getProspect,
  isValidProspectId,
  listProspects,
  loadCatalogs,
  loadDashboard,
  noStoreJson,
  parseProspectListParams,
  quotedContains,
  queryFailureResponse,
  type ProspectListParams,
} from "./admin-queries";

const ID_A = "11111111-1111-4111-8111-111111111111";
const ID_B = "22222222-2222-4222-8222-222222222222";

type Result = { data?: unknown; error?: { code?: string; message?: string } | null; count?: number | null };

type Call = {
  table: string;
  columns?: string;
  options?: { count?: string; head?: boolean };
  ops: [string, ...unknown[]][];
  single: boolean;
};

/** Records the query a function builds, and answers it from `answer`. */
function fakeClient(answer: (call: Call) => Result = () => ({ data: [], count: 0, error: null })) {
  const calls: Call[] = [];
  const client = {
    from(table: string) {
      const call: Call = { table, ops: [], single: false };
      calls.push(call);
      const builder: Record<string, unknown> = {
        select(columns: string, options?: Call["options"]) {
          call.columns = columns;
          call.options = options;
          return builder;
        },
        maybeSingle() {
          call.single = true;
          return builder;
        },
        then(onFulfilled: (value: Result) => unknown, onRejected: (reason: unknown) => unknown) {
          return Promise.resolve(answer(call)).then(onFulfilled, onRejected);
        },
      };
      for (const name of ["eq", "is", "in", "or", "gte", "order", "range", "limit"]) {
        builder[name] = (...args: unknown[]) => {
          call.ops.push([name, ...args]);
          return builder;
        };
      }
      return builder;
    },
  };
  return { client: client as never, calls };
}

function opsNamed(call: Call, name: string) {
  return call.ops.filter(([op]) => op === name);
}

function paramsFrom(query: string): ProspectListParams {
  const params = parseProspectListParams(new URLSearchParams(query));
  if (!params) throw new Error(`Expected valid params: ${query}`);
  return params;
}

/**
 * The grammar PostgREST applies to an `or` list: conditions split on top-level commas, a
 * value can be double-quoted, and inside quotes a backslash makes the next character literal.
 * Returns each condition with its quoted value decoded.
 */
function parseOrFilter(filter: string): { column: string; value: string }[] {
  const conditions: { column: string; value: string }[] = [];
  let rest = filter;
  while (rest.length > 0) {
    const open = rest.indexOf('"');
    const comma = rest.indexOf(",");
    if (open === -1 || (comma !== -1 && comma < open)) {
      const end = comma === -1 ? rest.length : comma;
      conditions.push({ column: rest.slice(0, end), value: "" });
      rest = rest.slice(end + 1);
      continue;
    }
    let value = "";
    let index = open + 1;
    while (rest[index] !== '"') {
      if (index >= rest.length) throw new Error("Unterminated quoted value");
      if (rest[index] === "\\") index += 1;
      value += rest[index];
      index += 1;
    }
    conditions.push({ column: rest.slice(0, open), value });
    const next = rest[index + 1];
    if (next !== undefined && next !== ",") throw new Error("Text after a quoted value");
    rest = rest.slice(index + 2);
  }
  return conditions;
}

describe("parseProspectListParams", () => {
  it("applies the defaults", () => {
    expect(paramsFrom("")).toEqual({ page: 1, pageSize: 25, sort: "created_at", dir: "desc" });
  });

  it("caps pageSize at 100", () => {
    expect(paramsFrom("pageSize=100").pageSize).toBe(100);
    expect(paramsFrom("pageSize=101").pageSize).toBe(100);
    expect(paramsFrom("pageSize=5000").pageSize).toBe(100);
  });

  it.each([
    "page=0",
    "page=-1",
    "page=abc",
    "page=1.5",
    "page=1e3",
    "page=9999999",
    "pageSize=0",
    "pageSize=-5",
    "pageSize=x",
    "sort=guardian_id",
    "sort=internal_notes",
    "sort=created_at;drop",
    "dir=sideways",
    "yearId=2027",
    "gradeId=not-a-uuid",
    "modalityId=1",
    "statusId=abc",
    "sourceId=abc",
    "campaignId=abc",
    "assignedTo=nobody",
    "assignedTo=UNASSIGNED",
  ])("rejects %s", (query) => {
    expect(parseProspectListParams(new URLSearchParams(query))).toBeNull();
  });

  it.each(["created_at", "last_contact_at", "student_name"])("allows sorting by %s", (sort) => {
    expect(paramsFrom(`sort=${sort}&dir=asc`)).toMatchObject({ sort, dir: "asc" });
  });

  it("accepts every filter", () => {
    const query = `yearId=${ID_A}&gradeId=${ID_A}&modalityId=${ID_A}&statusId=${ID_A}&sourceId=${ID_A}&campaignId=${ID_A}&assignedTo=${ID_B}`;
    expect(paramsFrom(query)).toMatchObject({
      yearId: ID_A,
      gradeId: ID_A,
      modalityId: ID_A,
      statusId: ID_A,
      sourceId: ID_A,
      campaignId: ID_A,
      assignedTo: ID_B,
    });
    expect(paramsFrom("assignedTo=unassigned").assignedTo).toBe("unassigned");
  });

  it("treats an empty parameter as absent", () => {
    expect(paramsFrom("statusId=&q=&assignedTo=")).toEqual(paramsFrom(""));
  });

  it("normalizes the search term and drops a blank one", () => {
    expect(paramsFrom("q=" + encodeURIComponent("  María   LÓPEZ ")).q).toBe("maría lópez");
    expect(paramsFrom("q=" + encodeURIComponent("   ")).q).toBeUndefined();
  });

  it("caps the length of q at 100 characters", () => {
    expect(paramsFrom(`q=${"a".repeat(100)}`).q).toHaveLength(100);
    expect(parseProspectListParams(new URLSearchParams(`q=${"a".repeat(101)}`))).toBeNull();
  });

  it("rejects control characters in q, which the database cannot store or compare", () => {
    expect(parseProspectListParams(new URLSearchParams("q=a%00b"))).toBeNull();
    expect(parseProspectListParams(new URLSearchParams("q=a%0Ab"))).toBeNull();
  });
});

describe("isValidProspectId", () => {
  it("accepts a uuid and rejects anything else", () => {
    expect(isValidProspectId(ID_A)).toBe(true);
    expect(isValidProspectId("abc")).toBe(false);
    expect(isValidProspectId(`${ID_A},${ID_B}`)).toBe(false);
    expect(isValidProspectId("")).toBe(false);
  });
});

describe("search escaping", () => {
  it.each([
    ["plain text", "ana", String.raw`"%ana%"`],
    ["a percent wildcard", "50%", String.raw`"%50\\%%"`],
    ["an underscore wildcard", "a_b", String.raw`"%a\\_b%"`],
    ["a backslash", String.raw`a\b`, String.raw`"%a\\\\b%"`],
    ["a double quote", 'a"b', String.raw`"%a\"b%"`],
    ["PostgREST's star alias, which it turns into %", "a*b", String.raw`"%a_b%"`],
    ["commas, dots, and parentheses", "a,b.c(d)", String.raw`"%a,b.c(d)%"`],
    ["a single quote", "o'neil", String.raw`"%o'neil%"`],
  ])("escapes %s", (_label, term, expected) => {
    expect(quotedContains(term)).toBe(expected);
  });

  it.each([
    'x",id.not.is.null,full_name.ilike."y',
    String.raw`x\",id.not.is.null,full_name.ilike.\"y`,
    "a),or(id.not.is.null",
    'x"',
    String.raw`x\\`,
    "a,b",
  ])("keeps %s inside one quoted value, so it cannot add a condition", (term) => {
    const conditions = parseOrFilter(buildGuardianSearchFilter(term));

    expect(conditions.map((c) => c.column)).toEqual([
      "full_name.ilike.",
      "email_normalized.ilike.",
    ]);
    expect(conditions[0].value).toContain(term.replace(/[\\%_]/g, "\\$&"));
  });

  it("never sends an unescaped wildcard", () => {
    const [condition] = parseOrFilter(buildGuardianSearchFilter("%_*"));

    expect(condition.value).toBe(String.raw`%\%\__%`);
    expect(condition.value).not.toContain("*");
  });
});

describe("buildGuardianSearchFilter", () => {
  it.each([
    ["9999-8888", "99998888"],
    ["+504 9999 8888", "50499998888"],
    ["00504 9999-8888", "50499998888"],
    ["(504) 9999.8888", "50499998888"],
    ["999", "999"],
  ])("searches the normalized phone by digits for %s", (term, digits) => {
    const conditions = parseOrFilter(buildGuardianSearchFilter(term));

    expect(conditions).toContainEqual({
      column: "phone_normalized.ilike.",
      value: `%${digits}%`,
    });
  });

  it.each(["maria", "ana 2", "ana 2027", "calle 12345", "12", "a-1", "ana@example.com"])(
    "does not search phones for %s, which would match on stray digits",
    (term) => {
      expect(buildGuardianSearchFilter(term)).not.toContain("phone_normalized");
    }
  );

  it("searches the guardian name and the normalized email", () => {
    const conditions = parseOrFilter(buildGuardianSearchFilter("ana@example.com"));

    expect(conditions).toEqual([
      { column: "full_name.ilike.", value: "%ana@example.com%" },
      { column: "email_normalized.ilike.", value: "%ana@example.com%" },
    ]);
  });
});

describe("listProspects", () => {
  const prospectRow = {
    id: ID_A,
    created_at: "2026-11-01T00:00:00Z",
    last_contact_at: null,
    student_name: "Luis",
    guardian: { full_name: "Ana", phone: "9999-8888", email: "ana@example.com" },
    grade: { id: "g", name: "Primero" },
    modality: null,
    status: { id: "s", name: "Nuevo" },
    source: { id: "o", name: "Sitio web" },
    assignee: { id: ID_B, full_name: "Marta" },
  };

  function prospectCall(calls: Call[]) {
    const call = calls.find((c) => c.table === "admissions_prospects");
    if (!call) throw new Error("No prospect query");
    return call;
  }

  const guardians = (data: unknown[]) => (call: Call): Result =>
    call.table === "admissions_guardians"
      ? { data, error: null }
      : { data: [], count: 0, error: null };

  it("maps rows and returns the paging data", async () => {
    const { client } = fakeClient(() => ({ data: [prospectRow], count: 41, error: null }));

    const result = await listProspects(client, paramsFrom("page=2&pageSize=10"));

    expect(result).toEqual({
      rows: [
        {
          id: ID_A,
          createdAt: "2026-11-01T00:00:00Z",
          lastContactAt: null,
          studentName: "Luis",
          guardian: { name: "Ana", phone: "9999-8888", email: "ana@example.com" },
          grade: { id: "g", name: "Primero" },
          modality: null,
          status: { id: "s", name: "Nuevo" },
          source: { id: "o", name: "Sitio web" },
          assignee: { id: ID_B, name: "Marta" },
        },
      ],
      total: 41,
      page: 2,
      pageSize: 10,
      searchTruncated: false,
    });
  });

  it("asks for an exact count and the requested range", async () => {
    const { client, calls } = fakeClient();

    await listProspects(client, paramsFrom("page=3&pageSize=10"));

    const call = prospectCall(calls);
    expect(call.options).toEqual({ count: "exact" });
    expect(opsNamed(call, "range")).toEqual([["range", 20, 29]]);
  });

  it("selects no internal notes, roles, or normalized contact columns in the list", async () => {
    const { client, calls } = fakeClient();

    await listProspects(client, paramsFrom(""));

    const columns = prospectCall(calls).columns ?? "";
    expect(columns).not.toContain("internal_notes");
    expect(columns).not.toContain("phone_normalized");
    expect(columns).not.toContain("role");
  });

  it("filters assignedTo=unassigned with IS NULL, not an equality", async () => {
    const { client, calls } = fakeClient();

    await listProspects(client, paramsFrom("assignedTo=unassigned"));

    const call = prospectCall(calls);
    expect(opsNamed(call, "is")).toEqual([["is", "assigned_to", null]]);
    expect(opsNamed(call, "eq")).toEqual([]);
  });

  it("maps each filter to its column", async () => {
    const { client, calls } = fakeClient();

    await listProspects(
      client,
      paramsFrom(
        `yearId=${ID_A}&gradeId=${ID_A}&modalityId=${ID_A}&statusId=${ID_A}&sourceId=${ID_A}&campaignId=${ID_A}&assignedTo=${ID_B}`
      )
    );

    expect(opsNamed(prospectCall(calls), "eq")).toEqual([
      ["eq", "academic_year_id", ID_A],
      ["eq", "grade_id", ID_A],
      ["eq", "modality_id", ID_A],
      ["eq", "status_id", ID_A],
      ["eq", "source_id", ID_A],
      ["eq", "campaign_id", ID_A],
      ["eq", "assigned_to", ID_B],
    ]);
  });

  it("defaults to newest first, with the id as a stable tiebreak", async () => {
    const { client, calls } = fakeClient();

    await listProspects(client, paramsFrom(""));

    expect(opsNamed(prospectCall(calls), "order")).toEqual([
      ["order", "created_at", { ascending: false, nullsFirst: false }],
      ["order", "id", { ascending: true }],
    ]);
  });

  it("sorts student_name on the normalized column, so case does not split the order", async () => {
    const { client, calls } = fakeClient();

    await listProspects(client, paramsFrom("sort=student_name&dir=asc"));

    expect(opsNamed(prospectCall(calls), "order")[0]).toEqual([
      "order",
      "student_name_normalized",
      { ascending: true, nullsFirst: false },
    ]);
  });

  it("does not query guardians without a search term", async () => {
    const { client, calls } = fakeClient();

    await listProspects(client, paramsFrom(""));

    expect(calls.map((c) => c.table)).toEqual(["admissions_prospects"]);
    expect(opsNamed(prospectCall(calls), "or")).toEqual([]);
  });

  it("searches guardians first, then ORs their ids with the student name", async () => {
    const { client, calls } = fakeClient(guardians([{ id: ID_A }, { id: ID_B }]));

    await listProspects(client, paramsFrom("q=ana"));

    expect(calls.map((c) => c.table)).toEqual(["admissions_guardians", "admissions_prospects"]);
    expect(opsNamed(calls[0], "or")).toEqual([
      ["or", 'full_name.ilike."%ana%",email_normalized.ilike."%ana%"'],
    ]);
    expect(opsNamed(prospectCall(calls), "or")).toEqual([
      ["or", `student_name_normalized.ilike."%ana%",guardian_id.in.(${ID_A},${ID_B})`],
    ]);
  });

  it("searches only the student name when no guardian matches", async () => {
    const { client, calls } = fakeClient(guardians([]));

    await listProspects(client, paramsFrom("q=ana"));

    expect(opsNamed(prospectCall(calls), "or")).toEqual([
      ["or", 'student_name_normalized.ilike."%ana%"'],
    ]);
  });

  it("escapes the term in the prospect filter too", async () => {
    const { client, calls } = fakeClient(guardians([]));

    await listProspects(client, paramsFrom("q=" + encodeURIComponent('a%",id.not.is.null')));

    const [[, filter]] = opsNamed(prospectCall(calls), "or");
    expect(parseOrFilter(filter as string)).toEqual([
      { column: "student_name_normalized.ilike.", value: String.raw`%a\%",id.not.is.null%` },
    ]);
  });

  it("limits the guardian ids and reports when the search was cut short", async () => {
    const many = Array.from({ length: GUARDIAN_SEARCH_LIMIT + 1 }, (_, index) => ({
      id: `id-${index}`,
    }));
    const { client, calls } = fakeClient(guardians(many));

    const result = await listProspects(client, paramsFrom("q=ana"));

    expect(opsNamed(calls[0], "limit")).toEqual([["limit", GUARDIAN_SEARCH_LIMIT + 1]]);
    expect(result.searchTruncated).toBe(true);
    const [[, filter]] = opsNamed(prospectCall(calls), "or");
    expect((filter as string).split(",")).toHaveLength(GUARDIAN_SEARCH_LIMIT + 1);
  });

  it("does not report truncation at exactly the limit", async () => {
    const exact = Array.from({ length: GUARDIAN_SEARCH_LIMIT }, (_, index) => ({ id: `id-${index}` }));
    const { client } = fakeClient(guardians(exact));

    expect((await listProspects(client, paramsFrom("q=ana"))).searchTruncated).toBe(false);
  });

  it("answers an empty page past the end instead of failing, keeping the filters", async () => {
    const { client, calls } = fakeClient((call) =>
      call.options?.head
        ? { data: null, count: 3, error: null }
        : { data: null, count: null, error: { code: "PGRST103" } }
    );

    const result = await listProspects(client, paramsFrom(`page=9&statusId=${ID_A}`));

    expect(result).toMatchObject({ rows: [], total: 3, page: 9 });
    expect(calls).toHaveLength(2);
    expect(opsNamed(calls[1], "eq")).toEqual([["eq", "status_id", ID_A]]);
  });

  it("throws only the code on a guardian search error", async () => {
    const { client, calls } = fakeClient(() => ({
      data: null,
      error: { code: "42501", message: "persona@example.com" },
    }));

    const failure = await listProspects(client, paramsFrom("q=ana")).catch((error) => error);

    expect(failure).toBeInstanceOf(AdmissionsQueryError);
    expect(failure.code).toBe("42501");
    expect(failure.message).not.toContain("persona@example.com");
    expect(calls).toHaveLength(1);
  });

  it("throws on a prospect error", async () => {
    const { client } = fakeClient(() => ({ data: null, count: null, error: { code: "57014" } }));

    await expect(listProspects(client, paramsFrom(""))).rejects.toBeInstanceOf(AdmissionsQueryError);
  });

  it("throws when the count is missing, rather than reporting zero", async () => {
    const { client } = fakeClient(() => ({ data: [], count: null, error: null }));

    await expect(listProspects(client, paramsFrom(""))).rejects.toBeInstanceOf(AdmissionsQueryError);
  });
});

describe("getProspect", () => {
  const row = {
    id: ID_A,
    created_at: "2026-11-01T00:00:00Z",
    updated_at: "2026-11-02T00:00:00Z",
    last_contact_at: null,
    closed_at: null,
    student_name: "Luis",
    wants_visit: true,
    internal_notes: "Nota",
    consent_to_contact: true,
    consent_at: "2026-11-01T00:00:00Z",
    privacy_notice_version: "2026-11",
    utm_source: "fb",
    utm_medium: "social",
    utm_campaign: "c1",
    landing_page: "/admisiones-2027",
    guardian: {
      id: ID_B,
      full_name: "Ana",
      phone: "9999-8888",
      email: "ana@example.com",
      preferred_contact_method: "whatsapp",
    },
    year: { id: "y", name: "2027" },
    grade: { id: "g", name: "Primero" },
    modality: { id: "m", name: "Bilingüe" },
    status: { id: "s", name: "Nuevo" },
    source: { id: "o", name: "Sitio web" },
    campaign: null,
    assignee: { id: "p", full_name: "Marta" },
  };

  it("queries one prospect by id and maps it", async () => {
    const { client, calls } = fakeClient(() => ({ data: row, error: null }));

    const result = await getProspect(client, ID_A);

    expect(opsNamed(calls[0], "eq")).toEqual([["eq", "id", ID_A]]);
    expect(calls[0].single).toBe(true);
    expect(result).toEqual({
      id: ID_A,
      createdAt: "2026-11-01T00:00:00Z",
      updatedAt: "2026-11-02T00:00:00Z",
      lastContactAt: null,
      closedAt: null,
      studentName: "Luis",
      wantsVisit: true,
      internalNotes: "Nota",
      consent: {
        toContact: true,
        at: "2026-11-01T00:00:00Z",
        privacyNoticeVersion: "2026-11",
      },
      origin: {
        utmSource: "fb",
        utmMedium: "social",
        utmCampaign: "c1",
        landingPage: "/admisiones-2027",
      },
      guardian: {
        id: ID_B,
        name: "Ana",
        phone: "9999-8888",
        email: "ana@example.com",
        preferredContactMethod: "whatsapp",
      },
      academicYear: { id: "y", name: "2027" },
      grade: { id: "g", name: "Primero" },
      modality: { id: "m", name: "Bilingüe" },
      status: { id: "s", name: "Nuevo" },
      source: { id: "o", name: "Sitio web" },
      campaign: null,
      assignee: { id: "p", name: "Marta" },
    });
  });

  it("leaves out D4 data", async () => {
    const { client, calls } = fakeClient(() => ({ data: row, error: null }));

    await getProspect(client, ID_A);

    for (const table of ["activities", "status_history", "tasks", "visits"]) {
      expect(calls[0].columns).not.toContain(table);
    }
  });

  it("returns null when not found", async () => {
    const { client } = fakeClient(() => ({ data: null, error: null }));

    await expect(getProspect(client, ID_A)).resolves.toBeNull();
  });

  it("throws on an error", async () => {
    const { client } = fakeClient(() => ({ data: null, error: { code: "XX000" } }));

    await expect(getProspect(client, ID_A)).rejects.toBeInstanceOf(AdmissionsQueryError);
  });
});

describe("loadDashboard", () => {
  const NOW = new Date("2026-11-08T12:00:00.000Z");
  const statuses = [
    { id: "s1", name: "Nuevo", sort_order: 1 },
    { id: "s2", name: "Contactado", sort_order: 2 },
  ];

  function answer(call: Call): Result {
    if (call.table === "admissions_statuses") return { data: statuses, error: null };
    const eq = opsNamed(call, "eq")[0];
    if (eq) return { data: null, count: eq[2] === "s1" ? 5 : 2, error: null };
    if (opsNamed(call, "gte").length) return { data: null, count: 3, error: null };
    if (opsNamed(call, "is").length) return { data: null, count: 4, error: null };
    throw new Error("Unexpected query");
  }

  it("returns counts per status, new in the last 7 days, and unassigned", async () => {
    const { client } = fakeClient(answer);

    await expect(loadDashboard(client, NOW)).resolves.toEqual({
      statuses: [
        { id: "s1", name: "Nuevo", sortOrder: 1, count: 5 },
        { id: "s2", name: "Contactado", sortOrder: 2, count: 2 },
      ],
      newLast7Days: 3,
      unassigned: 4,
    });
  });

  it("orders statuses by their sort order", async () => {
    const { client, calls } = fakeClient(answer);

    await loadDashboard(client, NOW);

    const call = calls.find((c) => c.table === "admissions_statuses");
    expect(opsNamed(call as Call, "order")).toEqual([["order", "sort_order", { ascending: true }]]);
  });

  it("counts with head requests only, never downloading prospect rows", async () => {
    const { client, calls } = fakeClient(answer);

    await loadDashboard(client, NOW);

    const prospectCalls = calls.filter((c) => c.table === "admissions_prospects");
    expect(prospectCalls).toHaveLength(4);
    for (const call of prospectCalls) {
      expect(call.options).toEqual({ count: "exact", head: true });
    }
  });

  it("measures the 7 days from the given time, and unassigned with IS NULL", async () => {
    const { client, calls } = fakeClient(answer);

    await loadDashboard(client, NOW);

    const prospectCalls = calls.filter((c) => c.table === "admissions_prospects");
    expect(prospectCalls.flatMap((c) => opsNamed(c, "gte"))).toEqual([
      ["gte", "created_at", "2026-11-01T12:00:00.000Z"],
    ]);
    expect(prospectCalls.flatMap((c) => opsNamed(c, "is"))).toEqual([["is", "assigned_to", null]]);
  });

  it("throws when a count fails, rather than reporting zero", async () => {
    const { client } = fakeClient((call) =>
      call.table === "admissions_statuses"
        ? { data: statuses, error: null }
        : { data: null, count: null, error: { code: "57014" } }
    );

    await expect(loadDashboard(client, NOW)).rejects.toBeInstanceOf(AdmissionsQueryError);
  });

  it("throws when a count is missing, rather than reporting zero", async () => {
    const { client } = fakeClient((call) =>
      call.table === "admissions_statuses"
        ? { data: statuses, error: null }
        : { data: null, count: null, error: null }
    );

    await expect(loadDashboard(client, NOW)).rejects.toBeInstanceOf(AdmissionsQueryError);
  });
});

describe("loadCatalogs", () => {
  const tables: Record<string, unknown[]> = {
    admissions_academic_years: [
      { id: "y", year: 2027, name: "2027", is_active: true, is_open_for_intake: true },
    ],
    admissions_grades: [
      { id: "g1", name: "Primero", level: "Primaria", sort_order: 1, is_active: true },
      { id: "g2", name: "Duodécimo", level: "Media", sort_order: 2, is_active: false },
    ],
    admissions_modalities: [
      { id: "m1", name: "Bilingüe", is_active: true },
      { id: "m2", name: "Antigua", is_active: false },
    ],
    admissions_grade_modalities: [
      { grade_id: "g1", modality_id: "m1" },
      { grade_id: "g1", modality_id: "m2" },
    ],
    admissions_statuses: [
      { id: "s", name: "Nuevo", sort_order: 1, is_terminal: false, is_active: true },
    ],
    admissions_sources: [{ id: "o", name: "Sitio web", is_active: true }],
    admissions_campaigns: [{ id: "c", code: "c1", name: "Campaña", is_active: false }],
    admissions_profiles: [{ id: "p", full_name: "Marta" }],
  };

  it("returns every catalog with the state the panel needs", async () => {
    const { client } = fakeClient((call) => ({ data: tables[call.table], error: null }));

    await expect(loadCatalogs(client)).resolves.toEqual({
      academicYears: [{ id: "y", year: 2027, name: "2027", isActive: true, isOpenForIntake: true }],
      grades: [
        {
          id: "g1",
          name: "Primero",
          level: "Primaria",
          sortOrder: 1,
          isActive: true,
          modalities: [{ id: "m1", name: "Bilingüe" }],
        },
        {
          id: "g2",
          name: "Duodécimo",
          level: "Media",
          sortOrder: 2,
          isActive: false,
          modalities: [],
        },
      ],
      modalities: [
        { id: "m1", name: "Bilingüe", isActive: true },
        { id: "m2", name: "Antigua", isActive: false },
      ],
      statuses: [{ id: "s", name: "Nuevo", sortOrder: 1, isTerminal: false, isActive: true }],
      sources: [{ id: "o", name: "Sitio web", isActive: true }],
      campaigns: [{ id: "c", code: "c1", name: "Campaña", isActive: false }],
      assignableStaff: [{ id: "p", name: "Marta" }],
    });
  });

  it("limits assignable staff to active editors, and to id and name", async () => {
    const { client, calls } = fakeClient((call) => ({ data: tables[call.table], error: null }));

    await loadCatalogs(client);

    const call = calls.find((c) => c.table === "admissions_profiles") as Call;
    expect(call.columns?.replace(/\s/g, "")).toBe("id,full_name");
    expect(opsNamed(call, "eq")).toEqual([["eq", "is_active", true]]);
    expect(opsNamed(call, "in")).toEqual([
      ["in", "role", ["admin", "admissions_manager", "admissions_agent"]],
    ]);
  });

  it("uses only active grade and modality pairs", async () => {
    const { client, calls } = fakeClient((call) => ({ data: tables[call.table], error: null }));

    await loadCatalogs(client);

    const call = calls.find((c) => c.table === "admissions_grade_modalities") as Call;
    expect(opsNamed(call, "eq")).toEqual([["eq", "is_active", true]]);
  });

  it("throws when any catalog fails", async () => {
    const { client } = fakeClient((call) =>
      call.table === "admissions_profiles"
        ? { data: null, error: { code: "42501" } }
        : { data: tables[call.table], error: null }
    );

    await expect(loadCatalogs(client)).rejects.toBeInstanceOf(AdmissionsQueryError);
  });
});

describe("responses", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("marks JSON responses no-store", async () => {
    const response = noStoreJson({ a: 1 }, 404);

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ a: 1 });
  });

  it("answers a generic Spanish 500 and logs only the code", async () => {
    const response = queryFailureResponse(new AdmissionsQueryError("42501"));

    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ error: "No se pudieron cargar los datos." });
    expect(vi.mocked(console.error).mock.calls.flat()).toContain("42501");
  });

  it("does not log or return a raw exception", async () => {
    const response = queryFailureResponse(new Error("persona@example.com"));

    expect(JSON.stringify(await response.json())).not.toContain("persona@example.com");
    const logged = vi.mocked(console.error).mock.calls.flat();
    expect(logged.some((entry) => entry instanceof Error)).toBe(false);
    expect(JSON.stringify(logged)).not.toContain("persona@example.com");
  });
});

describe("service-role isolation", () => {
  it.each([
    "src/lib/admissions/admin-queries.ts",
    "src/app/api/admisiones-admin/dashboard/route.ts",
    "src/app/api/admisiones-admin/prospects/route.ts",
    "src/app/api/admisiones-admin/prospects/[id]/route.ts",
    "src/app/api/admisiones-admin/catalogs/route.ts",
  ])("%s reaches no admin client, directly or through the catalog module", (path) => {
    const source = readFileSync(join(process.cwd(), path), "utf8");

    expect(source).not.toMatch(/supabase\/admin|createAdminClient|service_role|SERVICE_ROLE/);
    expect(source).not.toMatch(/from\s+["'](\.\/|@\/lib\/admissions\/)catalog["']/);
  });
});
