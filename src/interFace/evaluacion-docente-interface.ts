export interface Teacher {
  id: string;
  full_name: string;
  photo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Section {
  id: string;
  grade: string;
  section_letter: string;
  label: string;
  is_active: boolean;
  created_at: string;
}

export interface Assignment {
  id: string;
  teacher_id: string;
  section_id: string;
  created_at: string;
}

export interface Question {
  id: string;
  text: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export interface EvaluationRun {
  id: string;
  section_id: string;
  started_at: string;
  completed_at: string | null;
}

export interface EvaluationAnswer {
  id: string;
  run_id: string;
  teacher_id: string;
  question_id: string;
  score: 1 | 2 | 3 | 4;
  created_at: string;
}

export interface EvaluationComment {
  id: string;
  run_id: string;
  teacher_id: string;
  comment: string;
  created_at: string;
}

/** Score labels shown as buttons in the public evaluation flow, in display order. */
export const SCORE_OPTIONS: { value: 1 | 2 | 3 | 4; label: string }[] = [
  { value: 1, label: "Mejorar" },
  { value: 2, label: "Bueno" },
  { value: 3, label: "Muy Bueno" },
  { value: 4, label: "Excelente" },
];

/** Payload returned by POST /api/evaluacion-docente/runs when a student picks a section. */
export interface EvaluationRunStart {
  runId: string;
  section: Section;
  teachers: Teacher[];
  questions: Question[];
}

/** Row shapes consumed by the admin reports page + Excel/PDF export. */
export interface TeacherReportRow {
  teacher_id: string;
  full_name: string;
  photo_url: string | null;
  average_score: number;
  response_count: number;
}

export interface QuestionReportRow {
  question_id: string;
  text: string;
  order_index: number;
  average_score: number;
  response_count: number;
}

export interface SectionReportRow {
  section_id: string;
  label: string;
  run_count: number;
  completed_run_count: number;
}

export interface TeacherCommentsRow {
  teacher_id: string;
  full_name: string;
  comments: string[];
}

export interface ReportsData {
  byTeacher: TeacherReportRow[];
  byQuestion: QuestionReportRow[];
  bySection: SectionReportRow[];
  commentsByTeacher: TeacherCommentsRow[];
}
