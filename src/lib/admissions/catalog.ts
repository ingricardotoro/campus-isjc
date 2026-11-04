import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdmissionsCatalog, CatalogAcademicYear, CatalogModality } from "./catalog-types";
import type { AdmissionsInterest } from "./schema";

type GradeRow = { id: string; name: string; level: string; sort_order: number };
type GradeModalityRow = { grade_id: string; modality_id: string };

export type CatalogRows = {
  years: CatalogAcademicYear[];
  grades: GradeRow[];
  modalities: CatalogModality[];
  gradeModalities: GradeModalityRow[];
};

/**
 * Builds the public catalog from rows already filtered to active (and, for
 * years, open for intake). Pairs that point to a missing grade or modality are
 * dropped, so an inactive modality never reaches the form.
 */
export function buildAdmissionsCatalog(rows: CatalogRows): AdmissionsCatalog {
  const modalitiesById = new Map(rows.modalities.map((m) => [m.id, m]));
  const modalitiesByGrade = new Map<string, CatalogModality[]>();

  for (const pair of rows.gradeModalities) {
    const modality = modalitiesById.get(pair.modality_id);
    if (!modality) continue;
    const list = modalitiesByGrade.get(pair.grade_id) ?? [];
    list.push({ id: modality.id, name: modality.name });
    modalitiesByGrade.set(pair.grade_id, list);
  }

  const academicYears = [...rows.years]
    .sort((a, b) => a.year - b.year)
    .map(({ id, year, name }) => ({ id, year, name }));

  const grades = [...rows.grades]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((grade) => ({
      id: grade.id,
      name: grade.name,
      level: grade.level,
      modalities: (modalitiesByGrade.get(grade.id) ?? []).sort((a, b) =>
        a.name.localeCompare(b.name, "es")
      ),
    }));

  return { academicYears, grades };
}

/** Loads the public catalog with the service-role client (anon cannot read it). */
export async function loadAdmissionsCatalog(): Promise<AdmissionsCatalog> {
  const admin = createAdminClient();

  const [years, grades, modalities, gradeModalities] = await Promise.all([
    admin
      .from("admissions_academic_years")
      .select("id, year, name")
      .eq("is_active", true)
      .eq("is_open_for_intake", true),
    admin.from("admissions_grades").select("id, name, level, sort_order").eq("is_active", true),
    admin.from("admissions_modalities").select("id, name").eq("is_active", true),
    admin.from("admissions_grade_modalities").select("grade_id, modality_id").eq("is_active", true),
  ]);

  const failed = [years, grades, modalities, gradeModalities].find((result) => result.error);
  if (failed?.error) {
    throw new Error(`Admissions catalog could not be loaded: ${failed.error.code ?? "unknown"}`);
  }

  return buildAdmissionsCatalog({
    years: years.data ?? [],
    grades: grades.data ?? [],
    modalities: modalities.data ?? [],
    gradeModalities: gradeModalities.data ?? [],
  });
}

export type InterestLabels = {
  academicYear: string | null;
  grade: string | null;
  modality: string | null;
};

async function nameById(admin: SupabaseClient, table: string, id: string | null) {
  if (!id) return null;
  try {
    const { data, error } = await admin.from(table).select("name").eq("id", id).maybeSingle();
    if (error || !data) return null;
    return typeof data.name === "string" ? data.name : null;
  } catch {
    return null;
  }
}

/** Best-effort catalog names for the team notification. Never throws. */
export async function loadInterestLabels(
  admin: SupabaseClient,
  input: AdmissionsInterest
): Promise<InterestLabels> {
  const [academicYear, grade, modality] = await Promise.all([
    nameById(admin, "admissions_academic_years", input.academicYearId),
    nameById(admin, "admissions_grades", input.gradeId),
    nameById(admin, "admissions_modalities", input.modalityId),
  ]);
  return { academicYear, grade, modality };
}
