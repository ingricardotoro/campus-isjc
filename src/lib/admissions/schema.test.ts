import { describe, expect, it } from "vitest";
import { admissionsInterestSchema, FIELD_MAX_LENGTH } from "./schema";

const YEAR_ID = "11111111-1111-4111-8111-111111111111";
const GRADE_ID = "22222222-2222-4222-8222-222222222222";
const MODALITY_ID = "33333333-3333-4333-8333-333333333333";

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    guardianName: "  María López  ",
    phone: "9999-8888",
    email: "",
    preferredContactMethod: "whatsapp",
    studentName: "",
    academicYearId: YEAR_ID,
    gradeId: GRADE_ID,
    modalityId: "",
    wantsVisit: false,
    consentToContact: true,
    ...overrides,
  };
}

function issuePaths(input: unknown) {
  const result = admissionsInterestSchema.safeParse(input);
  if (result.success) return [];
  return result.error.issues.map((issue) => issue.path.join("."));
}

describe("admissionsInterestSchema", () => {
  it("accepts a phone-only submission and normalizes empty optionals to null", () => {
    const result = admissionsInterestSchema.parse(validInput());

    expect(result).toMatchObject({
      guardianName: "María López",
      phone: "9999-8888",
      email: null,
      preferredContactMethod: "whatsapp",
      studentName: null,
      modalityId: null,
      wantsVisit: false,
      consentToContact: true,
    });
  });

  it("accepts an email-only submission and lower-cases the email", () => {
    const result = admissionsInterestSchema.parse(
      validInput({ phone: "", email: " Familia@Example.COM ", preferredContactMethod: "email" })
    );

    expect(result.phone).toBeNull();
    expect(result.email).toBe("familia@example.com");
  });

  it("requires a phone or an email", () => {
    expect(issuePaths(validInput({ phone: "", email: "", preferredContactMethod: "" }))).toContain(
      "phone"
    );
  });

  it("rejects phones with fewer than 8 or more than 15 digits", () => {
    expect(issuePaths(validInput({ phone: "1234567" }))).toContain("phone");
    expect(issuePaths(validInput({ phone: "1234567890123456" }))).toContain("phone");
  });

  it("accepts international phones with symbols", () => {
    expect(issuePaths(validInput({ phone: "+504 (9999) 88-88" }))).toEqual([]);
  });

  it("rejects phones with letters", () => {
    expect(issuePaths(validInput({ phone: "9999-88AB" }))).toContain("phone");
  });

  it("rejects malformed emails", () => {
    expect(issuePaths(validInput({ email: "not-an-email" }))).toContain("email");
  });

  it("requires consent to contact", () => {
    expect(issuePaths(validInput({ consentToContact: false }))).toContain("consentToContact");
    expect(issuePaths(validInput({ consentToContact: undefined }))).toContain("consentToContact");
  });

  it("requires the guardian name", () => {
    expect(issuePaths(validInput({ guardianName: "   " }))).toContain("guardianName");
  });

  it("requires the contact channel matching the preferred method", () => {
    expect(issuePaths(validInput({ preferredContactMethod: "email" }))).toContain("email");
    expect(
      issuePaths(validInput({ phone: "", email: "a@b.co", preferredContactMethod: "phone" }))
    ).toContain("phone");
  });

  it("rejects unknown contact methods", () => {
    expect(issuePaths(validInput({ preferredContactMethod: "fax" }))).toContain(
      "preferredContactMethod"
    );
  });

  it("requires catalog identifiers to be UUIDs", () => {
    const paths = issuePaths(validInput({ academicYearId: "2027", gradeId: "x", modalityId: "y" }));

    expect(paths).toEqual(expect.arrayContaining(["academicYearId", "gradeId", "modalityId"]));
  });

  it("keeps a selected modality", () => {
    expect(admissionsInterestSchema.parse(validInput({ modalityId: MODALITY_ID })).modalityId).toBe(
      MODALITY_ID
    );
  });

  it("trims and truncates tracking fields instead of rejecting them", () => {
    const long = "x".repeat(FIELD_MAX_LENGTH.tracking + 50);
    const result = admissionsInterestSchema.parse(
      validInput({ utmSource: "  facebook ", utmCampaign: long, landingPage: "" })
    );

    expect(result.utmSource).toBe("facebook");
    expect(result.utmCampaign).toHaveLength(FIELD_MAX_LENGTH.tracking);
    expect(result.landingPage).toBeNull();
    expect(result.utmMedium).toBeNull();
  });

  it("rejects overly long names", () => {
    expect(
      issuePaths(validInput({ guardianName: "a".repeat(FIELD_MAX_LENGTH.name + 1) }))
    ).toContain("guardianName");
  });

  it("drops unknown keys such as the honeypot", () => {
    const result = admissionsInterestSchema.parse(validInput({ website: "spam", startedAt: 1 }));

    expect(result).not.toHaveProperty("website");
    expect(result).not.toHaveProperty("startedAt");
  });
});
