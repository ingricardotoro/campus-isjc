import { describe, expect, it } from "vitest";
import type { ProspectDetail } from "./admin-queries";
import { type AdmissionsMe, LOAD_ERROR_MESSAGE } from "./admin-record";
import {
  ALREADY_DELETED_MESSAGE,
  type AdminRequestOutcome,
  CONNECTION_ERROR,
  DELETED_MESSAGE,
  type MeFetchOutcome,
  type RecordLoad,
  SAVED_BUT_STALE_MESSAGE,
  afterSaveStep,
  finishDelete,
  resolveRecordLoad,
  startDelete,
} from "./admin-record-state";

// The page logic never looks inside the record, so a minimal stand-in is enough.
const record = { id: "00000000-0000-4000-8000-0000000000aa" } as ProspectDetail;
const me: AdmissionsMe = { role: "manager", canEdit: true, canDelete: false };

const response = (status: number, body: unknown = {}): AdminRequestOutcome => ({
  kind: "response",
  status,
  body,
});
const network: AdminRequestOutcome = { kind: "network" };
const abortedRequest: AdminRequestOutcome = { kind: "aborted" };

const meOk: MeFetchOutcome = { kind: "ok", data: me };
const meExpired: MeFetchOutcome = { kind: "unauthenticated" };
const meForbidden: MeFetchOutcome = { kind: "forbidden" };
const meFailed: MeFetchOutcome = { kind: "error", message: "No se pudo leer el rol." };
const meAborted: MeFetchOutcome = { kind: "aborted" };

const detailAnswers: Record<string, AdminRequestOutcome> = {
  ok: response(200, record),
  expired: response(401),
  forbidden: response(403),
  missing: response(404),
  malformedId: response(400),
  failed: response(500, { error: "Fallo del servidor." }),
  network,
};

const meAnswers: Record<string, MeFetchOutcome> = {
  ok: meOk,
  expired: meExpired,
  forbidden: meForbidden,
  failed: meFailed,
};

/**
 * Every pair of answers that both arrived. Precedence: a lost connection on the record, then
 * an expired session, then no access, then the record's own answer, then a failed /me.
 */
const expected: Record<string, Record<string, RecordLoad>> = {
  ok: {
    ok: { kind: "ready", detail: record, me },
    expired: { kind: "login" },
    forbidden: { kind: "no-access" },
    failed: { kind: "error", message: "No se pudo leer el rol." },
  },
  expired: {
    ok: { kind: "login" },
    expired: { kind: "login" },
    forbidden: { kind: "login" },
    failed: { kind: "login" },
  },
  forbidden: {
    ok: { kind: "no-access" },
    expired: { kind: "login" },
    forbidden: { kind: "no-access" },
    failed: { kind: "no-access" },
  },
  missing: {
    ok: { kind: "not-found" },
    expired: { kind: "login" },
    forbidden: { kind: "no-access" },
    failed: { kind: "not-found" },
  },
  malformedId: {
    ok: { kind: "not-found" },
    expired: { kind: "login" },
    forbidden: { kind: "no-access" },
    failed: { kind: "not-found" },
  },
  failed: {
    ok: { kind: "error", message: "Fallo del servidor." },
    expired: { kind: "login" },
    forbidden: { kind: "no-access" },
    failed: { kind: "error", message: "Fallo del servidor." },
  },
  network: {
    ok: { kind: "error", message: CONNECTION_ERROR },
    expired: { kind: "error", message: CONNECTION_ERROR },
    forbidden: { kind: "error", message: CONNECTION_ERROR },
    failed: { kind: "error", message: CONNECTION_ERROR },
  },
};

describe("resolveRecordLoad", () => {
  const cases = Object.entries(expected).flatMap(([detailKey, byMe]) =>
    Object.entries(byMe).map(([meKey, result]) => [detailKey, meKey, result] as const)
  );

  it("covers every pair of answers", () => {
    expect(cases).toHaveLength(Object.keys(detailAnswers).length * Object.keys(meAnswers).length);
  });

  it.each(cases)("detail %s with /me %s", (detailKey, meKey, result) => {
    expect(resolveRecordLoad(detailAnswers[detailKey], meAnswers[meKey])).toEqual(result);
  });

  it("shows a lost connection even when /me says the session expired", () => {
    expect(resolveRecordLoad(network, meExpired)).toEqual({
      kind: "error",
      message: CONNECTION_ERROR,
    });
  });

  it("reports a missing record even when /me failed", () => {
    expect(resolveRecordLoad(response(404), meFailed)).toEqual({ kind: "not-found" });
  });

  it("uses the default message for a failed record without one", () => {
    expect(resolveRecordLoad(response(502, undefined), meOk)).toEqual({
      kind: "error",
      message: LOAD_ERROR_MESSAGE,
    });
  });

  it("does nothing when either request was cancelled, whatever the other answered", () => {
    for (const detailAnswer of [...Object.values(detailAnswers), abortedRequest]) {
      expect(resolveRecordLoad(detailAnswer, meAborted)).toEqual({ kind: "aborted" });
    }
    for (const meAnswer of [...Object.values(meAnswers), meAborted]) {
      expect(resolveRecordLoad(abortedRequest, meAnswer)).toEqual({ kind: "aborted" });
    }
  });
});

describe("afterSaveStep", () => {
  it("shows the fresh record with the saved message", () => {
    const page = { kind: "ready", detail: record, me } as const;
    expect(afterSaveStep(page)).toEqual({ kind: "show", page });
  });

  it("keeps the view and warns when the reload failed after the save", () => {
    expect(afterSaveStep({ kind: "error", message: CONNECTION_ERROR })).toEqual({
      kind: "saved-stale",
      toast: SAVED_BUT_STALE_MESSAGE,
    });
    expect(afterSaveStep(resolveRecordLoad(network, meOk))).toEqual({
      kind: "saved-stale",
      toast: SAVED_BUT_STALE_MESSAGE,
    });
    expect(afterSaveStep(resolveRecordLoad(response(200, record), meFailed)).kind).toBe(
      "saved-stale"
    );
  });

  it("leaves the record when it is gone or no longer readable", () => {
    expect(afterSaveStep({ kind: "not-found" })).toEqual({
      kind: "leave",
      page: { kind: "not-found" },
    });
    expect(afterSaveStep({ kind: "no-access" })).toEqual({
      kind: "leave",
      page: { kind: "no-access" },
    });
  });

  it("goes to the login page when the session expired", () => {
    expect(afterSaveStep({ kind: "login" })).toEqual({ kind: "login" });
  });

  it("does nothing when the reload was cancelled", () => {
    expect(afterSaveStep({ kind: "aborted" })).toEqual({ kind: "ignore" });
  });
});

describe("startDelete", () => {
  it("ignores a second submit while the deletion is in flight", () => {
    expect(startDelete(true, "ELIMINAR")).toEqual({ kind: "ignore" });
    expect(startDelete(true, "otra cosa")).toEqual({ kind: "ignore" });
  });

  it("asks for the confirmation word before sending", () => {
    expect(startDelete(false, "")).toEqual({
      kind: "invalid",
      message: "Escriba ELIMINAR para confirmar.",
    });
    expect(startDelete(false, "eliminarr").kind).toBe("invalid");
  });

  it("sends once the word matches, ignoring case and outer spaces", () => {
    expect(startDelete(false, "ELIMINAR")).toEqual({ kind: "send" });
    expect(startDelete(false, "  eliminar ")).toEqual({ kind: "send" });
  });
});

describe("finishDelete", () => {
  const listHref = "/admisiones-admin/solicitudes?estado=nuevo";

  it("returns to the filtered list after a deletion", () => {
    expect(finishDelete(response(200, { ok: true }), listHref)).toEqual({
      kind: "leave",
      href: listHref,
      message: DELETED_MESSAGE,
    });
    expect(finishDelete(response(204, undefined), listHref).kind).toBe("leave");
  });

  it("returns to the filtered list when the record was already deleted", () => {
    expect(finishDelete(response(404), listHref)).toEqual({
      kind: "leave",
      href: listHref,
      message: ALREADY_DELETED_MESSAGE,
    });
  });

  it("goes to the login page when the session expired", () => {
    expect(finishDelete(response(401), listHref)).toEqual({ kind: "login" });
  });

  it("shows a lost connection in the dialog", () => {
    expect(finishDelete(network, listHref)).toEqual({
      kind: "show-error",
      message: CONNECTION_ERROR,
    });
    expect(finishDelete(abortedRequest, listHref)).toEqual({
      kind: "show-error",
      message: CONNECTION_ERROR,
    });
  });

  it.each([
    [403, /No tiene permiso/],
    [409, /cambiaron mientras se eliminaba/],
    [500, /No se pudo eliminar/],
    [503, /No se pudo eliminar/],
  ] as const)("shows a %i in the dialog", (status, pattern) => {
    const finish = finishDelete(response(status), listHref);
    expect(finish.kind).toBe("show-error");
    expect(finish.kind === "show-error" && finish.message).toMatch(pattern);
  });
});
