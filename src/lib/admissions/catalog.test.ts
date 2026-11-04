import { describe, expect, it } from "vitest";
import { buildAdmissionsCatalog } from "./catalog";

describe("buildAdmissionsCatalog", () => {
  it("keeps open years, active grades in order, and their active modalities", () => {
    const catalog = buildAdmissionsCatalog({
      years: [
        { id: "y2", year: 2028, name: "Año 2028" },
        { id: "y1", year: 2027, name: "Año 2027" },
      ],
      grades: [
        { id: "g2", name: "Primer grado", level: "Educación Básica", sort_order: 1 },
        { id: "g0", name: "Pre-Básica", level: "Pre-Básica", sort_order: 0 },
      ],
      modalities: [
        { id: "m1", name: "Bilingüe" },
        { id: "m2", name: "Español" },
      ],
      gradeModalities: [
        { grade_id: "g2", modality_id: "m2" },
        { grade_id: "g2", modality_id: "m1" },
        { grade_id: "g2", modality_id: "missing" },
        { grade_id: "unknown", modality_id: "m1" },
      ],
    });

    expect(catalog.academicYears).toEqual([
      { id: "y1", year: 2027, name: "Año 2027" },
      { id: "y2", year: 2028, name: "Año 2028" },
    ]);
    expect(catalog.grades).toEqual([
      { id: "g0", name: "Pre-Básica", level: "Pre-Básica", modalities: [] },
      {
        id: "g2",
        name: "Primer grado",
        level: "Educación Básica",
        modalities: [
          { id: "m1", name: "Bilingüe" },
          { id: "m2", name: "Español" },
        ],
      },
    ]);
  });
});
