import { describe, expect, it } from "vitest";
import { buildNotificationEmail, escapeHtml, parseRecipients } from "./notification";
import { admissionsInterestSchema } from "./schema";

const YEAR_ID = "11111111-1111-4111-8111-111111111111";
const GRADE_ID = "22222222-2222-4222-8222-222222222222";
const MODALITY_ID = "33333333-3333-4333-8333-333333333333";

function input(overrides: Record<string, unknown> = {}) {
  return admissionsInterestSchema.parse({
    guardianName: "María López",
    phone: "9999-8888",
    email: "maria@example.com",
    preferredContactMethod: "whatsapp",
    studentName: "Ana",
    academicYearId: YEAR_ID,
    gradeId: GRADE_ID,
    modalityId: MODALITY_ID,
    wantsVisit: true,
    consentToContact: true,
    ...overrides,
  });
}

const LABELS = { academicYear: "Año académico 2027", grade: "Primer grado", modality: "Bilingüe" };

describe("escapeHtml", () => {
  it("escapes HTML special characters", () => {
    expect(escapeHtml(`<a href="x" onclick='y'>&</a>`)).toBe(
      "&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;"
    );
  });
});

describe("parseRecipients", () => {
  it("splits, trims, and drops empty entries", () => {
    expect(parseRecipients(" a@x.com, ,b@y.com ")).toEqual(["a@x.com", "b@y.com"]);
  });

  it("returns an empty list when unset", () => {
    expect(parseRecipients(undefined)).toEqual([]);
    expect(parseRecipients("  ")).toEqual([]);
  });
});

describe("buildNotificationEmail", () => {
  it("escapes user input in the HTML body", () => {
    const email = buildNotificationEmail(
      input({ guardianName: "<script>alert(1)</script>", studentName: "<img src=x>" }),
      LABELS
    );

    expect(email.html).not.toContain("<script>");
    expect(email.html).not.toContain("<img src=x>");
    expect(email.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(email.html).toContain("&lt;img src=x&gt;");
  });

  it("includes the interest details and labels", () => {
    const email = buildNotificationEmail(input(), LABELS);

    expect(email.subject).toContain("María López");
    expect(email.html).toContain("Primer grado");
    expect(email.html).toContain("Bilingüe");
    expect(email.html).toContain("9999-8888");
    expect(email.html).toContain("WhatsApp");
    expect(email.text).toContain("María López");
  });

  it("falls back when labels are unavailable", () => {
    const email = buildNotificationEmail(input(), {
      academicYear: null,
      grade: null,
      modality: null,
    });

    expect(email.html).toContain("No disponible");
  });

  it("strips line breaks from the subject", () => {
    const email = buildNotificationEmail(input({ guardianName: "Ana\r\nBcc: x@y.com" }), LABELS);

    expect(email.subject).not.toMatch(/[\r\n]/);
  });
});
