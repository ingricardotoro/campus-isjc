// Shared catalog shapes passed from the server page to the client form.

export type CatalogAcademicYear = {
  id: string;
  year: number;
  name: string;
};

export type CatalogModality = {
  id: string;
  name: string;
};

export type CatalogGrade = {
  id: string;
  name: string;
  level: string;
  modalities: CatalogModality[];
};

export type AdmissionsCatalog = {
  academicYears: CatalogAcademicYear[];
  grades: CatalogGrade[];
};
