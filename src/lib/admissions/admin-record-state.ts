// Pure decisions of the prospect record page: how the detail and /me answers combine into a
// page state, what a reload after a save shows, and how the delete dialog reacts to its
// request. The components only wire these to React state and the router.

import type { ProspectDetail } from "./admin-queries";
import {
  type AdmissionsMe,
  DELETE_CONFIRMATION_WORD,
  confirmationMatches,
  interpretDeleteResponse,
  interpretDetailResponse,
} from "./admin-record";

export const CONNECTION_ERROR = "Error de conexión. Revise su red e intente de nuevo.";

export const SAVED_BUT_STALE_MESSAGE =
  "Los cambios se guardaron, pero no se pudo actualizar la vista. Recargue la página.";

export const DELETED_MESSAGE = "La solicitud se eliminó.";
export const ALREADY_DELETED_MESSAGE = "La solicitud ya había sido eliminada.";

/** Same shape as the result of `requestAdmin` in the admin fetch helpers. */
export type AdminRequestOutcome =
  | { kind: "response"; status: number; body: unknown }
  | { kind: "network" }
  | { kind: "aborted" };

/** Same shape as the result of `fetchAdminJson<AdmissionsMe>`. */
export type MeFetchOutcome =
  | { kind: "ok"; data: AdmissionsMe }
  | { kind: "unauthenticated" }
  | { kind: "forbidden" }
  | { kind: "error"; message: string }
  | { kind: "aborted" };

export type RecordPageState =
  | { kind: "ready"; detail: ProspectDetail; me: AdmissionsMe }
  | { kind: "error"; message: string }
  | { kind: "not-found" }
  | { kind: "no-access" };

/** A page state, a move to the login page, or nothing, because the request was cancelled. */
export type RecordLoad = RecordPageState | { kind: "login" } | { kind: "aborted" };

/**
 * Precedence: a cancelled request, a lost connection on the record, an expired session on
 * either answer, no access on either answer, the record's own answer, then a failed /me.
 */
export function resolveRecordLoad(detail: AdminRequestOutcome, me: MeFetchOutcome): RecordLoad {
  if (detail.kind === "aborted" || me.kind === "aborted") return { kind: "aborted" };
  if (detail.kind === "network") return { kind: "error", message: CONNECTION_ERROR };

  const outcome = interpretDetailResponse(detail.status, detail.body);
  if (outcome.kind === "login" || me.kind === "unauthenticated") return { kind: "login" };
  if (outcome.kind === "no-access" || me.kind === "forbidden") return { kind: "no-access" };
  if (outcome.kind !== "ok") return outcome;
  if (me.kind === "error") return { kind: "error", message: me.message };
  return { kind: "ready", detail: outcome.data, me: me.data };
}

export type AfterSaveStep =
  | { kind: "ignore" }
  | { kind: "login" }
  | { kind: "show"; page: Extract<RecordPageState, { kind: "ready" }> }
  | { kind: "saved-stale"; toast: string }
  | { kind: "leave"; page: Extract<RecordPageState, { kind: "not-found" | "no-access" }> };

/**
 * After a save the page reloads the record. The save itself succeeded, so a failed reload
 * keeps the current view, still reports the save, and asks for a manual reload.
 */
export function afterSaveStep(load: RecordLoad): AfterSaveStep {
  switch (load.kind) {
    case "aborted":
      return { kind: "ignore" };
    case "login":
      return { kind: "login" };
    case "ready":
      return { kind: "show", page: load };
    case "error":
      return { kind: "saved-stale", toast: SAVED_BUT_STALE_MESSAGE };
    default:
      return { kind: "leave", page: load };
  }
}

export type DeleteStart = { kind: "ignore" } | { kind: "invalid"; message: string } | { kind: "send" };

export function startDelete(inFlight: boolean, confirmation: string): DeleteStart {
  if (inFlight) return { kind: "ignore" };
  if (!confirmationMatches(confirmation)) {
    return { kind: "invalid", message: `Escriba ${DELETE_CONFIRMATION_WORD} para confirmar.` };
  }
  return { kind: "send" };
}

export type DeleteFinish =
  | { kind: "leave"; href: string; message: string }
  | { kind: "login" }
  | { kind: "show-error"; message: string };

/** A deleted or already missing record returns to the filtered list; errors stay in the dialog. */
export function finishDelete(result: AdminRequestOutcome, listHref: string): DeleteFinish {
  if (result.kind !== "response") return { kind: "show-error", message: CONNECTION_ERROR };

  const outcome = interpretDeleteResponse(result.status);
  if (outcome.kind === "deleted") return { kind: "leave", href: listHref, message: DELETED_MESSAGE };
  if (outcome.kind === "already-deleted") {
    return { kind: "leave", href: listHref, message: ALREADY_DELETED_MESSAGE };
  }
  if (outcome.kind === "login") return { kind: "login" };
  return { kind: "show-error", message: outcome.message };
}
