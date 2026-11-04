import "server-only";
import { Resend } from "resend";
import type { InterestLabels } from "./catalog";
import { CONTACT_METHOD_LABELS, type AdmissionsInterest } from "./schema";

export const NOTIFICATION_SENDER = "Admisiones ISJC <contacto@sanjosedelcarmen.edu.hn>";

const NOT_AVAILABLE = "No disponible";
const NOT_PROVIDED = "No indicado";

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

/** Reads a comma-separated recipient list; empty or unset yields no recipients. */
export function parseRecipients(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry !== "");
}

export type NotificationEmail = {
  subject: string;
  html: string;
  text: string;
};

export function buildNotificationEmail(
  input: AdmissionsInterest,
  labels: InterestLabels
): NotificationEmail {
  const rows: Array<[string, string]> = [
    ["Encargado", input.guardianName],
    ["Teléfono", input.phone ?? NOT_PROVIDED],
    ["Correo electrónico", input.email ?? NOT_PROVIDED],
    [
      "Medio de contacto preferido",
      input.preferredContactMethod ? CONTACT_METHOD_LABELS[input.preferredContactMethod] : NOT_PROVIDED,
    ],
    ["Estudiante", input.studentName ?? NOT_PROVIDED],
    ["Año académico", labels.academicYear ?? NOT_AVAILABLE],
    ["Grado de interés", labels.grade ?? NOT_AVAILABLE],
    ["Modalidad", input.modalityId ? labels.modality ?? NOT_AVAILABLE : "Sin preferencia"],
    ["Desea agendar una visita", input.wantsVisit ? "Sí" : "No"],
    ["Campaña", input.campaignCode ?? NOT_PROVIDED],
    ["utm_source", input.utmSource ?? NOT_PROVIDED],
    ["utm_medium", input.utmMedium ?? NOT_PROVIDED],
    ["utm_campaign", input.utmCampaign ?? NOT_PROVIDED],
    ["Página de llegada", input.landingPage ?? NOT_PROVIDED],
  ];

  const subjectName = input.guardianName.replace(/[\r\n]+/g, " ").trim();
  const subject = `Nuevo interés de admisión: ${subjectName}`;

  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px;font-weight:bold;vertical-align:top;">${escapeHtml(label)}</td>` +
        `<td style="padding:6px 12px;">${escapeHtml(value)}</td></tr>`
    )
    .join("");

  const html =
    `<div style="font-family:Arial,sans-serif;color:#222;">` +
    `<h2>Nuevo interés de admisión desde el sitio web</h2>` +
    `<p>Una familia completó el formulario público de admisiones.</p>` +
    `<table style="border-collapse:collapse;">${tableRows}</table>` +
    `</div>`;

  const text = [
    "Nuevo interés de admisión desde el sitio web",
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
  ].join("\n");

  return { subject, html, text };
}

/**
 * Sends the team notification. Never throws: a missing configuration or a
 * delivery failure is logged without personal data and the caller continues.
 */
export async function sendAdmissionsNotification(
  input: AdmissionsInterest,
  labels: InterestLabels
): Promise<void> {
  const recipients = parseRecipients(process.env.ADMISSIONS_NOTIFICATION_EMAILS);
  if (recipients.length === 0) {
    console.warn("[admissions] ADMISSIONS_NOTIFICATION_EMAILS is not set; notification skipped.");
    return;
  }
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[admissions] RESEND_API_KEY is not set; notification skipped.");
    return;
  }

  try {
    const email = buildNotificationEmail(input, labels);
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: NOTIFICATION_SENDER,
      to: recipients,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
    if (error) {
      console.error("[admissions] Notification email failed:", error.name);
    }
  } catch (error) {
    console.error(
      "[admissions] Notification email threw:",
      error instanceof Error ? error.name : "unknown"
    );
  }
}
