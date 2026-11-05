"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ProspectDetail } from "@/lib/admissions/admin-queries";
import {
  type GuardianFormValues,
  guardianFormFrom,
  guardianPatch,
} from "@/lib/admissions/admin-record";
import { CONTACT_METHODS, CONTACT_METHOD_LABELS } from "@/lib/admissions/schema";
import styles from "./AdmissionsAdmin.module.scss";
import {
  ErrorSummary,
  type FieldSpec,
  type LeaveOutcome,
  NO_FAILURE,
  SaveButtons,
  SelectField,
  TextField,
  nextFailure,
  sendPatch,
} from "./RecordFormParts";

const FIELDS = {
  name: { name: "name", label: "Nombre del encargado", id: "guardian-name" },
  phone: { name: "phone", label: "Teléfono", id: "guardian-phone" },
  email: { name: "email", label: "Correo electrónico", id: "guardian-email" },
  preferredContactMethod: {
    name: "preferredContactMethod",
    label: "Medio de contacto preferido",
    id: "guardian-method",
  },
} satisfies Record<keyof GuardianFormValues, FieldSpec>;

const FIELD_LIST = Object.values(FIELDS);

const METHOD_OPTIONS = [
  { value: "", label: "Sin preferencia" },
  ...CONTACT_METHODS.map((method) => ({ value: method, label: CONTACT_METHOD_LABELS[method] })),
];

type Props = {
  detail: ProspectDetail;
  onCancel: () => void;
  onSaved: () => void;
  onLeave: (outcome: LeaveOutcome) => void;
  onDirtyChange: (dirty: boolean) => void;
};

const GuardianEditForm = ({ detail, onCancel, onSaved, onLeave, onDirtyChange }: Props) => {
  const [initial] = useState(() => guardianFormFrom(detail));
  const [values, setValues] = useState(initial);
  const [failure, setFailure] = useState(NO_FAILURE);
  const [isSaving, setIsSaving] = useState(false);
  const nameRef = useRef<HTMLDivElement>(null);

  const patch = useMemo(() => guardianPatch(initial, values), [initial, values]);
  const isDirty = Object.keys(patch).length > 0;

  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange]);

  useEffect(() => {
    nameRef.current?.querySelector("input")?.focus();
  }, []);

  // A value the API no longer accepts (an old method) stays visible instead of a blank select.
  const methodOptions = METHOD_OPTIONS.some((option) => option.value === initial.preferredContactMethod)
    ? METHOD_OPTIONS
    : [
        { value: initial.preferredContactMethod, label: `${initial.preferredContactMethod} (no válido)` },
        ...METHOD_OPTIONS,
      ];

  const set = (key: keyof GuardianFormValues) => (value: string) =>
    setValues((previous) => ({ ...previous, [key]: value }));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving || !isDirty) return;

    setIsSaving(true);
    const outcome = await sendPatch(
      `/api/admisiones-admin/guardians/${detail.guardian.id}`,
      patch,
      "guardian"
    );
    if (outcome.kind === "saved") {
      onSaved();
      return;
    }
    setIsSaving(false);
    if (outcome.kind === "rejected") {
      setFailure((previous) => nextFailure(previous, outcome.message, outcome.fieldErrors));
    } else {
      onLeave(outcome.kind);
    }
  };

  const errorOf = (key: keyof GuardianFormValues) => failure.fieldErrors[key];

  return (
    <form onSubmit={handleSubmit} noValidate aria-labelledby="guardian-section-title">
      <ErrorSummary
        message={failure.message}
        attempt={failure.attempt}
        fields={FIELD_LIST}
        fieldErrors={failure.fieldErrors}
      />
      <p className={styles.filterHint}>
        Indique al menos un teléfono o un correo. El medio preferido necesita su dato de contacto.
      </p>
      <fieldset disabled={isSaving} className={styles.plainFieldset}>
        <legend className="visually-hidden">Datos del encargado</legend>
        <div className="row g-3 mt-0">
          <div className="col-12" ref={nameRef}>
            <TextField
              field={FIELDS.name}
              value={values.name}
              onChange={set("name")}
              error={errorOf("name")}
              autoComplete="off"
              maxLength={150}
              required
            />
          </div>
          <div className="col-md-6">
            <TextField
              field={FIELDS.phone}
              value={values.phone}
              onChange={set("phone")}
              error={errorOf("phone")}
              type="tel"
              inputMode="tel"
              autoComplete="off"
              maxLength={30}
            />
          </div>
          <div className="col-md-6">
            <TextField
              field={FIELDS.email}
              value={values.email}
              onChange={set("email")}
              error={errorOf("email")}
              type="email"
              inputMode="email"
              autoComplete="off"
              maxLength={254}
            />
          </div>
          <div className="col-md-6">
            <SelectField
              field={FIELDS.preferredContactMethod}
              value={values.preferredContactMethod}
              options={methodOptions}
              onChange={set("preferredContactMethod")}
              error={errorOf("preferredContactMethod")}
            />
          </div>
        </div>
      </fieldset>
      <p className={`mt-15 mb-0 ${styles.filterHint}`}>
        Los cambios se aplican a todas las solicitudes de este encargado.
      </p>
      <SaveButtons isSaving={isSaving} isDirty={isDirty} onCancel={onCancel} />
    </form>
  );
};

export default GuardianEditForm;
