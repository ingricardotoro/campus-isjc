"use client";

import React, { useEffect, useRef } from "react";
import {
  interpretSaveResponse,
  type SaveOutcome,
  type SelectOption,
} from "@/lib/admissions/admin-record";
import { CONNECTION_ERROR, requestAdmin } from "./admin-fetch";
import styles from "./AdmissionsAdmin.module.scss";

export type FieldSpec = { name: string; label: string; id: string };

/** Ids of the elements that describe a field: its hint and its error, when present. */
export function describedBy(id: string, hasHint: boolean, error: string | undefined) {
  const ids = [hasHint && `${id}-hint`, error && `${id}-error`].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

export const FieldError = ({ id, error }: { id: string; error: string | undefined }) =>
  error ? (
    <p id={`${id}-error`} className={styles.fieldError}>
      {error}
    </p>
  ) : null;

/**
 * The form-level message, with links to each failing field. It takes focus every time a new
 * attempt fails, so screen readers announce it and keyboard users start from it.
 */
export const ErrorSummary = ({
  message,
  attempt,
  fields,
  fieldErrors,
}: {
  message: string | null;
  attempt: number;
  fields: FieldSpec[];
  fieldErrors: Record<string, string>;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message) ref.current?.focus();
  }, [message, attempt]);

  if (!message) return null;
  const failing = fields.filter((field) => fieldErrors[field.name]);
  return (
    <div ref={ref} tabIndex={-1} role="alert" className={styles.errorSummary}>
      <p className="mb-0">{message}</p>
      {failing.length > 0 && (
        <ul className="mt-10 mb-0">
          {failing.map((field) => (
            <li key={field.name}>
              <a href={`#${field.id}`}>
                {field.label}: {fieldErrors[field.name]}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const SelectField = ({
  field,
  value,
  options,
  onChange,
  error,
  hint,
  disabled,
}: {
  field: FieldSpec;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  disabled?: boolean;
}) => (
  <div>
    <label htmlFor={field.id} className={`form-label ${styles.filterLabel}`}>
      {field.label}
    </label>
    <select
      id={field.id}
      className={`form-select ${styles.filterControl}`}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-invalid={error ? "true" : undefined}
      aria-describedby={describedBy(field.id, Boolean(hint), error)}
      disabled={disabled}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {hint && (
      <p id={`${field.id}-hint`} className={styles.filterHint}>
        {hint}
      </p>
    )}
    <FieldError id={field.id} error={error} />
  </div>
);

export const TextField = ({
  field,
  value,
  onChange,
  error,
  hint,
  multiline,
  ...inputProps
}: {
  field: FieldSpec;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  multiline?: boolean;
} & Pick<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "inputMode" | "autoComplete" | "maxLength" | "required" | "disabled"
>) => {
  const common = {
    id: field.id,
    className: `form-control ${styles.filterControl}`,
    value,
    "aria-invalid": error ? ("true" as const) : undefined,
    "aria-describedby": describedBy(field.id, Boolean(hint), error),
  };
  return (
    <div>
      <label htmlFor={field.id} className={`form-label ${styles.filterLabel}`}>
        {field.label}
        {inputProps.required && <span aria-hidden="true"> *</span>}
      </label>
      {multiline ? (
        <textarea
          {...common}
          rows={5}
          maxLength={inputProps.maxLength}
          disabled={inputProps.disabled}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input {...common} {...inputProps} onChange={(event) => onChange(event.target.value)} />
      )}
      {hint && (
        <p id={`${field.id}-hint`} className={styles.filterHint}>
          {hint}
        </p>
      )}
      <FieldError id={field.id} error={error} />
    </div>
  );
};

/** Asks the browser to confirm before a reload or a closed tab drops unsaved changes. */
export function useBeforeUnloadWarning(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Older browsers need a return value to show the prompt.
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [active]);
}

/** Sends only the changed fields. A network failure reads as a rejected save. */
export async function sendPatch(
  url: string,
  body: object,
  target: "prospect" | "guardian"
): Promise<SaveOutcome> {
  const result = await requestAdmin(url, { method: "PATCH", json: body });
  if (result.kind !== "response") {
    return { kind: "rejected", message: CONNECTION_ERROR, fieldErrors: {} };
  }
  return interpretSaveResponse(target, result.status, result.body);
}

/** What an edit form reports to the record page when a save cannot go on there. */
export type LeaveOutcome = "login" | "no-access" | "not-found";

export type FormFailure = {
  message: string | null;
  attempt: number;
  fieldErrors: Record<string, string>;
};

export const NO_FAILURE: FormFailure = { message: null, attempt: 0, fieldErrors: {} };

export function nextFailure(
  previous: FormFailure,
  message: string,
  fieldErrors: Record<string, string>
): FormFailure {
  return { message, attempt: previous.attempt + 1, fieldErrors };
}

export const SaveButtons = ({
  isSaving,
  isDirty,
  onCancel,
}: {
  isSaving: boolean;
  isDirty: boolean;
  onCancel: () => void;
}) => (
  <div className={`mt-20 ${styles.formActions}`}>
    <button type="submit" className="bd-btn btn-primary" disabled={isSaving || !isDirty}>
      {isSaving ? (
        <>
          <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
          Guardando...
        </>
      ) : (
        "Guardar cambios"
      )}
    </button>
    <button
      type="button"
      className="bd-btn btn-outline-primary"
      onClick={onCancel}
      disabled={isSaving}
    >
      Cancelar
    </button>
    <span className={styles.unsavedNote} aria-live="polite">
      {isDirty && !isSaving ? "Cambios sin guardar" : ""}
    </span>
  </div>
);
