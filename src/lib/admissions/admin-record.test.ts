import { describe, expect, it } from "vitest";
import type { AdmissionsAdminCatalogs, ProspectDetail } from "./admin-queries";
import {
  DELETE_CONFIRMATION_WORD,
  assigneeOptions,
  backToListHref,
  confirmationMatches,
  gradeOptions,
  guardianFormFrom,
  guardianPatch,
  interpretDeleteResponse,
  interpretDetailResponse,
  interpretSaveResponse,
  isModalityOffered,
  mailtoHref,
  modalityAfterGradeChange,
  modalityOptions,
  prospectFormErrors,
  prospectFormFrom,
  prospectPatch,
  recordHref,
  statusOptions,
  telHref,
  whatsappHref,
} from "./admin-record";

const ids = {
  status: "00000000-0000-4000-8000-000000000001",
  statusOld: "00000000-0000-4000-8000-000000000002",
  statusOther: "00000000-0000-4000-8000-000000000003",
  grade1: "00000000-0000-4000-8000-000000000011",
  grade2: "00000000-0000-4000-8000-000000000012",
  gradeOld: "00000000-0000-4000-8000-000000000013",
  bilingual: "00000000-0000-4000-8000-000000000021",
  spanish: "00000000-0000-4000-8000-000000000022",
  staffA: "00000000-0000-4000-8000-000000000031",
  staffB: "00000000-0000-4000-8000-000000000032",
  staffGone: "00000000-0000-4000-8000-000000000033",
};

function detail(overrides: Partial<ProspectDetail> = {}): ProspectDetail {
  return {
    id: "00000000-0000-4000-8000-0000000000aa",
    createdAt: "2026-11-01T10:00:00Z",
    updatedAt: "2026-11-01T10:00:00Z",
    lastContactAt: null,
    closedAt: null,
    studentName: "Ana López",
    wantsVisit: false,
    internalNotes: null,
    consent: { toContact: true, at: "2026-11-01T10:00:00Z", privacyNoticeVersion: "v1" },
    origin: { utmSource: null, utmMedium: null, utmCampaign: null, landingPage: null },
    guardian: {
      id: "00000000-0000-4000-8000-0000000000bb",
      name: "María López",
      phone: "9999-8888",
      email: "maria@example.com",
      preferredContactMethod: "whatsapp",
    },
    academicYear: { id: "y", name: "2027" },
    grade: { id: ids.grade1, name: "Primer grado" },
    modality: { id: ids.bilingual, name: "Bilingüe" },
    status: { id: ids.status, name: "Nuevo" },
    source: { id: "s", name: "Sitio web" },
    campaign: null,
    assignee: null,
    ...overrides,
  };
}

const catalogs: AdmissionsAdminCatalogs = {
  academicYears: [],
  grades: [
    {
      id: ids.grade2,
      name: "Segundo grado",
      level: "primary",
      sortOrder: 2,
      isActive: true,
      modalities: [{ id: ids.spanish, name: "Español" }],
    },
    {
      id: ids.grade1,
      name: "Primer grado",
      level: "primary",
      sortOrder: 1,
      isActive: true,
      modalities: [
        { id: ids.bilingual, name: "Bilingüe" },
        { id: ids.spanish, name: "Español" },
      ],
    },
    {
      id: ids.gradeOld,
      name: "Duodécimo",
      level: "high",
      sortOrder: 12,
      isActive: false,
      modalities: [],
    },
  ],
  modalities: [],
  statuses: [
    { id: ids.statusOther, name: "Contactado", sortOrder: 2, isTerminal: false, isActive: true },
    { id: ids.status, name: "Nuevo", sortOrder: 1, isTerminal: false, isActive: true },
    { id: ids.statusOld, name: "Archivado", sortOrder: 9, isTerminal: true, isActive: false },
  ],
  sources: [],
  campaigns: [],
  assignableStaff: [
    { id: ids.staffA, name: "Ana Staff" },
    { id: ids.staffB, name: "Beto Staff" },
  ],
};

describe("prospectPatch", () => {
  it("sends nothing when nothing changed", () => {
    const initial = prospectFormFrom(detail());
    expect(prospectPatch(initial, { ...initial })).toEqual({});
  });

  it("sends only the changed fields", () => {
    const initial = prospectFormFrom(detail());
    expect(prospectPatch(initial, { ...initial, statusId: ids.statusOther })).toEqual({
      statusId: ids.statusOther,
    });
  });

  it("sends an unassigned prospect as null and a new assignee as its id", () => {
    const assigned = prospectFormFrom(detail({ assignee: { id: ids.staffA, name: "Ana Staff" } }));
    expect(prospectPatch(assigned, { ...assigned, assignedTo: "" })).toEqual({ assignedTo: null });

    const unassigned = prospectFormFrom(detail());
    expect(prospectPatch(unassigned, { ...unassigned, assignedTo: ids.staffB })).toEqual({
      assignedTo: ids.staffB,
    });
  });

  it("sends a cleared modality as null", () => {
    const initial = prospectFormFrom(detail());
    expect(prospectPatch(initial, { ...initial, gradeId: ids.grade2, modalityId: "" })).toEqual({
      gradeId: ids.grade2,
      modalityId: null,
    });
  });

  it("ignores spacing-only edits and trims the texts it sends", () => {
    const initial = prospectFormFrom(detail({ internalNotes: "Llamar el lunes" }));
    expect(
      prospectPatch(initial, {
        ...initial,
        studentName: "  Ana López ",
        internalNotes: "Llamar el lunes\n",
      })
    ).toEqual({});
    expect(prospectPatch(initial, { ...initial, studentName: " Ana María " })).toEqual({
      studentName: "Ana María",
    });
  });

  it("sends a cleared text as null", () => {
    const initial = prospectFormFrom(detail({ internalNotes: "Algo" }));
    expect(prospectPatch(initial, { ...initial, internalNotes: "   ", studentName: "" })).toEqual({
      internalNotes: null,
      studentName: null,
    });
  });
});

describe("guardianPatch", () => {
  it("sends nothing when nothing changed", () => {
    const initial = guardianFormFrom(detail());
    expect(guardianPatch(initial, { ...initial })).toEqual({});
  });

  it("sends only the changed fields, trimmed", () => {
    const initial = guardianFormFrom(detail());
    expect(guardianPatch(initial, { ...initial, name: " María Pérez ", phone: "9999-8888" })).toEqual(
      { name: "María Pérez" }
    );
  });

  it("treats an email that differs only in case as unchanged", () => {
    const initial = guardianFormFrom(detail());
    expect(guardianPatch(initial, { ...initial, email: "MARIA@example.com " })).toEqual({});
  });

  it("sends cleared contact fields as null", () => {
    const initial = guardianFormFrom(detail());
    expect(
      guardianPatch(initial, { ...initial, email: "", preferredContactMethod: "" })
    ).toEqual({ email: null, preferredContactMethod: null });
  });

  it("sends an emptied name as an empty string so the API reports the field", () => {
    const initial = guardianFormFrom(detail());
    expect(guardianPatch(initial, { ...initial, name: "  " })).toEqual({ name: "" });
  });
});

describe("catalog options", () => {
  it("offers active statuses in order and keeps an inactive current one, marked", () => {
    expect(statusOptions(catalogs, { id: ids.status, name: "Nuevo" })).toEqual([
      { value: ids.status, label: "Nuevo" },
      { value: ids.statusOther, label: "Contactado" },
    ]);
    expect(statusOptions(catalogs, { id: ids.statusOld, name: "Archivado" })).toEqual([
      { value: ids.statusOld, label: "Archivado (inactivo)" },
      { value: ids.status, label: "Nuevo" },
      { value: ids.statusOther, label: "Contactado" },
    ]);
  });

  it("offers active grades in order and keeps an inactive current one, marked", () => {
    expect(gradeOptions(catalogs, { id: ids.gradeOld, name: "Duodécimo" })).toEqual([
      { value: ids.gradeOld, label: "Duodécimo (inactivo)" },
      { value: ids.grade1, label: "Primer grado" },
      { value: ids.grade2, label: "Segundo grado" },
    ]);
  });

  it("offers unassigned and active staff, and keeps a current assignee who is no longer assignable", () => {
    expect(assigneeOptions(catalogs, null)).toEqual([
      { value: "", label: "Sin asignar" },
      { value: ids.staffA, label: "Ana Staff" },
      { value: ids.staffB, label: "Beto Staff" },
    ]);
    expect(assigneeOptions(catalogs, { id: ids.staffGone, name: "Carla" })).toEqual([
      { value: "", label: "Sin asignar" },
      { value: ids.staffGone, label: "Carla (no disponible para asignar)" },
      { value: ids.staffA, label: "Ana Staff" },
      { value: ids.staffB, label: "Beto Staff" },
    ]);
  });

  it("offers only the modalities active for the selected grade", () => {
    const current = { gradeId: ids.grade1, modality: { id: ids.bilingual, name: "Bilingüe" } };
    expect(modalityOptions(catalogs, ids.grade2, current)).toEqual([
      { value: "", label: "Sin definir" },
      { value: ids.spanish, label: "Español" },
    ]);
  });

  it("keeps the current modality, marked, when its pair is no longer offered", () => {
    const current = { gradeId: ids.grade2, modality: { id: ids.bilingual, name: "Bilingüe" } };
    expect(modalityOptions(catalogs, ids.grade2, current)).toEqual([
      { value: "", label: "Sin definir" },
      { value: ids.bilingual, label: "Bilingüe (no disponible)" },
      { value: ids.spanish, label: "Español" },
    ]);
  });
});

describe("grade and modality compatibility", () => {
  it("knows which modalities a grade offers", () => {
    expect(isModalityOffered(catalogs, ids.grade1, ids.bilingual)).toBe(true);
    expect(isModalityOffered(catalogs, ids.grade2, ids.bilingual)).toBe(false);
    expect(isModalityOffered(catalogs, ids.grade2, "")).toBe(true);
    expect(isModalityOffered(catalogs, "unknown", ids.spanish)).toBe(false);
  });

  it("keeps the modality when the new grade offers it and clears it otherwise", () => {
    expect(modalityAfterGradeChange(catalogs, ids.grade2, ids.spanish)).toBe(ids.spanish);
    expect(modalityAfterGradeChange(catalogs, ids.grade2, ids.bilingual)).toBe("");
    expect(modalityAfterGradeChange(catalogs, ids.gradeOld, ids.spanish)).toBe("");
  });

  it("reports a changed pair the API would reject", () => {
    const initial = prospectFormFrom(detail());
    expect(
      prospectFormErrors(catalogs, initial, { ...initial, gradeId: ids.grade2 })
    ).toHaveProperty("modalityId");
    expect(
      prospectFormErrors(catalogs, initial, { ...initial, gradeId: ids.grade2, modalityId: "" })
    ).toEqual({});
  });

  it("leaves an unchanged legacy pair alone", () => {
    const initial = prospectFormFrom(
      detail({ grade: { id: ids.grade2, name: "Segundo" }, modality: { id: ids.bilingual, name: "B" } })
    );
    expect(prospectFormErrors(catalogs, initial, { ...initial, statusId: ids.statusOther })).toEqual(
      {}
    );
  });

  it("reports notes that are too long", () => {
    const initial = prospectFormFrom(detail());
    expect(
      prospectFormErrors(catalogs, initial, { ...initial, internalNotes: "x".repeat(5001) })
    ).toHaveProperty("internalNotes");
  });
});

describe("confirmationMatches", () => {
  it("accepts the word, ignoring case and outer spaces", () => {
    expect(DELETE_CONFIRMATION_WORD).toBe("ELIMINAR");
    expect(confirmationMatches("ELIMINAR")).toBe(true);
    expect(confirmationMatches(" eliminar ")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(confirmationMatches("")).toBe(false);
    expect(confirmationMatches("ELIMINA")).toBe(false);
    expect(confirmationMatches("ELIMINAR YA")).toBe(false);
  });
});

describe("contact links", () => {
  it("builds a tel link from the dialable characters", () => {
    expect(telHref("+504 9999-8888")).toBe("tel:+50499998888");
    expect(telHref("(504) 9999 8888")).toBe("tel:50499998888");
    expect(telHref("---")).toBeNull();
  });

  it("builds a WhatsApp link, adding 504 to an 8-digit number", () => {
    expect(whatsappHref("9999-8888")).toBe("https://wa.me/50499998888");
    expect(whatsappHref("+1 (305) 555-0100")).toBe("https://wa.me/13055550100");
    expect(whatsappHref("00 504 9999 8888")).toBe("https://wa.me/50499998888");
    expect(whatsappHref("123")).toBeNull();
  });

  it("builds a mailto link", () => {
    expect(mailtoHref("maria@example.com")).toBe("mailto:maria@example.com");
  });
});

describe("list links", () => {
  it("links a row to its record, carrying the list query", () => {
    const id = "00000000-0000-4000-8000-0000000000aa";
    expect(recordHref(id, "")).toBe(`/admisiones-admin/solicitudes/${id}`);
    expect(recordHref(id, "q=ana&page=2")).toBe(
      `/admisiones-admin/solicitudes/${id}?lista=q%3Dana%26page%3D2`
    );
  });

  it("goes back to the list with its filters", () => {
    expect(backToListHref("q=ana&page=2")).toBe("/admisiones-admin/solicitudes?q=ana&page=2");
    expect(backToListHref(null)).toBe("/admisiones-admin/solicitudes");
  });

  it("only ever goes back to the list, dropping unknown or invalid values", () => {
    expect(backToListHref("https://evil.example/x")).toBe("/admisiones-admin/solicitudes");
    expect(backToListHref("next=//evil.example&statusId=nope")).toBe(
      "/admisiones-admin/solicitudes"
    );
  });
});

describe("interpretDetailResponse", () => {
  it("maps the answers to page states", () => {
    const data = detail();
    expect(interpretDetailResponse(200, data)).toEqual({ kind: "ok", data });
    expect(interpretDetailResponse(401, {})).toEqual({ kind: "login" });
    expect(interpretDetailResponse(403, {})).toEqual({ kind: "no-access" });
    expect(interpretDetailResponse(404, {})).toEqual({ kind: "not-found" });
    expect(interpretDetailResponse(400, {})).toEqual({ kind: "not-found" });
    expect(interpretDetailResponse(500, { error: "No se pudieron cargar los datos." })).toEqual({
      kind: "error",
      message: "No se pudieron cargar los datos.",
    });
  });

  it("treats a 200 without an object as an error", () => {
    expect(interpretDetailResponse(200, undefined).kind).toBe("error");
  });
});

describe("interpretSaveResponse", () => {
  it("maps success, session, access, and missing records", () => {
    expect(interpretSaveResponse("prospect", 200, { ok: true })).toEqual({ kind: "saved" });
    expect(interpretSaveResponse("prospect", 401, {})).toEqual({ kind: "login" });
    expect(interpretSaveResponse("guardian", 403, {})).toEqual({ kind: "no-access" });
    expect(interpretSaveResponse("prospect", 404, {})).toEqual({ kind: "not-found" });
  });

  it("passes field errors through, keeping only text messages", () => {
    expect(
      interpretSaveResponse("guardian", 400, {
        error: "Revise los datos enviados.",
        fieldErrors: { phone: "Ingrese un teléfono válido.", email: 3 },
      })
    ).toEqual({
      kind: "rejected",
      message: "Revise los datos enviados.",
      fieldErrors: { phone: "Ingrese un teléfono válido." },
    });
  });

  it.each([
    ["prospect", 409, /Ya existe otra solicitud/],
    ["guardian", 409, /cambiaron mientras se guardaban/],
    ["prospect", 413, /demasiado grande/],
    ["guardian", 415, /Recargue la página/],
    ["prospect", 500, /Intente de nuevo en unos minutos/],
    ["guardian", 503, /Intente de nuevo en unos minutos/],
  ] as const)("gives a clear message for a %s %i", (target, status, pattern) => {
    const outcome = interpretSaveResponse(target, status, { error: "x" });
    expect(outcome.kind).toBe("rejected");
    expect(outcome.kind === "rejected" && outcome.message).toMatch(pattern);
    expect(outcome.kind === "rejected" && outcome.fieldErrors).toEqual({});
  });
});

describe("interpretDeleteResponse", () => {
  it("maps every documented answer", () => {
    expect(interpretDeleteResponse(200)).toEqual({ kind: "deleted" });
    expect(interpretDeleteResponse(401)).toEqual({ kind: "login" });
    expect(interpretDeleteResponse(404)).toEqual({ kind: "already-deleted" });

    const conflict = interpretDeleteResponse(409);
    expect(conflict.kind === "error" && conflict.message).toMatch(/Intente de nuevo/);

    const forbidden = interpretDeleteResponse(403);
    expect(forbidden.kind === "error" && forbidden.message).toMatch(/No tiene permiso/);

    const failed = interpretDeleteResponse(500);
    expect(failed.kind === "error" && failed.message).toMatch(/No se pudo eliminar/);
  });
});
