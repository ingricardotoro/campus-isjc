import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  QuestionReportRow,
  SectionReportRow,
  TeacherCommentsRow,
  TeacherReportRow,
} from "@/interFace/evaluacion-docente-interface";

export async function GET() {
  const supabase = createAdminClient();

  const [teachersRes, questionsRes, sectionsRes, runsRes, answersRes, commentsRes] = await Promise.all([
    supabase.from("teachers").select("id, full_name, photo_url"),
    supabase.from("questions").select("id, text, order_index").order("order_index"),
    supabase.from("sections").select("id, label"),
    supabase.from("evaluation_runs").select("id, section_id, completed_at"),
    supabase.from("evaluation_answers").select("teacher_id, question_id, score"),
    supabase.from("evaluation_comments").select("teacher_id, comment").order("created_at"),
  ]);

  const firstError =
    teachersRes.error ||
    questionsRes.error ||
    sectionsRes.error ||
    runsRes.error ||
    answersRes.error ||
    commentsRes.error;
  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  const teachers = teachersRes.data ?? [];
  const questions = questionsRes.data ?? [];
  const sections = sectionsRes.data ?? [];
  const runs = runsRes.data ?? [];
  const answers = answersRes.data ?? [];
  const comments = commentsRes.data ?? [];

  const teacherAgg = new Map<string, { sum: number; count: number }>();
  const questionAgg = new Map<string, { sum: number; count: number }>();

  for (const answer of answers) {
    const t = teacherAgg.get(answer.teacher_id) ?? { sum: 0, count: 0 };
    t.sum += answer.score;
    t.count += 1;
    teacherAgg.set(answer.teacher_id, t);

    const q = questionAgg.get(answer.question_id) ?? { sum: 0, count: 0 };
    q.sum += answer.score;
    q.count += 1;
    questionAgg.set(answer.question_id, q);
  }

  const byTeacher: TeacherReportRow[] = teachers
    .map((teacher) => {
      const agg = teacherAgg.get(teacher.id);
      return {
        teacher_id: teacher.id,
        full_name: teacher.full_name,
        photo_url: teacher.photo_url,
        average_score: agg ? agg.sum / agg.count : 0,
        response_count: agg?.count ?? 0,
      };
    })
    .filter((row) => row.response_count > 0)
    .sort((a, b) => b.average_score - a.average_score);

  const byQuestion: QuestionReportRow[] = questions.map((question) => {
    const agg = questionAgg.get(question.id);
    return {
      question_id: question.id,
      text: question.text,
      order_index: question.order_index,
      average_score: agg ? agg.sum / agg.count : 0,
      response_count: agg?.count ?? 0,
    };
  });

  const bySection: SectionReportRow[] = sections.map((section) => {
    const sectionRuns = runs.filter((run) => run.section_id === section.id);
    return {
      section_id: section.id,
      label: section.label,
      run_count: sectionRuns.length,
      completed_run_count: sectionRuns.filter((run) => run.completed_at).length,
    };
  });

  const commentsByTeacherMap = new Map<string, string[]>();
  for (const comment of comments) {
    const list = commentsByTeacherMap.get(comment.teacher_id) ?? [];
    list.push(comment.comment);
    commentsByTeacherMap.set(comment.teacher_id, list);
  }

  const commentsByTeacher: TeacherCommentsRow[] = teachers
    .map((teacher) => ({
      teacher_id: teacher.id,
      full_name: teacher.full_name,
      comments: commentsByTeacherMap.get(teacher.id) ?? [],
    }))
    .filter((row) => row.comments.length > 0);

  return NextResponse.json({ byTeacher, byQuestion, bySection, commentsByTeacher });
}
