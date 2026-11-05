// Client-safe logic for the prospect record page: form values, the patches sent to the write
// APIs, the catalog options the forms offer, contact links, and how API answers map to page
// states. The APIs remain the authority; this only keeps normal use away from their errors.

import type { AdmissionsAdminCatalogs, ProspectDetail } from "./admin-queries";
import { LIST_PATH, listPathFor, readListFilters } from "./admin-list-params";
import { phoneDigits } from "./schema";

/** Mirrors INTERNAL_NOTES_MAX_LENGTH in admin-mutations.ts (server-only). */
export const INTERNAL_NOTES_MAX_LENGTH = 5000;

export const DELETE_CONFIRMATION_WORD = "ELIMINAR";

/** The query parameter that carries the list filters into a record and back. */
export const LIST_QUERY_PARAM = "lista";

type NamedRef = { id: string; name: string };

/** The answer of GET /api/admisiones-admin/me. A display hint: the APIs check the role again. */
export type AdmissionsMe = {
  role: string;
  canEdit: boolean;
  canDelete: boolean;
};

export type SelectOption = { value: string; label: string };

// ---------------------------------------------------------------------------
// Form values and patches
// ---------------------------------------------------------------------------

/** Every value is a string, as in the form controls. An empty string means none. */
export type ProspectFormValues = {
  statusId: string;
  assignedTo: string;
  gradeId: string;
  modalityId: string;
  studentName: string;
  internalNotes: string;
};

export type GuardianFormValues = {
  name: string;
  phone: string;
  email: string;
  preferredContactMethod: string;
};

export type ProspectPatchBody = Partial<{
  statusId: string;
  assignedTo: string | null;
  gradeId: string;
  modalityId: string | null;
  studentName: string | null;
  internalNotes: string | null;
}>;

export type GuardianPatchBody = Partial<{
  name: string;
  phone: string | null;
  email: string | null;
  preferredContactMethod: string | null;
}>;

export function prospectFormFrom(detail: ProspectDetail): ProspectFormValues {
  return {
    statusId: detail.status.id,
    assignedTo: detail.assignee?.id ?? "",
    gradeId: detail.grade.id,
    modalityId: detail.modality?.id ?? "",
    studentName: detail.studentName ?? "",
    internalNotes: detail.internalNotes ?? "",
  };
}

export function guardianFormFrom(detail: ProspectDetail): GuardianFormValues {
  return {
    name: detail.guardian.name,
    phone: detail.guardian.phone ?? "",
    email: detail.guardian.email ?? "",
    preferredContactMethod: detail.guardian.preferredContactMethod ?? "",
  };
}

/** The API trims texts and stores a blank one as null, so the comparison does the same. */
function textOrNull(value: string): string | null {
  const text = value.trim();
  return text === "" ? null : text;
}

const idOrNull = (value: string): string | null => (value === "" ? null : value);

/** Only the fields that changed, so a save never overwrites what someone else just edited. */
export function prospectPatch(
  initial: ProspectFormValues,
  current: ProspectFormValues
): ProspectPatchBody {
  const patch: ProspectPatchBody = {};
  if (current.statusId !== initial.statusId) patch.statusId = current.statusId;
  if (current.assignedTo !== initial.assignedTo) patch.assignedTo = idOrNull(current.assignedTo);
  if (current.gradeId !== initial.gradeId) patch.gradeId = current.gradeId;
  if (current.modalityId !== initial.modalityId) patch.modalityId = idOrNull(current.modalityId);

  const studentName = textOrNull(current.studentName);
  if (studentName !== textOrNull(initial.studentName)) patch.studentName = studentName;

  const notes = textOrNull(current.internalNotes);
  if (notes !== textOrNull(initial.internalNotes)) patch.internalNotes = notes;
  return patch;
}

export function guardianPatch(
  initial: GuardianFormValues,
  current: GuardianFormValues
): GuardianPatchBody {
  const patch: GuardianPatchBody = {};

  // A blank name is sent as is, so the API answers with the field error.
  const name = current.name.trim();
  if (name !== initial.name.trim()) patch.name = name;

  const phone = textOrNull(current.phone);
  if (phone !== textOrNull(initial.phone)) patch.phone = phone;

  // The API stores the email in lower case.
  const email = textOrNull(current.email);
  if (email?.toLowerCase() !== textOrNull(initial.email)?.toLowerCase()) patch.email = email;

  if (current.preferredContactMethod !== initial.preferredContactMethod) {
    patch.preferredContactMethod = idOrNull(current.preferredContactMethod);
  }
  return patch;
}

// ---------------------------------------------------------------------------
// Catalog options
// ---------------------------------------------------------------------------

/**
 * Only active values can be chosen. A current value that is no longer offered stays first
 * and marked, so the form never silently shows another value than the record holds.
 */
function withCurrent(
  options: SelectOption[],
  current: NamedRef | null,
  mark: string
): SelectOption[] {
  if (!current || options.some((option) => option.value === current.id)) return options;
  return [{ value: current.id, label: `${current.name} (${mark})` }, ...options];
}

export function statusOptions(catalogs: AdmissionsAdminCatalogs, current: NamedRef): SelectOption[] {
  const active = catalogs.statuses
    .filter((status) => status.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((status) => ({ value: status.id, label: status.name }));
  return withCurrent(active, current, "inactivo");
}

export function gradeOptions(catalogs: AdmissionsAdminCatalogs, current: NamedRef): SelectOption[] {
  const active = catalogs.grades
    .filter((grade) => grade.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((grade) => ({ value: grade.id, label: grade.name }));
  return withCurrent(active, current, "inactivo");
}

export function assigneeOptions(
  catalogs: AdmissionsAdminCatalogs,
  current: NamedRef | null
): SelectOption[] {
  const staff = catalogs.assignableStaff.map((person) => ({ value: person.id, label: person.name }));
  return [
    { value: "", label: "Sin asignar" },
    ...withCurrent(staff, current, "no disponible para asignar"),
  ];
}

/**
 * The modalities offered for the selected grade. The record's own modality is kept, marked,
 * only while the record's grade is selected, since that is the only pair it already holds.
 */
export function modalityOptions(
  catalogs: AdmissionsAdminCatalogs,
  gradeId: string,
  current: { gradeId: string; modality: NamedRef | null }
): SelectOption[] {
  const offered = (catalogs.grades.find((grade) => grade.id === gradeId)?.modalities ?? []).map(
    (modality) => ({ value: modality.id, label: modality.name })
  );
  const kept = gradeId === current.gradeId ? current.modality : null;
  return [{ value: "", label: "Sin definir" }, ...withCurrent(offered, kept, "no disponible")];
}

/** No modality is always valid; otherwise the grade must offer it as an active pair. */
export function isModalityOffered(
  catalogs: AdmissionsAdminCatalogs,
  gradeId: string,
  modalityId: string
): boolean {
  if (modalityId === "") return true;
  const grade = catalogs.grades.find((item) => item.id === gradeId);
  return grade?.modalities.some((modality) => modality.id === modalityId) ?? false;
}

/** The modality to keep after the grade changes: cleared when the new grade does not offer it. */
export function modalityAfterGradeChange(
  catalogs: AdmissionsAdminCatalogs,
  gradeId: string,
  modalityId: string
): string {
  return isModalityOffered(catalogs, gradeId, modalityId) ? modalityId : "";
}

export const MODALITY_NOT_OFFERED_MESSAGE =
  "Seleccione una modalidad que se ofrezca para este grado, o deje la modalidad sin definir.";

/** Checks the API would fail on, caught before sending. Keys match the API field names. */
export function prospectFormErrors(
  catalogs: AdmissionsAdminCatalogs,
  initial: ProspectFormValues,
  current: ProspectFormValues
): Record<string, string> {
  const errors: Record<string, string> = {};
  const pairChanged =
    current.gradeId !== initial.gradeId || current.modalityId !== initial.modalityId;
  if (pairChanged && !isModalityOffered(catalogs, current.gradeId, current.modalityId)) {
    errors.modalityId = MODALITY_NOT_OFFERED_MESSAGE;
  }
  if (current.internalNotes.trim().length > INTERNAL_NOTES_MAX_LENGTH) {
    errors.internalNotes = `Las notas no pueden superar ${INTERNAL_NOTES_MAX_LENGTH} caracteres.`;
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Deletion confirmation
// ---------------------------------------------------------------------------

export function confirmationMatches(input: string): boolean {
  return input.trim().toUpperCase() === DELETE_CONFIRMATION_WORD;
}

// ---------------------------------------------------------------------------
// Contact links
// ---------------------------------------------------------------------------

export function telHref(phone: string): string | null {
  const dialable = phone.replace(/[^\d+]/g, "");
  return /\d/.test(dialable) ? `tel:${dialable}` : null;
}

/** An 8-digit number is taken as Honduran and gets the 504 country code. */
export function whatsappHref(phone: string): string | null {
  const digits = phoneDigits(phone);
  if (digits.length < 8) return null;
  return `https://wa.me/${digits.length === 8 ? `504${digits}` : digits}`;
}

export function mailtoHref(email: string): string {
  return `mailto:${email}`;
}

// ---------------------------------------------------------------------------
// Links between the list and the record
// ---------------------------------------------------------------------------

export function recordHref(id: string, listQuery: string): string {
  const path = `${LIST_PATH}/${id}`;
  return listQuery ? `${path}?${LIST_QUERY_PARAM}=${encodeURIComponent(listQuery)}` : path;
}

/** Always the list page: the carried query is re-read as list filters, so it cannot redirect. */
export function backToListHref(listQuery: string | null): string {
  return listPathFor(readListFilters(new URLSearchParams(listQuery ?? "")));
}

// ---------------------------------------------------------------------------
// API answers
// ---------------------------------------------------------------------------

export const LOAD_ERROR_MESSAGE = "No se pudieron cargar los datos.";

function apiMessage(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  const { error } = body as { error?: unknown };
  return typeof error === "string" && error ? error : null;
}

function apiFieldErrors(body: unknown): Record<string, string> {
  if (typeof body !== "object" || body === null) return {};
  const { fieldErrors } = body as { fieldErrors?: unknown };
  if (typeof fieldErrors !== "object" || fieldErrors === null) return {};
  return Object.fromEntries(
    Object.entries(fieldErrors).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string" && entry[1] !== ""
    )
  );
}

export type DetailOutcome =
  | { kind: "ok"; data: ProspectDetail }
  | { kind: "login" }
  | { kind: "no-access" }
  | { kind: "not-found" }
  | { kind: "error"; message: string };

export function interpretDetailResponse(status: number, body: unknown): DetailOutcome {
  if (status === 401) return { kind: "login" };
  if (status === 403) return { kind: "no-access" };
  // 400 answers only a malformed id, which no record can have.
  if (status === 404 || status === 400) return { kind: "not-found" };
  if (status >= 200 && status < 300 && typeof body === "object" && body !== null) {
    return { kind: "ok", data: body as ProspectDetail };
  }
  return { kind: "error", message: apiMessage(body) ?? LOAD_ERROR_MESSAGE };
}

export type SaveOutcome =
  | { kind: "saved" }
  | { kind: "login" }
  | { kind: "no-access" }
  | { kind: "not-found" }
  | { kind: "rejected"; message: string; fieldErrors: Record<string, string> };

const CONFLICT_MESSAGES = {
  prospect:
    "Ya existe otra solicitud de este encargado para el mismo estudiante, año y grado. Revise el nombre del estudiante o el grado.",
  guardian:
    "Los datos del encargado cambiaron mientras se guardaban. Recargue la página e intente de nuevo.",
} as const;

export function interpretSaveResponse(
  target: "prospect" | "guardian",
  status: number,
  body: unknown
): SaveOutcome {
  if (status >= 200 && status < 300) return { kind: "saved" };
  if (status === 401) return { kind: "login" };
  if (status === 403) return { kind: "no-access" };
  if (status === 404) return { kind: "not-found" };

  const rejected = (message: string, fieldErrors: Record<string, string> = {}): SaveOutcome => ({
    kind: "rejected",
    message,
    fieldErrors,
  });
  if (status === 400) {
    return rejected(apiMessage(body) ?? "Revise los datos enviados.", apiFieldErrors(body));
  }
  if (status === 409) return rejected(CONFLICT_MESSAGES[target]);
  if (status === 413) {
    return rejected("El contenido es demasiado grande. Acorte las notas e intente de nuevo.");
  }
  if (status === 415) {
    return rejected("No se pudo enviar el formulario. Recargue la página e intente de nuevo.");
  }
  return rejected("No se pudo guardar el cambio. Intente de nuevo en unos minutos.");
}

export type DeleteOutcome =
  | { kind: "deleted" }
  | { kind: "login" }
  | { kind: "already-deleted" }
  | { kind: "error"; message: string };

export function interpretDeleteResponse(status: number): DeleteOutcome {
  if (status >= 200 && status < 300) return { kind: "deleted" };
  if (status === 401) return { kind: "login" };
  if (status === 404) return { kind: "already-deleted" };
  if (status === 403) {
    return { kind: "error", message: "No tiene permiso para eliminar solicitudes." };
  }
  if (status === 409) {
    return {
      kind: "error",
      message: "Los datos cambiaron mientras se eliminaba la solicitud. Intente de nuevo.",
    };
  }
  return { kind: "error", message: "No se pudo eliminar la solicitud. Intente de nuevo." };
}
