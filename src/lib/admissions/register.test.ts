import { describe, expect, it } from "vitest";
import { PRIVACY_NOTICE_VERSION } from "./privacy-notice";
import { classifyRegisterError, toRegisterParams } from "./register";
import { admissionsInterestSchema } from "./schema";

const YEAR_ID = "11111111-1111-4111-8111-111111111111";
const GRADE_ID = "22222222-2222-4222-8222-222222222222";
const MODALITY_ID = "33333333-3333-4333-8333-333333333333";

describe("toRegisterParams", () => {
  it("maps validated input to the RPC parameters with the web form source", () => {
    const input = admissionsInterestSchema.parse({
      guardianName: "María López",
      phone: "9999-8888",
      email: "maria@example.com",
      preferredContactMethod: "email",
      studentName: "Ana",
      academicYearId: YEAR_ID,
      gradeId: GRADE_ID,
      modalityId: MODALITY_ID,
      wantsVisit: true,
      consentToContact: true,
      utmSource: "facebook",
      utmMedium: "cpc",
      utmCampaign: "admisiones-2027",
      campaignCode: "ADM2027",
      landingPage: "/admisiones-2027?utm_source=facebook",
    });

    expect(toRegisterParams(input)).toEqual({
      p_guardian_name: "María López",
      p_phone: "9999-8888",
      p_email: "maria@example.com",
      p_preferred_contact_method: "email",
      p_student_name: "Ana",
      p_academic_year_id: YEAR_ID,
      p_grade_id: GRADE_ID,
      p_modality_id: MODALITY_ID,
      p_consent_to_contact: true,
      p_privacy_notice_version: PRIVACY_NOTICE_VERSION,
      p_wants_visit: true,
      p_source_code: "WEB_FORM",
      p_campaign_code: "ADM2027",
      p_utm_source: "facebook",
      p_utm_medium: "cpc",
      p_utm_campaign: "admisiones-2027",
      p_landing_page: "/admisiones-2027?utm_source=facebook",
    });
  });

  it("sends nulls for omitted optional values", () => {
    const input = admissionsInterestSchema.parse({
      guardianName: "Juan",
      phone: "99998888",
      academicYearId: YEAR_ID,
      gradeId: GRADE_ID,
      consentToContact: true,
    });

    expect(toRegisterParams(input)).toMatchObject({
      p_email: null,
      p_preferred_contact_method: null,
      p_student_name: null,
      p_modality_id: null,
      p_wants_visit: false,
      p_campaign_code: null,
      p_landing_page: null,
    });
  });
});

describe("classifyRegisterError", () => {
  it("treats SQLSTATE 22023 as invalid input", () => {
    expect(classifyRegisterError({ code: "22023", message: "phone is not valid" })).toBe(
      "invalid_input"
    );
  });

  it("treats anything else as unexpected", () => {
    expect(classifyRegisterError({ code: "P0002", message: "x" })).toBe("unexpected");
    expect(classifyRegisterError({ message: "network" })).toBe("unexpected");
  });
});
