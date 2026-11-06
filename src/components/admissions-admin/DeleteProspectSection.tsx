"use client";

import { useRouter } from "next/navigation";
import React, { useRef, useState } from "react";
import { toast } from "sonner";
import {
  DELETE_CONFIRMATION_WORD,
  confirmationMatches,
  interpretDeleteResponse,
} from "@/lib/admissions/admin-record";
import { CONNECTION_ERROR, requestAdmin } from "./admin-fetch";
import styles from "./AdmissionsAdmin.module.scss";
import { ADMIN_LOGIN_PATH } from "./useAdmissionsLogout";

type Props = {
  prospectId: string;
  studentLabel: string;
  /** The list to return to after the deletion, with its filters. */
  listHref: string;
};

/**
 * Admin only. A native modal dialog: the browser keeps focus inside it, closes it on Escape,
 * and makes the rest of the page inert. Focus goes back to the trigger when it closes.
 */
const DeleteProspectSection = ({ prospectId, studentLabel, listHref }: Props) => {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // showModal focuses the first focusable control, which is the confirmation input.
  const open = () => {
    setConfirmation("");
    setError(null);
    dialogRef.current?.showModal();
  };

  const close = () => dialogRef.current?.close();

  const handleCancel = (event: React.SyntheticEvent<HTMLDialogElement>) => {
    // Escape must not close the dialog while the deletion is in flight.
    if (isDeleting) event.preventDefault();
  };

  const leave = (message: string) => {
    toast.success(message);
    router.replace(listHref);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isDeleting) return;
    if (!confirmationMatches(confirmation)) {
      setError(`Escriba ${DELETE_CONFIRMATION_WORD} para confirmar.`);
      return;
    }

    setIsDeleting(true);
    setError(null);
    const result = await requestAdmin(`/api/admisiones-admin/prospects/${prospectId}`, {
      method: "DELETE",
    });
    if (result.kind !== "response") {
      setIsDeleting(false);
      setError(CONNECTION_ERROR);
      return;
    }

    const outcome = interpretDeleteResponse(result.status);
    if (outcome.kind === "deleted") return leave("La solicitud se eliminó.");
    if (outcome.kind === "already-deleted") return leave("La solicitud ya había sido eliminada.");
    if (outcome.kind === "login") return router.replace(ADMIN_LOGIN_PATH);
    setIsDeleting(false);
    setError(outcome.message);
  };

  const matches = confirmationMatches(confirmation);

  return (
    <section className={`mt-30 ${styles.dangerZone}`} aria-labelledby="danger-zone-title">
      <h3 id="danger-zone-title" className={styles.sectionTitle}>
        Zona de peligro
      </h3>
      <p>
        Eliminar la solicitud la borra de forma permanente, junto con su historial. Esta acción no
        se puede deshacer.
      </p>
      <button
        ref={triggerRef}
        type="button"
        className={`bd-btn ${styles.dangerButton}`}
        onClick={open}
      >
        Eliminar solicitud
      </button>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        onCancel={handleCancel}
        onClose={() => triggerRef.current?.focus()}
      >
        <form onSubmit={handleSubmit} noValidate>
          <h2 id="delete-dialog-title" className={`h4 ${styles.dialogTitle}`}>
            ¿Eliminar la solicitud de {studentLabel}?
          </h2>
          <div id="delete-dialog-description">
            <p>La eliminación es permanente y no se puede deshacer. Se borrarán:</p>
            <ul>
              <li>La solicitud y todo su historial de estados y actividades.</li>
              <li>
                Los datos del encargado, si no tiene otras solicitudes. Si tiene otras, sus datos
                se conservan.
              </li>
            </ul>
          </div>

          <label htmlFor="delete-confirmation" className={`form-label ${styles.filterLabel}`}>
            Para confirmar, escriba <strong>{DELETE_CONFIRMATION_WORD}</strong>
          </label>
          <input
            id="delete-confirmation"
            className={`form-control ${styles.filterControl}`}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            disabled={isDeleting}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? "delete-dialog-error" : undefined}
          />
          <p id="delete-dialog-error" className={styles.fieldError} role="alert">
            {error}
          </p>

          <div className={`mt-20 ${styles.formActions}`}>
            <button
              type="submit"
              className={`bd-btn ${styles.dangerButton}`}
              disabled={isDeleting || !matches}
            >
              {isDeleting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                  Eliminando...
                </>
              ) : (
                "Eliminar definitivamente"
              )}
            </button>
            <button
              type="button"
              className="bd-btn btn-outline-primary"
              onClick={close}
              disabled={isDeleting}
            >
              Cancelar
            </button>
          </div>
        </form>
      </dialog>
    </section>
  );
};

export default DeleteProspectSection;
