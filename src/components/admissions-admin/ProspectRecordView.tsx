import React from "react";
import type { ProspectDetail } from "@/lib/admissions/admin-queries";
import { mailtoHref, telHref, whatsappHref } from "@/lib/admissions/admin-record";
import { CONTACT_METHOD_LABELS, type ContactMethod } from "@/lib/admissions/schema";
import styles from "./AdmissionsAdmin.module.scss";

// Presentational pieces of the prospect record. They show saved data only.

const dateTimeFormatter = new Intl.DateTimeFormat("es-HN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Tegucigalpa",
});

const EMPTY = <span className={styles.emptyValue}>Sin dato</span>;

export const DateTime = ({ value }: { value: string | null }) =>
  value ? <time dateTime={value}>{dateTimeFormatter.format(new Date(value))}</time> : EMPTY;

export type DetailRow = { label: string; value: React.ReactNode; wide?: boolean };

export const DetailList = ({ rows }: { rows: DetailRow[] }) => (
  <dl className={`row ${styles.detailList}`}>
    {rows.map((row) => (
      <div key={row.label} className={row.wide ? "col-12" : "col-sm-6"}>
        <dt>{row.label}</dt>
        <dd>{row.value ?? EMPTY}</dd>
      </div>
    ))}
  </dl>
);

function contactMethodLabel(method: string | null): string | null {
  if (!method) return null;
  return CONTACT_METHOD_LABELS[method as ContactMethod] ?? method;
}

export function prospectRows(detail: ProspectDetail): DetailRow[] {
  return [
    { label: "Estudiante", value: detail.studentName || null },
    { label: "Estado", value: detail.status.name },
    { label: "Año lectivo", value: detail.academicYear.name },
    { label: "Grado", value: detail.grade.name },
    { label: "Modalidad", value: detail.modality?.name ?? "Sin definir" },
    { label: "Responsable", value: detail.assignee?.name ?? "Sin asignar" },
    { label: "Origen", value: detail.source.name },
    { label: "Campaña", value: detail.campaign?.name ?? null },
    { label: "Creada", value: <DateTime value={detail.createdAt} /> },
    { label: "Último contacto", value: <DateTime value={detail.lastContactAt} /> },
    { label: "Desea agendar una visita", value: detail.wantsVisit ? "Sí" : "No" },
    {
      label: "Notas internas",
      value: detail.internalNotes ? (
        <span className={styles.preWrap}>{detail.internalNotes}</span>
      ) : null,
      wide: true,
    },
  ];
}

export const ContactLinks = ({ guardian }: { guardian: ProspectDetail["guardian"] }) => {
  const tel = guardian.phone ? telHref(guardian.phone) : null;
  const whatsapp =
    guardian.phone && guardian.preferredContactMethod === "whatsapp"
      ? whatsappHref(guardian.phone)
      : null;

  if (!tel && !guardian.email) return null;
  return (
    <ul className={`${styles.plainList} ${styles.contactActions}`} aria-label="Contactar al encargado">
      {tel && (
        <li>
          <a className="bd-btn btn-outline-primary" href={tel}>
            Llamar
          </a>
        </li>
      )}
      {whatsapp && (
        <li>
          <a className="bd-btn btn-outline-primary" href={whatsapp} target="_blank" rel="noopener noreferrer">
            WhatsApp<span className="visually-hidden"> (se abre en una pestaña nueva)</span>
          </a>
        </li>
      )}
      {guardian.email && (
        <li>
          <a className="bd-btn btn-outline-primary" href={mailtoHref(guardian.email)}>
            Enviar correo
          </a>
        </li>
      )}
    </ul>
  );
};

export function guardianRows(detail: ProspectDetail): DetailRow[] {
  const { guardian } = detail;
  const tel = guardian.phone ? telHref(guardian.phone) : null;
  return [
    { label: "Nombre", value: guardian.name },
    {
      label: "Medio de contacto preferido",
      value: contactMethodLabel(guardian.preferredContactMethod) ?? "Sin preferencia",
    },
    {
      label: "Teléfono",
      value: guardian.phone ? tel ? <a href={tel}>{guardian.phone}</a> : guardian.phone : null,
    },
    {
      label: "Correo electrónico",
      value: guardian.email ? (
        <a className="text-break" href={mailtoHref(guardian.email)}>
          {guardian.email}
        </a>
      ) : null,
    },
  ];
}

export function consentRows(detail: ProspectDetail): DetailRow[] {
  return [
    { label: "Aceptó ser contactado", value: detail.consent.toContact ? "Sí" : "No" },
    { label: "Fecha del consentimiento", value: <DateTime value={detail.consent.at} /> },
    { label: "Versión del aviso de privacidad", value: detail.consent.privacyNoticeVersion },
  ];
}

export function originRows(detail: ProspectDetail): DetailRow[] {
  return [
    { label: "UTM source", value: detail.origin.utmSource },
    { label: "UTM medium", value: detail.origin.utmMedium },
    { label: "UTM campaign", value: detail.origin.utmCampaign },
    {
      label: "Página de llegada",
      value: detail.origin.landingPage ? (
        <span className="text-break">{detail.origin.landingPage}</span>
      ) : null,
      wide: true,
    },
  ];
}
