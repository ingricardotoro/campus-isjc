// Client-safe query string handling for the admissions prospect list. The URL is the source
// of truth for the filters, so links, reload, and back all keep them. Values the API would
// reject are dropped here, so a tampered URL shows the plain list instead of an error.
// The accepted values mirror `parseProspectListParams` in admin-queries.ts (server-only).

export const LIST_PATH = "/admisiones-admin/solicitudes";
export const LIST_PAGE_SIZE = 25;

const SEARCH_MAX_LENGTH = 100;
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const POSITIVE_INTEGER = /^[1-9]\d{0,5}$/;

export const SORT_FIELDS = ["created_at", "last_contact_at", "student_name"] as const;
export const SORT_DIRECTIONS = ["asc", "desc"] as const;

export type SortField = (typeof SORT_FIELDS)[number];
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export const ID_FILTER_KEYS = [
  "yearId",
  "gradeId",
  "modalityId",
  "statusId",
  "sourceId",
  "campaignId",
] as const;

type IdFilterKey = (typeof ID_FILTER_KEYS)[number];

export type ListFilters = { [K in IdFilterKey]?: string } & {
  q?: string;
  /** A staff id, or "unassigned". */
  assignedTo?: string;
  page: number;
  sort: SortField;
  dir: SortDirection;
};

export type FilterPatch = Partial<{ [K in keyof ListFilters]: ListFilters[K] | "" }>;

const DEFAULTS = { page: 1, sort: "created_at", dir: "desc" } as const;

/** Trims, collapses spaces, replaces control characters (the API rejects them), and caps the length. */
export function normalizeSearch(value: string): string {
  return value
    .replace(/\p{Cc}/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, SEARCH_MAX_LENGTH)
    .trim();
}

function isOneOf<T extends string>(values: readonly T[], value: string | null): value is T {
  return value !== null && (values as readonly string[]).includes(value);
}

export function readListFilters(params: URLSearchParams): ListFilters {
  const filters: ListFilters = { ...DEFAULTS };

  const q = normalizeSearch(params.get("q") ?? "");
  if (q) filters.q = q;

  for (const key of ID_FILTER_KEYS) {
    const value = params.get(key);
    if (value && GUID.test(value)) filters[key] = value;
  }

  const assignedTo = params.get("assignedTo");
  if (assignedTo === "unassigned" || (assignedTo && GUID.test(assignedTo))) {
    filters.assignedTo = assignedTo;
  }

  const page = params.get("page");
  if (page && POSITIVE_INTEGER.test(page)) filters.page = Number(page);

  const sort = params.get("sort");
  if (isOneOf(SORT_FIELDS, sort)) filters.sort = sort;

  const dir = params.get("dir");
  if (isOneOf(SORT_DIRECTIONS, dir)) filters.dir = dir;

  return filters;
}

function filterEntries(filters: ListFilters): [string, string][] {
  const entries: [string, string][] = [];
  if (filters.q) entries.push(["q", filters.q]);
  for (const key of ID_FILTER_KEYS) {
    const value = filters[key];
    if (value) entries.push([key, value]);
  }
  if (filters.assignedTo) entries.push(["assignedTo", filters.assignedTo]);
  return entries;
}

/** The page URL query. Defaults are left out, so the plain list has a clean URL. */
export function writeListFilters(filters: ListFilters): URLSearchParams {
  const params = new URLSearchParams(filterEntries(filters));
  if (filters.page !== DEFAULTS.page) params.set("page", String(filters.page));
  if (filters.sort !== DEFAULTS.sort) params.set("sort", filters.sort);
  if (filters.dir !== DEFAULTS.dir) params.set("dir", filters.dir);
  return params;
}

/** The query for GET /api/admisiones-admin/prospects. */
export function prospectsApiQuery(filters: ListFilters): string {
  const params = new URLSearchParams(filterEntries(filters));
  params.set("page", String(filters.page));
  params.set("pageSize", String(LIST_PAGE_SIZE));
  params.set("sort", filters.sort);
  params.set("dir", filters.dir);
  return params.toString();
}

/** Applies a change. Any change other than the page itself goes back to page 1. */
export function updateFilters(filters: ListFilters, patch: FilterPatch): ListFilters {
  const next: Record<string, unknown> = { ...filters };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || value === "") delete next[key];
    else next[key] = value;
  }
  const onlyPage = Object.keys(patch).every((key) => key === "page");
  if (!onlyPage || next.page === undefined) next.page = DEFAULTS.page;
  if (next.sort === undefined) next.sort = DEFAULTS.sort;
  if (next.dir === undefined) next.dir = DEFAULTS.dir;
  return next as ListFilters;
}

/** True when anything narrows the list. Page and sort do not count. */
export function hasActiveFilters(filters: ListFilters): boolean {
  return filterEntries(filters).length > 0;
}

export function listPathFor(filters: ListFilters): string {
  const query = writeListFilters(filters).toString();
  return query ? `${LIST_PATH}?${query}` : LIST_PATH;
}

/** A link to the list with only the given filters, for the dashboard. */
export function listHref(patch: FilterPatch): string {
  return listPathFor(updateFilters({ ...DEFAULTS }, patch));
}

export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

/**
 * Page buttons to show: the first, the last, and the neighbours of the current page.
 * A gap that would hide a single page shows that page instead.
 */
export function pageItems(current: number, totalPages: number): (number | "gap")[] {
  const pages = [...new Set([1, current - 1, current, current + 1, totalPages])]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  const items: (number | "gap")[] = [];
  pages.forEach((page, index) => {
    const previous = pages[index - 1];
    if (previous !== undefined && page - previous === 2) items.push(previous + 1);
    else if (previous !== undefined && page - previous > 2) items.push("gap");
    items.push(page);
  });
  return items;
}
