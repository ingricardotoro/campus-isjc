import "server-only";
import { PRIVACY_NOTICE_VERSION } from "./privacy-notice";
import type { AdmissionsInterest, ContactMethod } from "./schema";

export const PUBLIC_SOURCE_CODE = "WEB_FORM";

/** Parameters of public.admissions_register_public_interest. */
export type RegisterParams = {
  p_guardian_name: string;
  p_phone: string | null;
  p_email: string | null;
  p_preferred_contact_method: ContactMethod | null;
  p_student_name: string | null;
  p_academic_year_id: string;
  p_grade_id: string;
  p_modality_id: string | null;
  p_consent_to_contact: boolean;
  p_privacy_notice_version: string;
  p_wants_visit: boolean;
  p_source_code: string;
  p_campaign_code: string | null;
  p_utm_source: string | null;
  p_utm_medium: string | null;
  p_utm_campaign: string | null;
  p_landing_page: string | null;
};

export type RegisterResultRow = {
  prospect_id: string;
  guardian_id: string;
  is_new_prospect: boolean;
};

export function toRegisterParams(input: AdmissionsInterest): RegisterParams {
  return {
    p_guardian_name: input.guardianName,
    p_phone: input.phone,
    p_email: input.email,
    p_preferred_contact_method: input.preferredContactMethod,
    p_student_name: input.studentName,
    p_academic_year_id: input.academicYearId,
    p_grade_id: input.gradeId,
    p_modality_id: input.modalityId,
    p_consent_to_contact: input.consentToContact,
    p_privacy_notice_version: PRIVACY_NOTICE_VERSION,
    p_wants_visit: input.wantsVisit,
    p_source_code: PUBLIC_SOURCE_CODE,
    p_campaign_code: input.campaignCode,
    p_utm_source: input.utmSource,
    p_utm_medium: input.utmMedium,
    p_utm_campaign: input.utmCampaign,
    p_landing_page: input.landingPage,
  };
}

export type RegisterErrorKind = "invalid_input" | "unexpected";

/** The RPC raises SQLSTATE 22023 for every input it rejects. */
export function classifyRegisterError(error: { code?: string | null; message?: string } | null): RegisterErrorKind {
  return error?.code === "22023" ? "invalid_input" : "unexpected";
}
