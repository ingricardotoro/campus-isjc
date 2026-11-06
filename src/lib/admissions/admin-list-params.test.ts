import { describe, expect, it } from "vitest";
import {
  LIST_PAGE_SIZE,
  hasActiveFilters,
  listHref,
  pageItems,
  pageCount,
  prospectsApiQuery,
  readListFilters,
  updateFilters,
  writeListFilters,
} from "./admin-list-params";

const GUID_A = "11111111-1111-4111-8111-111111111111";
const GUID_B = "22222222-2222-4222-8222-222222222222";

describe("readListFilters", () => {
  it("returns the defaults for an empty query", () => {
    expect(readListFilters(new URLSearchParams())).toEqual({
      page: 1,
      sort: "created_at",
      dir: "desc",
    });
  });

  it("keeps valid ids, search, page, and sort", () => {
    const filters = readListFilters(
      new URLSearchParams({
        q: "  Ana   María ",
        yearId: GUID_A,
        gradeId: GUID_B,
        modalityId: GUID_A,
        statusId: GUID_B,
        sourceId: GUID_A,
        campaignId: GUID_B,
        assignedTo: "unassigned",
        page: "3",
        sort: "student_name",
        dir: "asc",
      })
    );
    expect(filters).toEqual({
      q: "Ana María",
      yearId: GUID_A,
      gradeId: GUID_B,
      modalityId: GUID_A,
      statusId: GUID_B,
      sourceId: GUID_A,
      campaignId: GUID_B,
      assignedTo: "unassigned",
      page: 3,
      sort: "student_name",
      dir: "asc",
    });
  });

  it("drops values the API would reject instead of failing the whole list", () => {
    const filters = readListFilters(
      new URLSearchParams({
        statusId: "not-a-guid",
        assignedTo: "nobody",
        page: "0",
        sort: "guardian",
        dir: "sideways",
        q: "   ",
      })
    );
    expect(filters).toEqual({ page: 1, sort: "created_at", dir: "desc" });
  });

  it("rejects a page that is not a plain positive integer", () => {
    for (const page of ["-2", "1.5", "abc", "01", "9999999"]) {
      expect(readListFilters(new URLSearchParams({ page })).page).toBe(1);
    }
  });

  it("replaces control characters and caps the search at 100 characters", () => {
    expect(readListFilters(new URLSearchParams({ q: "ana\tlopez" })).q).toBe("ana lopez");
    expect(readListFilters(new URLSearchParams({ q: "x".repeat(150) })).q).toHaveLength(100);
  });

  it("accepts an assignee id", () => {
    expect(readListFilters(new URLSearchParams({ assignedTo: GUID_A })).assignedTo).toBe(GUID_A);
  });
});

describe("writeListFilters", () => {
  it("omits defaults so the plain list has a clean URL", () => {
    expect(writeListFilters({ page: 1, sort: "created_at", dir: "desc" }).toString()).toBe("");
  });

  it("round-trips through readListFilters", () => {
    const filters = readListFilters(
      new URLSearchParams({ q: "50% a_b", statusId: GUID_A, page: "2", sort: "last_contact_at", dir: "asc" })
    );
    expect(readListFilters(writeListFilters(filters))).toEqual(filters);
  });

  it("writes the search with standard encoding", () => {
    expect(writeListFilters({ q: 'a*b "c"', page: 1, sort: "created_at", dir: "desc" }).get("q")).toBe(
      'a*b "c"'
    );
  });
});

describe("prospectsApiQuery", () => {
  it("always sends the page, page size, and sort", () => {
    const query = new URLSearchParams(
      prospectsApiQuery({ statusId: GUID_A, page: 1, sort: "created_at", dir: "desc" })
    );
    expect(Object.fromEntries(query)).toEqual({
      statusId: GUID_A,
      page: "1",
      pageSize: String(LIST_PAGE_SIZE),
      sort: "created_at",
      dir: "desc",
    });
    expect(LIST_PAGE_SIZE).toBe(25);
  });
});

describe("updateFilters", () => {
  const base = { statusId: GUID_A, page: 4, sort: "created_at", dir: "desc" } as const;

  it("goes back to the first page when a filter changes", () => {
    expect(updateFilters(base, { gradeId: GUID_B })).toEqual({ ...base, gradeId: GUID_B, page: 1 });
  });

  it("removes a filter set to undefined or an empty string", () => {
    expect(updateFilters(base, { statusId: undefined })).toEqual({
      page: 1,
      sort: "created_at",
      dir: "desc",
    });
    expect(updateFilters(base, { statusId: "" })).not.toHaveProperty("statusId");
  });

  it("keeps the other filters when only the page changes", () => {
    expect(updateFilters(base, { page: 2 })).toEqual({ ...base, page: 2 });
  });
});

describe("hasActiveFilters", () => {
  it("ignores page and sort", () => {
    expect(hasActiveFilters({ page: 3, sort: "student_name", dir: "asc" })).toBe(false);
    expect(hasActiveFilters({ q: "ana", page: 1, sort: "created_at", dir: "desc" })).toBe(true);
    expect(hasActiveFilters({ assignedTo: "unassigned", page: 1, sort: "created_at", dir: "desc" })).toBe(
      true
    );
  });
});

describe("listHref", () => {
  it("builds a list link with only the given filter", () => {
    expect(listHref({ statusId: GUID_A })).toBe(`/admisiones-admin/solicitudes?statusId=${GUID_A}`);
    expect(listHref({ assignedTo: "unassigned" })).toBe(
      "/admisiones-admin/solicitudes?assignedTo=unassigned"
    );
    expect(listHref({})).toBe("/admisiones-admin/solicitudes");
  });
});

describe("pageCount", () => {
  it("rounds up and never goes below one", () => {
    expect(pageCount(0, 25)).toBe(1);
    expect(pageCount(25, 25)).toBe(1);
    expect(pageCount(26, 25)).toBe(2);
  });
});

describe("pageItems", () => {
  it("lists every page when there are few", () => {
    expect(pageItems(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("keeps the first, last, and neighbours, with gaps", () => {
    expect(pageItems(10, 20)).toEqual([1, "gap", 9, 10, 11, "gap", 20]);
  });

  it("does not leave a gap of a single page", () => {
    expect(pageItems(3, 20)).toEqual([1, 2, 3, 4, "gap", 20]);
    expect(pageItems(18, 20)).toEqual([1, "gap", 17, 18, 19, 20]);
  });
});
