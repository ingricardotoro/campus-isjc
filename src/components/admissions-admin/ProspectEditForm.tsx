"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { AdmissionsAdminCatalogs, ProspectDetail } from "@/lib/admissions/admin-queries";
import {
  INTERNAL_NOTES_MAX_LENGTH,
  type ProspectFormValues,
  assigneeOptions,
  gradeOptions,
  modalityAfterGradeChange,
  modalityOptions,
  prospectFormErrors,
  prospectFormFrom,
  prospectPatch,
  statusOptions,
} from "@/lib/admissions/admin-record";
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
  statusId: { name: "statusId", label: "Estado", id: "prospect-status" },
  assignedTo: { name: "assignedTo", label: "Responsable", id: "prospect-assignee" },
  gradeId: { name: "gradeId", label: "Grado", id: "prospect-grade" },
  modalityId: { name: "modalityId", label: "Modalidad", id: "prospect-modality" },
  studentName: { name: "studentName", label: "Nombre del estudiante", id: "prospect-student" },
  internalNotes: { name: "internalNotes", label: "Notas internas", id: "prospect-notes" },
} satisfies Record<keyof ProspectFormValues, FieldSpec>;

const FIELD_LIST = Object.values(FIELDS);

type Props = {
  detail: ProspectDetail;
  catalogs: AdmissionsAdminCatalogs;
  onCancel: () => void;
  onSaved: () => void;
  onLeave: (outcome: LeaveOutcome) => void;
  onDirtyChange: (dirty: boolean) => void;
};

const ProspectEditForm = ({ detail, catalogs, onCancel, onSaved, onLeave, onDirtyChange }: Props) => {
  // The form keeps the values it opened with as its baseline, so it sends only what changed.
  const [initial] = useState(() => prospectFormFrom(detail));
  const [values, setValues] = useState(initial);
  const [failure, setFailure] = useState(NO_FAILURE);
  const [isSaving, setIsSaving] = useState(false);
  const [modalityNotice, setModalityNotice] = useState("");
  const firstFieldRef = useRef<HTMLDivElement>(null);

  const patch = useMemo(() => prospectPatch(initial, values), [initial, values]);
  const isDirty = Object.keys(patch).length > 0;

  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange]);

  useEffect(() => {
    firstFieldRef.current?.querySelector("select")?.focus();
  }, []);

  const current = { gradeId: initial.gradeId, modality: detail.modality };
  const options = {
    statusId: statusOptions(catalogs, detail.status),
    assignedTo: assigneeOptions(catalogs, detail.assignee),
    gradeId: gradeOptions(catalogs, detail.grade),
    modalityId: modalityOptions(catalogs, values.gradeId, current),
  };
  const gradeHasModalities = options.modalityId.length > 1;

  const set = (key: keyof ProspectFormValues) => (value: string) =>
    setValues((previous) => ({ ...previous, [key]: value }));

  const changeGrade = (gradeId: string) => {
    const modalityId =
      gradeId === initial.gradeId && values.modalityId === initial.modalityId
        ? values.modalityId
        : modalityAfterGradeChange(catalogs, gradeId, values.modalityId);
    setModalityNotice(
      values.modalityId !== "" && modalityId === ""
        ? "La modalidad se dejó sin definir porque no se ofrece para el grado seleccionado."
        : ""
    );
    setValues((previous) => ({ ...previous, gradeId, modalityId }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving || !isDirty) return;

    const localErrors = prospectFormErrors(catalogs, initial, values);
    if (Object.keys(localErrors).length > 0) {
      setFailure((previous) => nextFailure(previous, "Revise los datos marcados.", localErrors));
      return;
    }

    setIsSaving(true);
    const outcome = await sendPatch(`/api/admisiones-admin/prospects/${detail.id}`, patch, "prospect");
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

  const errorOf = (key: keyof ProspectFormValues) => failure.fieldErrors[key];

  return (
    <form onSubmit={handleSubmit} noValidate aria-labelledby="prospect-section-title">
      <ErrorSummary
        message={failure.message}
        attempt={failure.attempt}
        fields={FIELD_LIST}
        fieldErrors={failure.fieldErrors}
      />
      <fieldset disabled={isSaving} className={styles.plainFieldset}>
        <legend className="visually-hidden">Datos de la solicitud</legend>
        <div className="row g-3">
          <div className="col-md-6" ref={firstFieldRef}>
            <SelectField
              field={FIELDS.statusId}
              value={values.statusId}
              options={options.statusId}
              onChange={set("statusId")}
              error={errorOf("statusId")}
            />
          </div>
          <div className="col-md-6">
            <SelectField
              field={FIELDS.assignedTo}
              value={values.assignedTo}
              options={options.assignedTo}
              onChange={set("assignedTo")}
              error={errorOf("assignedTo")}
              hint="Solo personal activo que puede editar solicitudes."
            />
          </div>
          <div className="col-md-6">
            <SelectField
              field={FIELDS.gradeId}
              value={values.gradeId}
              options={options.gradeId}
              onChange={changeGrade}
              error={errorOf("gradeId")}
            />
          </div>
          <div className="col-md-6">
            <SelectField
              field={FIELDS.modalityId}
              value={values.modalityId}
              options={options.modalityId}
              onChange={(value) => {
                setModalityNotice("");
                set("modalityId")(value);
              }}
              error={errorOf("modalityId")}
              hint={gradeHasModalities ? undefined : "Este grado no ofrece modalidades para elegir."}
            />
            <p className={styles.filterHint} role="status">
              {modalityNotice}
            </p>
          </div>
          <div className="col-12">
            <TextField
              field={FIELDS.studentName}
              value={values.studentName}
              onChange={set("studentName")}
              error={errorOf("studentName")}
              autoComplete="off"
              maxLength={150}
            />
          </div>
          <div className="col-12">
            <TextField
              field={FIELDS.internalNotes}
              value={values.internalNotes}
              onChange={set("internalNotes")}
              error={errorOf("internalNotes")}
              hint={`Solo para el personal. Máximo ${INTERNAL_NOTES_MAX_LENGTH} caracteres.`}
              maxLength={INTERNAL_NOTES_MAX_LENGTH}
              multiline
            />
          </div>
        </div>
      </fieldset>
      <SaveButtons isSaving={isSaving} isDirty={isDirty} onCancel={onCancel} />
    </form>
  );
};

export default ProspectEditForm;
