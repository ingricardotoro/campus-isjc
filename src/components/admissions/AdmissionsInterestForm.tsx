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

function FieldErrorText({ id, error }: { id: string; error?: FieldError }) {
  if (!error?.message) return null;
  return (
    <p id={id} className={styles.fieldError} role="alert">
      {error.message}
    </p>
  );
}

function SectionHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="col-12">
      <h3 className={styles.sectionTitle}>{title}</h3>
      {hint ? <p className={styles.sectionHint}>{hint}</p> : null}
    </div>
  );
}

const AdmissionsInterestForm: React.FC<Props> = ({ catalog }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const startedAt = useRef<number | null>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const singleYear = catalog.academicYears.length === 1 ? catalog.academicYears[0] : null;
  const gradeGroups = useMemo(() => groupGradesByLevel(catalog.grades), [catalog.grades]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver,
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
        toast.success("¡Solicitud enviada!", {
          description: "Nuestro equipo de admisiones se comunicará con usted pronto.",
          duration: 6000,
        });
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

  if (submitted) {
    return (
      <div ref={successRef} className={styles.success} role="status" tabIndex={-1}>
        <h3 className="mb-15">¡Gracias por su interés!</h3>
        <p className="mb-0">
          Recibimos su solicitud. Nuestro equipo de admisiones se comunicará con usted por el medio
          de contacto que nos indicó para orientarle sobre los siguientes pasos.
        </p>
      </div>
    );
  }

  const describedBy = (field: keyof FormValues) =>
    errors[field] ? `${field}-error` : undefined;

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Formulario de interés de admisión"
    >
      <div className="row gy-30">
        <SectionHeading title="Datos del encargado" hint="Persona con quien nos comunicaremos." />

        <div className="col-md-12">
          <div className="form-input-box">
            <div className="form-input-title">
              <label htmlFor="guardianName">
                Nombre completo<span>*</span>
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

        <div className="col-md-6">
          <div className="form-input-box">
            <div className="form-input-title">
              <label htmlFor="phone">Teléfono</label>
            </div>
            <div className="form-input">
              <input
                {...register("phone")}
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
                {...register("email")}
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
          <p id="contact-hint" className={styles.sectionHint}>
            Indique al menos un teléfono o un correo electrónico.
          </p>
        </div>

        <div className="col-md-12">
          <div className="form-input-box">
            <div className="form-input-title">
              <label htmlFor="preferredContactMethod">Medio de contacto preferido</label>
            </div>
            <div className="form-input">
              <select
                {...register("preferredContactMethod")}
                id="preferredContactMethod"
                className={`form-select ${styles.select}`}
                aria-invalid={errors.preferredContactMethod ? "true" : "false"}
                aria-describedby={describedBy("preferredContactMethod")}
              >
                <option value="">Sin preferencia</option>
                {CONTACT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {CONTACT_METHOD_LABELS[method]}
                  </option>
                ))}
              </select>
              <FieldErrorText
                id="preferredContactMethod-error"
                error={errors.preferredContactMethod}
              />
            </div>
          </div>
        </div>

        <SectionHeading title="Datos del estudiante" />

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

        <SectionHeading title="Interés académico" />

        {singleYear ? (
          <input type="hidden" {...register("academicYearId")} />
        ) : (
          <div className="col-md-12">
            <div className="form-input-box">
              <div className="form-input-title">
                <label htmlFor="academicYearId">
                  Año académico<span>*</span>
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
                <span>*</span>
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

        <div className="col-12">
          <section className={styles.privacyNotice} aria-labelledby="privacy-notice-title">
            <h4 id="privacy-notice-title" className="mb-10" style={{ fontSize: "16px" }}>
              {PRIVACY_NOTICE_TITLE}
            </h4>
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
              <span aria-hidden="true">*</span>
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
