import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isValidProspectId, noStoreJson } from "./admin-queries";
import { admissionsInterestSchema } from "./schema";

// Write operations for the admissions admin panel. Every function takes the session client
// from requireAdmissionsAccess, so RLS and the column grants apply. Route handlers check the
// role first; this module validates the request and maps database errors to responses.

export const INTERNAL_NOTES_MAX_LENGTH = 5000;

/** Fits the longest valid notes even when every character arrives as a \uXXXX escape. */
export const MAX_PATCH_BODY_BYTES = 32 * 1024;

const PROSPECTS_TABLE = "admissions_prospects";
const GUARDIANS_TABLE = "admissions_guardians";

const NOTHING_TO_UPDATE_MESSAGE = "Indique al menos un campo para actualizar.";
const INVALID_DATA_MESSAGE = "Revise los datos enviados.";
const INVALID_ID_MESSAGE = "Identificador inválido.";
const FORBIDDEN_MESSAGE = "No autorizado";
const SAVE_FAILED_MESSAGE = "No se pudo guardar el cambio.";
const DELETE_FAILED_MESSAGE = "No se pudo eliminar el prospecto.";
const RETRY_MESSAGE = "Los datos cambiaron mientras se guardaban. Intente de nuevo.";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const publicField = admissionsInterestSchema.shape;

const hasSomeField = (patch: object) => Object.keys(patch).length > 0;

function blankToNull(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const text = value.trim();
  return text === "" ? null : text;
}

const uuidField = (message: string) => z.guid({ error: message });

/**
 * Strict on purpose: consent evidence, origin data, guardian_id, and closed_at have no field
 * here, so they cannot be written even where the column grants would allow it.
 *
 * A grade and modality pair is not checked here. The composite foreign key on the table
 * decides, and its rejection is mapped in PROSPECT_UPDATE_FAILURES.
 */
export const prospectPatchSchema = z
  .strictObject({
    statusId: uuidField("Seleccione un estado válido.").optional(),
    assignedTo: uuidField("Seleccione un responsable válido.").nullable().optional(),
    gradeId: uuidField("Seleccione un grado válido.").optional(),
    modalityId: uuidField("Seleccione una modalidad válida.").nullable().optional(),
    internalNotes: z
      .preprocess(
        blankToNull,
        z
          .string({ error: "Ingrese notas válidas." })
          .max(INTERNAL_NOTES_MAX_LENGTH, { error: "Las notas son demasiado largas." })
          .nullable()
      )
      .optional(),
    studentName: publicField.studentName.optional(),
  })
  .refine(hasSomeField, { error: NOTHING_TO_UPDATE_MESSAGE });

export type ProspectPatch = z.infer<typeof prospectPatchSchema>;

/** Same rules as the public form. phone_normalized and email_normalized are generated. */
export const guardianPatchSchema = z
  .strictObject({
    name: publicField.guardianName.optional(),
    phone: publicField.phone.optional(),
    email: publicField.email.optional(),
    preferredContactMethod: publicField.preferredContactMethod.optional(),
  })
  .refine(hasSomeField, { error: NOTHING_TO_UPDATE_MESSAGE });

export type GuardianPatch = z.infer<typeof guardianPatchSchema>;

const PROSPECT_COLUMNS = {
  statusId: "status_id",
  assignedTo: "assigned_to",
  gradeId: "grade_id",
  modalityId: "modality_id",
  internalNotes: "internal_notes",
  studentName: "student_name",
} as const satisfies Record<keyof ProspectPatch, string>;

const GUARDIAN_COLUMNS = {
  name: "full_name",
  phone: "phone",
  email: "email",
  preferredContactMethod: "preferred_contact_method",
} as const satisfies Record<keyof GuardianPatch, string>;

function toColumns<K extends string>(
  patch: Partial<Record<K, unknown>>,
  columns: Record<K, string>
): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const key of Object.keys(columns) as K[]) {
    if (patch[key] !== undefined) row[columns[key]] = patch[key];
  }
  return row;
}

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

type Failure = { status: number; message: string };

const INVALID_DATA: Failure = { status: 400, message: INVALID_DATA_MESSAGE };
const CONFLICT: Failure = {
  status: 409,
  message: "Los datos entran en conflicto con otro registro.",
};

const COMMON_FAILURES: Record<string, Failure> = {
  "22023": INVALID_DATA,
  "23514": INVALID_DATA,
};

const PROSPECT_UPDATE_FAILURES: Record<string, Failure> = {
  ...COMMON_FAILURES,
  // The grade and modality pair, or a selected catalog value that no longer exists.
  "23503": {
    status: 400,
    message: "La combinación de grado y modalidad no es válida, o un valor seleccionado ya no existe.",
  },
  // admissions_prospects_opportunity_key: guardian, year, grade, and student name.
  "23505": CONFLICT,
};

const GUARDIAN_UPDATE_FAILURES: Record<string, Failure> = {
  ...COMMON_FAILURES,
  "23505": CONFLICT,
};

const DELETE_FAILURES: Record<string, Failure> = {
  ...COMMON_FAILURES,
  "42501": { status: 403, message: FORBIDDEN_MESSAGE },
  P0002: { status: 404, message: "Prospecto no encontrado." },
  "40001": { status: 409, message: RETRY_MESSAGE },
};

export function forbiddenResponse(): NextResponse {
  return noStoreJson({ error: FORBIDDEN_MESSAGE }, 403);
}

const okResponse = () => noStoreJson({ ok: true });

const genericFailureResponse = (message: string) => noStoreJson({ error: message }, 500);

/** Database messages can hold personal data, so only the code is ever logged. */
function saveFailureResponse(
  code: string | undefined,
  failures: Record<string, Failure>
): NextResponse {
  const failure = code ? failures[code] : undefined;
  if (failure) return noStoreJson({ error: failure.message }, failure.status);
  console.error("[admissions] Admin write failed:", code ?? "unknown");
  return genericFailureResponse(SAVE_FAILED_MESSAGE);
}

function saveExceptionResponse(): NextResponse {
  console.error("[admissions] Admin write failed:", "exception");
  return genericFailureResponse(SAVE_FAILED_MESSAGE);
}

/** Lists the failing fields, never the keys or values that were sent. */
function validationResponse(error: z.ZodError): NextResponse {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    if (issue.path.length > 0) fieldErrors[String(issue.path[0])] ??= issue.message;
  }
  const nothingToUpdate = error.issues.some((issue) => issue.message === NOTHING_TO_UPDATE_MESSAGE);
  return noStoreJson(
    {
      error: nothingToUpdate ? NOTHING_TO_UPDATE_MESSAGE : INVALID_DATA_MESSAGE,
      ...(Object.keys(fieldErrors).length > 0 && { fieldErrors }),
    },
    400
  );
}

// ---------------------------------------------------------------------------
// Request parsing
// ---------------------------------------------------------------------------

function isJsonRequest(request: NextRequest): boolean {
  const mediaType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  return mediaType === "application/json";
}

/** Reads the body as text, stopping as soon as it exceeds the limit. */
async function readBodyWithLimit(request: NextRequest, limit: number): Promise<string | null> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > limit) return null;
  if (!request.body) return "";

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

async function parsePatch<T extends object>(
  request: NextRequest,
  schema: z.ZodType<T>
): Promise<T | NextResponse> {
  if (!isJsonRequest(request)) {
    return noStoreJson({ error: "El contenido debe enviarse como JSON." }, 415);
  }

  const raw = await readBodyWithLimit(request, MAX_PATCH_BODY_BYTES);
  if (raw === null) {
    return noStoreJson({ error: "El contenido es demasiado grande." }, 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return noStoreJson({ error: INVALID_DATA_MESSAGE }, 400);
  }

  const parsed = schema.safeParse(body);
  return parsed.success ? parsed.data : validationResponse(parsed.error);
}

// ---------------------------------------------------------------------------
// Prospects
// ---------------------------------------------------------------------------

export async function patchProspect(
  supabase: SupabaseClient,
  id: string,
  request: NextRequest
): Promise<NextResponse> {
  if (!isValidProspectId(id)) return noStoreJson({ error: INVALID_ID_MESSAGE }, 400);

  try {
    const patch = await parsePatch(request, prospectPatchSchema);
    if (patch instanceof NextResponse) return patch;

    const { data, error } = await supabase
      .from(PROSPECTS_TABLE)
      .update(toColumns(patch, PROSPECT_COLUMNS))
      .eq("id", id)
      .select("id");

    if (error) return saveFailureResponse(error.code, PROSPECT_UPDATE_FAILURES);
    if (!data || data.length === 0) {
      return noStoreJson({ error: "Prospecto no encontrado." }, 404);
    }
    return okResponse();
  } catch {
    return saveExceptionResponse();
  }
}

export async function deleteProspect(supabase: SupabaseClient, id: string): Promise<NextResponse> {
  if (!isValidProspectId(id)) return noStoreJson({ error: INVALID_ID_MESSAGE }, 400);

  try {
    const { error } = await supabase.rpc("admissions_delete_prospect", { p_prospect_id: id });
    if (!error) return okResponse();

    console.error("[admissions] Prospect deletion failed:", error.code ?? "unknown", id);
    const failure = error.code ? DELETE_FAILURES[error.code] : undefined;
    return failure
      ? noStoreJson({ error: failure.message }, failure.status)
      : genericFailureResponse(DELETE_FAILED_MESSAGE);
  } catch {
    console.error("[admissions] Prospect deletion failed:", "exception", id);
    return genericFailureResponse(DELETE_FAILED_MESSAGE);
  }
}

// ---------------------------------------------------------------------------
// Guardians
// ---------------------------------------------------------------------------

type GuardianContact = {
  phone: string | null;
  email: string | null;
  phone_normalized: string | null;
  email_normalized: string | null;
  preferred_contact_method: string | null;
};

const GUARDIAN_CONTACT_SELECT =
  "phone, email, phone_normalized, email_normalized, preferred_contact_method";

function readGuardianContact(supabase: SupabaseClient, id: string) {
  return supabase
    .from(GUARDIANS_TABLE)
    .select(GUARDIAN_CONTACT_SELECT)
    .eq("id", id)
    .maybeSingle<GuardianContact>();
}

const touchesContact = (patch: GuardianPatch) =>
  patch.phone !== undefined ||
  patch.email !== undefined ||
  patch.preferredContactMethod !== undefined;

/**
 * The public form's contact rules, applied to the row as it would be after the patch. The
 * normalized columns decide for fields the patch leaves alone, as the table's check does.
 */
function contactRuleErrors(
  patch: GuardianPatch,
  current: GuardianContact
): Record<string, string> | null {
  const phone = patch.phone !== undefined ? patch.phone : current.phone_normalized;
  const email = patch.email !== undefined ? patch.email : current.email_normalized;
  const method =
    patch.preferredContactMethod !== undefined
      ? patch.preferredContactMethod
      : current.preferred_contact_method;

  const errors: Record<string, string> = {};
  if (phone === null && email === null) {
    errors.phone = "Ingrese un teléfono o un correo electrónico.";
  }
  if (method === "email" && email === null) {
    errors.email = "Ingrese un correo electrónico para este medio de contacto.";
  }
  if ((method === "phone" || method === "whatsapp") && phone === null) {
    errors.phone = "Ingrese un teléfono para este medio de contacto.";
  }
  return Object.keys(errors).length > 0 ? errors : null;
}

/**
 * The table's check covers "phone or email", but not the contact for the preferred method. So
 * a patch that touches contact data also filters on the values it was checked against, and
 * two concurrent patches cannot combine into a row that breaks the rule.
 */
const CONTACT_COLUMNS = ["phone", "email", "preferred_contact_method"] as const;

export async function patchGuardian(
  supabase: SupabaseClient,
  id: string,
  request: NextRequest
): Promise<NextResponse> {
  if (!isValidProspectId(id)) return noStoreJson({ error: INVALID_ID_MESSAGE }, 400);

  const notFound = () => noStoreJson({ error: "Encargado no encontrado." }, 404);

  try {
    const patch = await parsePatch(request, guardianPatchSchema);
    if (patch instanceof NextResponse) return patch;

    let checked: GuardianContact | null = null;
    if (touchesContact(patch)) {
      const { data: current, error } = await readGuardianContact(supabase, id);
      if (error) return saveFailureResponse(error.code, GUARDIAN_UPDATE_FAILURES);
      if (!current) return notFound();

      const fieldErrors = contactRuleErrors(patch, current);
      if (fieldErrors) {
        return noStoreJson({ error: INVALID_DATA_MESSAGE, fieldErrors }, 400);
      }
      checked = current;
    }

    let update = supabase
      .from(GUARDIANS_TABLE)
      .update(toColumns(patch, GUARDIAN_COLUMNS))
      .eq("id", id);
    if (checked) {
      for (const column of CONTACT_COLUMNS) {
        const value = checked[column];
        update = value === null ? update.is(column, null) : update.eq(column, value);
      }
    }

    const { data, error } = await update.select("id");
    if (error) return saveFailureResponse(error.code, GUARDIAN_UPDATE_FAILURES);
    if (data && data.length > 0) return okResponse();
    if (!checked) return notFound();

    // No row matched: it was either deleted or changed since the check.
    const { data: latest, error: readError } = await readGuardianContact(supabase, id);
    if (readError) return saveFailureResponse(readError.code, GUARDIAN_UPDATE_FAILURES);
    return latest ? noStoreJson({ error: RETRY_MESSAGE }, 409) : notFound();
  } catch {
    return saveExceptionResponse();
  }
}
