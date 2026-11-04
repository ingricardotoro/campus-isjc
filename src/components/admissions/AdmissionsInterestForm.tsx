"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm, type FieldError, type FieldErrors, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import type { AdmissionsCatalog, CatalogGrade } from "@/lib/admissions/catalog-types";
import { HONEYPOT_FIELD, STARTED_AT_FIELD } from "@/lib/admissions/form-fields";
import {
  CONSENT_LABEL,
  PRIVACY_NOTICE_PARAGRAPHS,
  PRIVACY_NOTICE_TITLE,
} from "@/lib/admissions/privacy-notice";
import {
  admissionsInterestSchema,
  CONTACT_METHOD_LABELS,
  CONTACT_METHODS,
  FIELD_MAX_LENGTH,
  type ContactMethod,
} from "@/lib/admissions/schema";
import styles from "./AdmissionsInterestForm.module.scss";

type FormValues = {
  guardianName: string;
  phone: string;
  email: string;
  preferredContactMethod: "" | ContactMethod;
  studentName: string;
  academicYearId: string;
  gradeId: string;
  modalityId: string;
  wantsVisit: boolean;
  consentToContact: boolean;
  website: string;
};

type Props = {
  catalog: AdmissionsCatalog;
};

const GENERIC_ERROR = "No pudimos enviar su solicitud. Por favor, intente nuevamente.";

// Public institute contact, as shown in the site header.
const INSTITUTE_PHONE = { href: "tel:+50422365298", label: "(+504) 2236-5298" };
const INSTITUTE_EMAIL = "info@sanjosedelcarmen.edu.hn";

const CONTACT_OPTIONS: Array<{ value: "" | ContactMethod; label: string }> = [
  { value: "", label: "Sin preferencia" },
  ...CONTACT_METHODS.map((method) => ({ value: method, label: CONTACT_METHOD_LABELS[method] })),
];

/** Validates with the same schema the API uses, so both sides agree. */
const zodResolver: Resolver<FormValues> = async (values) => {
  const result = admissionsInterestSchema.safeParse(values);
  if (result.success) return { values, errors: {} };

  const errors: Record<string, FieldError> = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? "");
    if (field && !errors[field]) errors[field] = { type: issue.code, message: issue.message };
  }
  return { values: {}, errors: errors as FieldErrors<FormValues> };
};

/** Tracking values from the current URL; the server trims and caps them. */
function readTracking() {
  const params = new URLSearchParams(window.location.search);
  const utmCampaign = params.get("utm_campaign");
  return {
    utmSource: params.get("utm_source"),
    utmMedium: params.get("utm_medium"),
    utmCampaign,
    campaignCode: params.get("campaign") ?? utmCampaign,
    landingPage: `${window.location.pathname}${window.location.search}`,
  };
}

function groupGradesByLevel(grades: CatalogGrade[]) {
  const groups: Array<{ level: string; grades: CatalogGrade[] }> = [];
  for (const grade of grades) {
    const group = groups.find((g) => g.level === grade.level);
    if (group) group.grades.push(grade);
    else groups.push({ level: grade.level, grades: [grade] });
  }
  return groups;
}

// Not a live region: a single summary near the submit button announces errors,
// so a form submitted empty does not read every message at once.
function FieldErrorText({ id, error }: { id: string; error?: FieldError }) {
  if (!error?.message) return null;
  return (
    <p id={id} className={styles.fieldError}>
      {error.message}
    </p>
  );
}

function RequiredMark() {
  return <span aria-hidden="true">*</span>;
}

/** Groups related fields so screen readers announce the section on entry. */
function FormSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className={`col-12 ${styles.section}`}>
      <legend className={styles.legend}>
        <h2 className={styles.sectionTitle}>{title}</h2>
      </legend>
      {hint ? <p className={styles.sectionHint}>{hint}</p> : null}
      <div className="row gy-30 mt-0">{children}</div>
    </fieldset>
  );
}

const AdmissionsInterestForm: React.FC<Props> = ({ catalog }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [restarted, setRestarted] = useState(false);
  const startedAt = useRef<number | null>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const singleYear = catalog.academicYears.length === 1 ? catalog.academicYears[0] : null;
  const gradeGroups = useMemo(() => groupGradesByLevel(catalog.grades), [catalog.grades]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    setFocus,
    formState: { errors, submitCount },
  } = useForm<FormValues>({
    resolver: zodResolver,
    // Validate each field when the family leaves it, not only on submit.
    mode: "onTouched",
    defaultValues: {
      guardianName: "",
      phone: "",
      email: "",
      preferredContactMethod: "",
      studentName: "",
      academicYearId: singleYear?.id ?? "",
      gradeId: "",
      modalityId: "",
      wantsVisit: false,
      consentToContact: false,
      website: "",
    },
  });

  // Set after mount so the server render and hydration do not disagree.
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const gradeId = watch("gradeId");
  const selectedGrade = catalog.grades.find((grade) => grade.id === gradeId);
  const modalities = selectedGrade?.modalities ?? [];

  // A modality belongs to a grade: clear it whenever the grade changes.
  useEffect(() => {
    setValue("modalityId", "");
  }, [gradeId, setValue]);

  useEffect(() => {
    if (submitted) successRef.current?.focus();
  }, [submitted]);

  // After "send another request", start where the new data goes.
  useEffect(() => {
    if (restarted && !submitted) setFocus("studentName");
  }, [restarted, submitted, setFocus]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const { website, ...interest } = values;
      const response = await fetch("/api/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...interest,
          ...readTracking(),
          [HONEYPOT_FIELD]: website,
          [STARTED_AT_FIELD]: startedAt.current,
        }),
      });

      if (response.ok) {
        // The focused success panel is the confirmation; a toast would repeat it.
        setSubmitted(true);
        return;
      }

      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      toast.error("No se pudo enviar la solicitud", {
        description: result?.error ?? GENERIC_ERROR,
        duration: 6000,
      });
    } catch {
      toast.error("Error de conexión", {
        description: "Verifique su conexión a internet e intente nuevamente.",
        duration: 6000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Keeps the guardian's contact data, e.g. to register a sibling. */
  const startAnotherRequest = () => {
    reset({
      ...getValues(),
      studentName: "",
      gradeId: "",
      modalityId: "",
      wantsVisit: false,
      consentToContact: false,
      website: "",
    });
    startedAt.current = Date.now();
    setRestarted(true);
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div ref={successRef} className={styles.success} role="status" tabIndex={-1}>
        <h2 className={styles.successTitle}>¡Gracias por su interés!</h2>
        <p>
          Recibimos su solicitud. Nuestro equipo de admisiones se comunicará con usted por el medio
          de contacto que nos indicó para orientarle sobre los siguientes pasos.
        </p>
        <p>
          Si tiene alguna consulta, puede llamarnos al{" "}
          <a href={INSTITUTE_PHONE.href}>{INSTITUTE_PHONE.label}</a> o escribirnos a{" "}
          <a href={`mailto:${INSTITUTE_EMAIL}`}>{INSTITUTE_EMAIL}</a>.
        </p>
        <button type="button" className="bd-btn btn-outline-primary" onClick={startAnotherRequest}>
          Enviar otra solicitud
        </button>
      </div>
    );
  }

  const describedBy = (field: keyof FormValues) =>
    errors[field] ? `${field}-error` : undefined;
  const errorCount = Object.keys(errors).length;

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Formulario de interés de admisión"
    >
      <div className="row gy-30">
        <div className="col-12">
          <p className={styles.requiredNote}>Los campos marcados con un asterisco (*) son obligatorios.</p>
        </div>

        <FormSection title="Datos del encargado" hint="Persona con quien nos comunicaremos.">
          <div className="col-md-12">
            <div className="form-input-box">
              <div className="form-input-title">
                <label htmlFor="guardianName">
                  Nombre completo
                  <RequiredMark />
                </label>
              </div>
              <div className="form-input">
                <input
                  {...register("guardianName")}
                  id="guardianName"
                  type="text"
                  autoComplete="name"
                  maxLength={FIELD_MAX_LENGTH.name}
                  placeholder="Nombre y apellidos"
                  aria-required="true"
                  aria-invalid={errors.guardianName ? "true" : "false"}
                  aria-describedby={describedBy("guardianName")}
                />
                <FieldErrorText id="guardianName-error" error={errors.guardianName} />
              </div>
            </div>
          </div>

          <div className="col-12">
            <p id="contact-hint" className={styles.sectionHint}>
              Indique al menos un teléfono o un correo electrónico.
            </p>
          </div>

          <div className="col-md-6">
            <div className="form-input-box">
              <div className="form-input-title">
                <label htmlFor="phone">Teléfono</label>
              </div>
              <div className="form-input">
                <input
                  {...register("phone", { deps: ["email"] })}
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={FIELD_MAX_LENGTH.phone}
                  placeholder="Ej. 9999-9999"
                  aria-invalid={errors.phone ? "true" : "false"}
                  aria-describedby={errors.phone ? "phone-error contact-hint" : "contact-hint"}
                />
                <FieldErrorText id="phone-error" error={errors.phone} />
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="form-input-box">
              <div className="form-input-title">
                <label htmlFor="email">Correo electrónico</label>
              </div>
              <div className="form-input">
                <input
                  {...register("email", { deps: ["phone"] })}
                  id="email"
                  type="email"
                  autoComplete="email"
                  maxLength={FIELD_MAX_LENGTH.email}
                  placeholder="nombre@correo.com"
                  aria-invalid={errors.email ? "true" : "false"}
                  aria-describedby={errors.email ? "email-error contact-hint" : "contact-hint"}
                />
                <FieldErrorText id="email-error" error={errors.email} />
              </div>
            </div>
          </div>

          <div className="col-12">
            <fieldset aria-describedby={describedBy("preferredContactMethod")}>
              <legend className={styles.fieldLegend}>Medio de contacto preferido</legend>
              <div className={styles.radioGroup}>
                {CONTACT_OPTIONS.map((option) => {
                  const id = `preferredContactMethod-${option.value || "none"}`;
                  return (
                    <div key={id} className={styles.radioOption}>
                      <input
                        {...register("preferredContactMethod")}
                        id={id}
                        type="radio"
                        value={option.value}
                      />
                      <label htmlFor={id}>{option.label}</label>
                    </div>
                  );
                })}
              </div>
              <FieldErrorText
                id="preferredContactMethod-error"
                error={errors.preferredContactMethod}
              />
            </fieldset>
          </div>
        </FormSection>

        <FormSection title="Datos del estudiante">
          <div className="col-md-12">
            <div className="form-input-box">
              <div className="form-input-title">
                <label htmlFor="studentName">Nombre del estudiante (opcional)</label>
              </div>
              <div className="form-input">
                <input
                  {...register("studentName")}
                  id="studentName"
                  type="text"
                  autoComplete="off"
                  maxLength={FIELD_MAX_LENGTH.name}
                  placeholder="Nombre del estudiante"
                  aria-invalid={errors.studentName ? "true" : "false"}
                  aria-describedby={describedBy("studentName")}
                />
                <FieldErrorText id="studentName-error" error={errors.studentName} />
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection title="Interés académico">
          {singleYear ? (
            <input type="hidden" {...register("academicYearId")} />
          ) : (
            <div className="col-md-12">
              <div className="form-input-box">
                <div className="form-input-title">
                  <label htmlFor="academicYearId">
                    Año académico
                    <RequiredMark />
                  </label>
                </div>
                <div className="form-input">
                  <select
                    {...register("academicYearId")}
                    id="academicYearId"
                    className={`form-select ${styles.select}`}
                    aria-required="true"
                    aria-invalid={errors.academicYearId ? "true" : "false"}
                    aria-describedby={describedBy("academicYearId")}
                  >
                    <option value="">Seleccione un año</option>
                    {catalog.academicYears.map((year) => (
                      <option key={year.id} value={year.id}>
                        {year.name}
                      </option>
                    ))}
                  </select>
                  <FieldErrorText id="academicYearId-error" error={errors.academicYearId} />
                </div>
              </div>
            </div>
          )}

          <div className={modalities.length > 0 ? "col-md-6" : "col-md-12"}>
            <div className="form-input-box">
              <div className="form-input-title">
                <label htmlFor="gradeId">
                  Grado de interés{singleYear ? ` (${singleYear.name})` : ""}
                  <RequiredMark />
                </label>
              </div>
              <div className="form-input">
                <select
                  {...register("gradeId")}
                  id="gradeId"
                  className={`form-select ${styles.select}`}
                  aria-required="true"
                  aria-invalid={errors.gradeId ? "true" : "false"}
                  aria-describedby={describedBy("gradeId")}
                >
                  <option value="">Seleccione un grado</option>
                  {gradeGroups.map((group) => (
                    <optgroup key={group.level} label={group.level}>
                      {group.grades.map((grade) => (
                        <option key={grade.id} value={grade.id}>
                          {grade.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <FieldErrorText id="gradeId-error" error={errors.gradeId} />
              </div>
            </div>
          </div>

          {modalities.length > 0 ? (
            <div className="col-md-6">
              <div className="form-input-box">
                <div className="form-input-title">
                  <label htmlFor="modalityId">Modalidad</label>
                </div>
                <div className="form-input">
                  <select
                    {...register("modalityId")}
                    id="modalityId"
                    className={`form-select ${styles.select}`}
                    aria-invalid={errors.modalityId ? "true" : "false"}
                    aria-describedby={describedBy("modalityId")}
                  >
                    <option value="">No estoy seguro</option>
                    {modalities.map((modality) => (
                      <option key={modality.id} value={modality.id}>
                        {modality.name}
                      </option>
                    ))}
                  </select>
                  <FieldErrorText id="modalityId-error" error={errors.modalityId} />
                </div>
              </div>
            </div>
          ) : null}

          <div className="col-12">
            <div className={styles.checkboxField}>
              <input {...register("wantsVisit")} id="wantsVisit" type="checkbox" />
              <label htmlFor="wantsVisit">Me gustaría agendar una visita al Instituto.</label>
            </div>
          </div>
        </FormSection>

        <div className="col-12">
          <section className={styles.privacyNotice} aria-labelledby="privacy-notice-title">
            <h2 id="privacy-notice-title" className={styles.privacyTitle}>
              {PRIVACY_NOTICE_TITLE}
            </h2>
            {PRIVACY_NOTICE_PARAGRAPHS.map((paragraph) => (
              <p key={paragraph} className="mb-10">
                {paragraph}
              </p>
            ))}
          </section>
        </div>

        <div className="col-12">
          <div className={styles.checkboxField}>
            <input
              {...register("consentToContact")}
              id="consentToContact"
              type="checkbox"
              aria-required="true"
              aria-invalid={errors.consentToContact ? "true" : "false"}
              aria-describedby={describedBy("consentToContact")}
            />
            <label htmlFor="consentToContact">
              {CONSENT_LABEL}
              <RequiredMark />
            </label>
          </div>
          <FieldErrorText id="consentToContact-error" error={errors.consentToContact} />
        </div>

        {/* Anti-spam trap: hidden from people and assistive technology. */}
        <div className={styles.honeypot} aria-hidden="true">
          <label htmlFor={HONEYPOT_FIELD}>No completar este campo</label>
          <input
            {...register("website")}
            id={HONEYPOT_FIELD}
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div className="col-12">
          {submitCount > 0 && errorCount > 0 ? (
            <p className={styles.errorSummary} role="alert">
              {errorCount === 1
                ? "Revise el campo marcado para poder enviar su solicitud."
                : `Revise los ${errorCount} campos marcados para poder enviar su solicitud.`}
            </p>
          ) : null}
          <div className="bd-contact-form-btn">
            <button className="bd-btn btn-primary w-100" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>{" "}
                  Enviando...
                </>
              ) : (
                "Enviar solicitud"
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default AdmissionsInterestForm;
