import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { phoneDigits } from "./schema";

// Read queries for the admissions admin panel. Every function takes the session client
// from requireAdmissionsAccess, so RLS applies. The service-role client must not be used here.

const SEARCH_MAX_LENGTH = 100;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const PHONE_SEARCH_MIN_DIGITS = 3;
const NEW_PROSPECT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Guardian ids travel in the request URL, at about 39 characters each once encoded, so 100 of
 * them take about 4 KB. 200 would take about 8 KB, and with the select list and the other
 * filters could exceed common 8 KB proxy limits. `searchTruncated` reports when the cap was hit.
 */
export const GUARDIAN_SEARCH_LIMIT = 100;

/** PostgREST answers 416 with this code when the offset is past the last row. */
const RANGE_NOT_SATISFIABLE = "PGRST103";

const QUERY_FAILED_MESSAGE = "No se pudieron cargar los datos.";

const ASSIGNABLE_ROLES = ["admin", "admissions_manager", "admissions_agent"];

const SORT_COLUMNS = {
  created_at: "created_at",
  last_contact_at: "last_contact_at",
  // The normalized column keeps "ana" and "Ana" together.
  student_name: "student_name_normalized",
} as const;

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

export function noStoreJson(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/** Carries only the database error code, because Supabase messages can hold personal data. */
export class AdmissionsQueryError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(`Admissions query failed: ${code}`);
    this.name = "AdmissionsQueryError";
    this.code = code;
  }
}

/** Generic 500. Logs only the error code, never the error itself. */
export function queryFailureResponse(error: unknown): NextResponse {
  const code = error instanceof AdmissionsQueryError ? error.code : "exception";
  console.error("[admissions] Admin query failed:", code);
  return noStoreJson({ error: QUERY_FAILED_MESSAGE }, 500);
}

type QueryResult<T> = {
  data: T | null;
  error: { code?: string } | null;
  count?: number | null;
};

function failure(error: { code?: string }): AdmissionsQueryError {
  return new AdmissionsQueryError(error.code || "unknown");
}

function rowsOf<T>(result: unknown): T[] {
  const { data, error } = result as QueryResult<T[]>;
  if (error) throw failure(error);
  return data ?? [];
}

/** A missing count is a failure: reporting zero would look like real data. */
function countOf(result: unknown): number {
  const { count, error } = result as QueryResult<unknown>;
  if (error) throw failure(error);
  if (typeof count !== "number") throw new AdmissionsQueryError("missing_count");
  return count;
}

// ---------------------------------------------------------------------------
// Parameters
// ---------------------------------------------------------------------------

const positiveInteger = z
  .string()
  .regex(/^[1-9]\d{0,5}$/)
  .transform(Number);

const prospectListParamsSchema = z.object({
  q: z
    .string()
    .max(SEARCH_MAX_LENGTH)
    .refine((value) => !/\p{Cc}/u.test(value))
    .transform((value) => value.trim().replace(/\s+/g, " ").toLowerCase())
    .transform((value) => value || undefined)
    .optional(),
  yearId: z.guid().optional(),
  gradeId: z.guid().optional(),
  modalityId: z.guid().optional(),
  statusId: z.guid().optional(),
  sourceId: z.guid().optional(),
  campaignId: z.guid().optional(),
  assignedTo: z.union([z.literal("unassigned"), z.guid()]).optional(),
  page: positiveInteger.default(1),
  pageSize: positiveInteger
    .transform((value) => Math.min(value, MAX_PAGE_SIZE))
    .default(DEFAULT_PAGE_SIZE),
  sort: z.enum(["created_at", "last_contact_at", "student_name"]).default("created_at"),
  dir: z.enum(["asc", "desc"]).default("desc"),
});

export type ProspectListParams = z.infer<typeof prospectListParamsSchema>;

/** Returns null for invalid parameters. An empty parameter counts as absent. */
export function parseProspectListParams(searchParams: URLSearchParams): ProspectListParams | null {
  const present = [...searchParams.entries()].filter(([, value]) => value !== "");
  const parsed = prospectListParamsSchema.safeParse(Object.fromEntries(present));
  if (!parsed.success) return null;

  const params = { ...parsed.data };
  if (params.q === undefined) delete params.q;
  return params;
}

export function isValidProspectId(id: string): boolean {
  return z.guid().safeParse(id).success;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/**
 * Builds a double-quoted "contains" pattern for an `ilike` inside a PostgREST `or` list.
 * Escaping happens at two levels, because the value is read twice:
 *
 * 1. Postgres LIKE: a backslash makes %, _, and backslash literal.
 * 2. PostgREST: inside double quotes, a backslash makes the next character literal. This
 *    level also consumes the backslashes of level 1, so they must be doubled. The quotes
 *    are what keep commas, dots, and parentheses from being read as filter syntax.
 *
 * PostgREST also turns every * in a like pattern into %, with no way to escape it, so a
 * literal * is sent as the single-character wildcard, which still matches it.
 */
export function quotedContains(term: string): string {
  const likePattern = term.replace(/[\\%_]/g, "\\$&").replace(/\*/g, "_");
  return `"${`%${likePattern}%`.replace(/[\\"]/g, "\\$&")}"`;
}

/**
 * Folds a name search term the way public.admissions_fold_name folds the stored names
 * (migration 20261105000100): decomposed, combining marks removed, lower-cased. For
 * Spanish that drops the acute accent and the dieresis and turns ñ into n, so "maria"
 * finds "María". The database side uses unaccent, which also expands a few non-Spanish
 * letters such as ß and æ that this leaves alone.
 */
export function foldSearchName(term: string): string {
  return term.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/** Same characters the public form accepts in a phone number. */
function phoneSearchDigits(term: string): string | null {
  if (!/^[0-9+()\-.\s]+$/.test(term)) return null;
  const digits = phoneDigits(term);
  return digits.length >= PHONE_SEARCH_MIN_DIGITS ? digits : null;
}

/**
 * Phones are searched by digits in phone_normalized, so "9999-8888" finds a number stored
 * as "+504 9999 8888". That column prefixes 8-digit numbers with 504, which a substring
 * match tolerates. Only terms that look like a phone number reach this column; otherwise
 * "ana 2" would match every phone holding a 2. Names are searched without accents; the
 * email is searched as typed.
 */
export function buildGuardianSearchFilter(term: string): string {
  const conditions = [
    `full_name_search.ilike.${quotedContains(foldSearchName(term))}`,
    `email_normalized.ilike.${quotedContains(term)}`,
  ];
  const digits = phoneSearchDigits(term);
  if (digits) conditions.push(`phone_normalized.ilike."%${digits}%"`);
  return conditions.join(",");
}

async function searchGuardianIds(
  supabase: SupabaseClient,
  term: string
): Promise<{ ids: string[]; truncated: boolean }> {
  const rows = rowsOf<{ id: string }>(
    await supabase
      .from("admissions_guardians")
      .select("id")
      .or(buildGuardianSearchFilter(term))
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .limit(GUARDIAN_SEARCH_LIMIT + 1)
  );
  return {
    ids: rows.slice(0, GUARDIAN_SEARCH_LIMIT).map((row) => row.id),
    truncated: rows.length > GUARDIAN_SEARCH_LIMIT,
  };
}

// ---------------------------------------------------------------------------
// Prospect list
// ---------------------------------------------------------------------------

type NamedRef = { id: string; name: string };
type AssigneeRow = { id: string; full_name: string };

const LIST_COLUMNS = `
  id,
  created_at,
  last_contact_at,
  student_name,
  guardian:admissions_guardians!admissions_prospects_guardian_id_fkey(full_name, phone, email),
  grade:admissions_grades!admissions_prospects_grade_id_fkey(id, name),
  modality:admissions_modalities!admissions_prospects_modality_id_fkey(id, name),
  status:admissions_statuses!admissions_prospects_status_id_fkey(id, name),
  source:admissions_sources!admissions_prospects_source_id_fkey(id, name),
  assignee:admissions_profiles!admissions_prospects_assigned_to_fkey(id, full_name)
`;

type ProspectListRow = {
  id: string;
  created_at: string;
  last_contact_at: string | null;
  student_name: string | null;
  guardian: { full_name: string; phone: string | null; email: string | null };
  grade: NamedRef;
  modality: NamedRef | null;
  status: NamedRef;
  source: NamedRef;
  assignee: AssigneeRow | null;
};

export type ProspectListItem = {
  id: string;
  createdAt: string;
  lastContactAt: string | null;
  studentName: string | null;
  guardian: { name: string; phone: string | null; email: string | null };
  grade: NamedRef;
  modality: NamedRef | null;
  status: NamedRef;
  source: NamedRef;
  assignee: NamedRef | null;
};

export type ProspectList = {
  rows: ProspectListItem[];
  total: number;
  page: number;
  pageSize: number;
  /** True when more guardians matched than the search can carry: ask for a narrower term. */
  searchTruncated: boolean;
};

function toAssignee(row: AssigneeRow | null): NamedRef | null {
  return row ? { id: row.id, name: row.full_name } : null;
}

function toListItem(row: ProspectListRow): ProspectListItem {
  return {
    id: row.id,
    createdAt: row.created_at,
    lastContactAt: row.last_contact_at,
    studentName: row.student_name,
    guardian: {
      name: row.guardian.full_name,
      phone: row.guardian.phone,
      email: row.guardian.email,
    },
    grade: row.grade,
    modality: row.modality,
    status: row.status,
    source: row.source,
    assignee: toAssignee(row.assignee),
  };
}

function filteredProspects(
  supabase: SupabaseClient,
  params: ProspectListParams,
  guardianIds: string[],
  columns: string,
  options: { count: "exact"; head?: boolean }
) {
  let query = supabase.from("admissions_prospects").select(columns, options);

  if (params.yearId) query = query.eq("academic_year_id", params.yearId);
  if (params.gradeId) query = query.eq("grade_id", params.gradeId);
  if (params.modalityId) query = query.eq("modality_id", params.modalityId);
  if (params.statusId) query = query.eq("status_id", params.statusId);
  if (params.sourceId) query = query.eq("source_id", params.sourceId);
  if (params.campaignId) query = query.eq("campaign_id", params.campaignId);

  if (params.assignedTo === "unassigned") query = query.is("assigned_to", null);
  else if (params.assignedTo) query = query.eq("assigned_to", params.assignedTo);

  if (params.q) {
    const conditions = [`student_name_search.ilike.${quotedContains(foldSearchName(params.q))}`];
    if (guardianIds.length > 0) conditions.push(`guardian_id.in.(${guardianIds.join(",")})`);
    query = query.or(conditions.join(","));
  }

  return query;
}

/**
 * `q` spans two tables, and a PostgREST `or` cannot, so matching guardians are found first
 * and their ids are ORed with the student name condition.
 */
export async function listProspects(
  supabase: SupabaseClient,
  params: ProspectListParams
): Promise<ProspectList> {
  const search = params.q
    ? await searchGuardianIds(supabase, params.q)
    : { ids: [], truncated: false };

  const from = (params.page - 1) * params.pageSize;
  const result = await filteredProspects(supabase, params, search.ids, LIST_COLUMNS, {
    count: "exact",
  })
    .order(SORT_COLUMNS[params.sort], { ascending: params.dir === "asc", nullsFirst: false })
    .order("id", { ascending: true })
    .range(from, from + params.pageSize - 1);

  const paging = {
    page: params.page,
    pageSize: params.pageSize,
    searchTruncated: search.truncated,
  };

  // A stale page, for example after a deletion, is an empty page and not a failure.
  if (result.error?.code === RANGE_NOT_SATISFIABLE) {
    const total = countOf(
      await filteredProspects(supabase, params, search.ids, "id", { count: "exact", head: true })
    );
    return { rows: [], total, ...paging };
  }

  const rows = rowsOf<ProspectListRow>(result);
  return { rows: rows.map(toListItem), total: countOf(result), ...paging };
}

// ---------------------------------------------------------------------------
// Prospect detail
// ---------------------------------------------------------------------------

const DETAIL_COLUMNS = `
  id,
  created_at,
  updated_at,
  last_contact_at,
  closed_at,
  student_name,
  wants_visit,
  internal_notes,
  consent_to_contact,
  consent_at,
  privacy_notice_version,
  utm_source,
  utm_medium,
  utm_campaign,
  landing_page,
  guardian:admissions_guardians!admissions_prospects_guardian_id_fkey(id, full_name, phone, email, preferred_contact_method),
  year:admissions_academic_years!admissions_prospects_academic_year_id_fkey(id, name),
  grade:admissions_grades!admissions_prospects_grade_id_fkey(id, name),
  modality:admissions_modalities!admissions_prospects_modality_id_fkey(id, name),
  status:admissions_statuses!admissions_prospects_status_id_fkey(id, name),
  source:admissions_sources!admissions_prospects_source_id_fkey(id, name),
  campaign:admissions_campaigns!admissions_prospects_campaign_id_fkey(id, name),
  assignee:admissions_profiles!admissions_prospects_assigned_to_fkey(id, full_name)
`;

type ProspectDetailRow = {
  id: string;
  created_at: string;
  updated_at: string;
  last_contact_at: string | null;
  closed_at: string | null;
  student_name: string | null;
  wants_visit: boolean;
  internal_notes: string | null;
  consent_to_contact: boolean;
  consent_at: string | null;
  privacy_notice_version: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  landing_page: string | null;
  guardian: {
    id: string;
    full_name: string;
    phone: string | null;
    email: string | null;
    preferred_contact_method: string | null;
  };
  year: NamedRef;
  grade: NamedRef;
  modality: NamedRef | null;
  status: NamedRef;
  source: NamedRef;
  campaign: NamedRef | null;
  assignee: AssigneeRow | null;
};

export type ProspectDetail = {
  id: string;
  createdAt: string;
  updatedAt: string;
  lastContactAt: string | null;
  closedAt: string | null;
  studentName: string | null;
  wantsVisit: boolean;
  internalNotes: string | null;
  consent: { toContact: boolean; at: string | null; privacyNoticeVersion: string | null };
  origin: {
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
    landingPage: string | null;
  };
  guardian: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    preferredContactMethod: string | null;
  };
  academicYear: NamedRef;
  grade: NamedRef;
  modality: NamedRef | null;
  status: NamedRef;
  source: NamedRef;
  campaign: NamedRef | null;
  assignee: NamedRef | null;
};

/** Returns null when the prospect does not exist. */
export async function getProspect(
  supabase: SupabaseClient,
  id: string
): Promise<ProspectDetail | null> {
  const { data, error } = (await supabase
    .from("admissions_prospects")
    .select(DETAIL_COLUMNS)
    .eq("id", id)
    .maybeSingle()) as unknown as QueryResult<ProspectDetailRow>;

  if (error) throw failure(error);
  if (!data) return null;

  return {
    id: data.id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    lastContactAt: data.last_contact_at,
    closedAt: data.closed_at,
    studentName: data.student_name,
    wantsVisit: data.wants_visit,
    internalNotes: data.internal_notes,
    consent: {
      toContact: data.consent_to_contact,
      at: data.consent_at,
      privacyNoticeVersion: data.privacy_notice_version,
    },
    origin: {
      utmSource: data.utm_source,
      utmMedium: data.utm_medium,
      utmCampaign: data.utm_campaign,
      landingPage: data.landing_page,
    },
    guardian: {
      id: data.guardian.id,
      name: data.guardian.full_name,
      phone: data.guardian.phone,
      email: data.guardian.email,
      preferredContactMethod: data.guardian.preferred_contact_method,
    },
    academicYear: data.year,
    grade: data.grade,
    modality: data.modality,
    status: data.status,
    source: data.source,
    campaign: data.campaign,
    assignee: toAssignee(data.assignee),
  };
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export type AdmissionsDashboard = {
  statuses: { id: string; name: string; sortOrder: number; count: number }[];
  newLast7Days: number;
  unassigned: number;
};

export async function loadDashboard(
  supabase: SupabaseClient,
  now: Date = new Date()
): Promise<AdmissionsDashboard> {
  const statuses = rowsOf<{ id: string; name: string; sort_order: number }>(
    await supabase
      .from("admissions_statuses")
      .select("id, name, sort_order")
      .order("sort_order", { ascending: true })
  );

  const headCount = () =>
    supabase.from("admissions_prospects").select("id", { count: "exact", head: true });
  const since = new Date(now.getTime() - NEW_PROSPECT_WINDOW_MS).toISOString();

  const [perStatus, recent, unassigned] = await Promise.all([
    Promise.all(statuses.map((status) => headCount().eq("status_id", status.id))),
    headCount().gte("created_at", since),
    headCount().is("assigned_to", null),
  ]);

  return {
    statuses: statuses.map((status, index) => ({
      id: status.id,
      name: status.name,
      sortOrder: status.sort_order,
      count: countOf(perStatus[index]),
    })),
    newLast7Days: countOf(recent),
    unassigned: countOf(unassigned),
  };
}

// ---------------------------------------------------------------------------
// Catalogs
// ---------------------------------------------------------------------------

export type AdmissionsAdminCatalogs = {
  academicYears: {
    id: string;
    year: number;
    name: string;
    isActive: boolean;
    isOpenForIntake: boolean;
  }[];
  grades: {
    id: string;
    name: string;
    level: string;
    sortOrder: number;
    isActive: boolean;
    modalities: NamedRef[];
  }[];
  modalities: { id: string; name: string; isActive: boolean }[];
  statuses: { id: string; name: string; sortOrder: number; isTerminal: boolean; isActive: boolean }[];
  sources: { id: string; name: string; isActive: boolean }[];
  campaigns: { id: string; code: string; name: string; isActive: boolean }[];
  assignableStaff: NamedRef[];
};

/**
 * Inactive entries are included and marked, because existing prospects can still use them
 * and the filters must reach those prospects. Edit forms should offer active entries only.
 * A grade's `modalities` lists only what can be chosen today: active pairs of active modalities.
 */
export async function loadCatalogs(supabase: SupabaseClient): Promise<AdmissionsAdminCatalogs> {
  const [years, grades, modalities, pairs, statuses, sources, campaigns, staff] = await Promise.all([
    supabase
      .from("admissions_academic_years")
      .select("id, year, name, is_active, is_open_for_intake")
      .order("year", { ascending: false }),
    supabase
      .from("admissions_grades")
      .select("id, name, level, sort_order, is_active")
      .order("sort_order", { ascending: true }),
    supabase
      .from("admissions_modalities")
      .select("id, name, is_active")
      .order("name", { ascending: true }),
    supabase
      .from("admissions_grade_modalities")
      .select("grade_id, modality_id")
      .eq("is_active", true),
    supabase
      .from("admissions_statuses")
      .select("id, name, sort_order, is_terminal, is_active")
      .order("sort_order", { ascending: true }),
    supabase
      .from("admissions_sources")
      .select("id, name, is_active")
      .order("name", { ascending: true }),
    supabase
      .from("admissions_campaigns")
      .select("id, code, name, is_active")
      .order("name", { ascending: true }),
    supabase
      .from("admissions_profiles")
      .select("id, full_name")
      .eq("is_active", true)
      .in("role", ASSIGNABLE_ROLES)
      .order("full_name", { ascending: true }),
  ]);

  const modalityRows = rowsOf<{ id: string; name: string; is_active: boolean }>(modalities);
  const pairRows = rowsOf<{ grade_id: string; modality_id: string }>(pairs);

  const modalitiesForGrade = (gradeId: string): NamedRef[] =>
    modalityRows
      .filter((modality) => modality.is_active)
      .filter((modality) =>
        pairRows.some((pair) => pair.grade_id === gradeId && pair.modality_id === modality.id)
      )
      .map(({ id, name }) => ({ id, name }));

  return {
    academicYears: rowsOf<{
      id: string;
      year: number;
      name: string;
      is_active: boolean;
      is_open_for_intake: boolean;
    }>(years).map((row) => ({
      id: row.id,
      year: row.year,
      name: row.name,
      isActive: row.is_active,
      isOpenForIntake: row.is_open_for_intake,
    })),
    grades: rowsOf<{
      id: string;
      name: string;
      level: string;
      sort_order: number;
      is_active: boolean;
    }>(grades).map((row) => ({
      id: row.id,
      name: row.name,
      level: row.level,
      sortOrder: row.sort_order,
      isActive: row.is_active,
      modalities: modalitiesForGrade(row.id),
    })),
    modalities: modalityRows.map((row) => ({
      id: row.id,
      name: row.name,
      isActive: row.is_active,
    })),
    statuses: rowsOf<{
      id: string;
      name: string;
      sort_order: number;
      is_terminal: boolean;
      is_active: boolean;
    }>(statuses).map((row) => ({
      id: row.id,
      name: row.name,
      sortOrder: row.sort_order,
      isTerminal: row.is_terminal,
      isActive: row.is_active,
    })),
    sources: rowsOf<{ id: string; name: string; is_active: boolean }>(sources).map((row) => ({
      id: row.id,
      name: row.name,
      isActive: row.is_active,
    })),
    campaigns: rowsOf<{ id: string; code: string; name: string; is_active: boolean }>(campaigns).map(
      (row) => ({ id: row.id, code: row.code, name: row.name, isActive: row.is_active })
    ),
    assignableStaff: rowsOf<AssigneeRow>(staff).map((row) => ({ id: row.id, name: row.full_name })),
  };
}
