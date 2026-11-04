import { z } from "zod";

// Shared between the public form (client) and the API route (server).
// Keep this module free of server-only imports.

export const FIELD_MAX_LENGTH = {
  name: 150,
  phone: 30,
  email: 254,
  tracking: 200,
} as const;

export const CONTACT_METHODS = ["phone", "whatsapp", "email"] as const;
export type ContactMethod = (typeof CONTACT_METHODS)[number];

export const CONTACT_METHOD_LABELS: Record<ContactMethod, string> = {
  phone: "Llamada telefónica",
  whatsapp: "WhatsApp",
  email: "Correo electrónico",
};

/** Mirrors public.admissions_normalize_phone: digits only, without a leading 00. */
export function phoneDigits(raw: string): string {
  return raw.replace(/\D/g, "").replace(/^00/, "");
}

function trimmed(value: unknown): unknown {
  return typeof value === "string" ? value.trim() : value;
}

function emptyToNull(value: unknown): unknown {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return value;
  const text = value.trim();
  return text === "" ? null : text;
}

/** Tracking values come from the URL: never reject them, only clean them up. */
function trackingValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim().slice(0, FIELD_MAX_LENGTH.tracking);
  return text === "" ? null : text;
}

const trackingField = z.preprocess(trackingValue, z.string().nullable());

const catalogId = (message: string) => z.guid({ error: message });

export const admissionsInterestSchema = z
  .object({
    guardianName: z.preprocess(
      trimmed,
      z
        .string({ error: "Ingrese el nombre del encargado." })
        .min(2, { error: "Ingrese el nombre del encargado." })
        .max(FIELD_MAX_LENGTH.name, { error: "El nombre es demasiado largo." })
    ),
    phone: z.preprocess(
      emptyToNull,
      z
        .string()
        .max(FIELD_MAX_LENGTH.phone, { error: "Ingrese un teléfono válido." })
        .regex(/^[0-9+()\-.\s]+$/, { error: "Ingrese un teléfono válido." })
        .refine(
          (value) => {
            const digits = phoneDigits(value).length;
            return digits >= 8 && digits <= 15;
          },
          { error: "Ingrese un teléfono válido (8 a 15 dígitos)." }
        )
        .nullable()
    ),
    email: z.preprocess(
      (value) => {
        const text = emptyToNull(value);
        return typeof text === "string" ? text.toLowerCase() : text;
      },
      z
        .email({ error: "Ingrese un correo electrónico válido." })
        .max(FIELD_MAX_LENGTH.email, { error: "Ingrese un correo electrónico válido." })
        .nullable()
    ),
    preferredContactMethod: z.preprocess(
      emptyToNull,
      z.enum(CONTACT_METHODS, { error: "Seleccione un medio de contacto válido." }).nullable()
    ),
    studentName: z.preprocess(
      emptyToNull,
      z.string().max(FIELD_MAX_LENGTH.name, { error: "El nombre es demasiado largo." }).nullable()
    ),
    academicYearId: catalogId("Seleccione el año académico."),
    gradeId: catalogId("Seleccione el grado de interés."),
    modalityId: z.preprocess(emptyToNull, catalogId("Seleccione una modalidad válida.").nullable()),
    wantsVisit: z.boolean().default(false),
    consentToContact: z.literal(true, {
      error: "Debe aceptar el aviso de privacidad para continuar.",
    }),
    utmSource: trackingField,
    utmMedium: trackingField,
    utmCampaign: trackingField,
    campaignCode: trackingField,
    landingPage: trackingField,
  })
  .superRefine((data, ctx) => {
    if (data.phone === null && data.email === null) {
      ctx.addIssue({
        code: "custom",
        path: ["phone"],
        message: "Ingrese un teléfono o un correo electrónico.",
      });
    }
    if (data.preferredContactMethod === "email" && data.email === null) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: "Ingrese un correo electrónico para este medio de contacto.",
      });
    }
    if (
      (data.preferredContactMethod === "phone" || data.preferredContactMethod === "whatsapp") &&
      data.phone === null
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["phone"],
        message: "Ingrese un teléfono para este medio de contacto.",
      });
    }
  });

export type AdmissionsInterest = z.infer<typeof admissionsInterestSchema>;
