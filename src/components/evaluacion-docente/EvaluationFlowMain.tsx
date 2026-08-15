"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import type { EvaluationRunStart } from "@/interFace/evaluacion-docente-interface";
import InstructionsCard from "./InstructionsCard";
import QuestionCard from "./QuestionCard";
import TeacherOpinionCard from "./TeacherOpinionCard";
import ProgressIndicator from "./ProgressIndicator";

type Phase = "instructions" | "question" | "opinion";

const EvaluationFlowMain = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionId = searchParams.get("sectionId");

  const [runStart, setRunStart] = useState<EvaluationRunStart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("instructions");
  const [teacherIndex, setTeacherIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!sectionId) {
      router.replace("/evaluacion-docente/secciones");
      return;
    }

    let cancelled = false;

    const startRun = async () => {
      try {
        const res = await fetch("/api/evaluacion-docente/runs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sectionId }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "No se pudo iniciar la evaluación.");
        if (!cancelled) setRunStart(result);
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
          router.replace("/evaluacion-docente/secciones");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    startRun();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId]);

  const finishRun = useCallback(async () => {
    localStorage.removeItem("evalGateOpen");
    await fetch("/api/evaluacion-docente/acceso/salir", { method: "POST" });
    toast.success("¡Gracias por completar la evaluación!");
    router.push("/evaluacion-docente");
  }, [router]);

  const advanceAfterTeacher = useCallback(async () => {
    if (!runStart) return;
    const isLastTeacher = teacherIndex === runStart.teachers.length - 1;

    if (isLastTeacher) {
      await finishRun();
      return;
    }

    setTeacherIndex((i) => i + 1);
    setQuestionIndex(0);
    setPhase("question");
  }, [runStart, teacherIndex, finishRun]);

  const handleAnswer = async (score: 1 | 2 | 3 | 4) => {
    if (!runStart || isSubmitting) return;
    setIsSubmitting(true);

    const teacher = runStart.teachers[teacherIndex];
    const question = runStart.questions[questionIndex];
    const totalExpected = runStart.teachers.length * runStart.questions.length;

    try {
      const res = await fetch(`/api/evaluacion-docente/runs/${runStart.runId}/respuestas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: teacher.id,
          questionId: question.id,
          score,
          totalExpected,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "No se pudo guardar la respuesta.");

      const isLastQuestion = questionIndex === runStart.questions.length - 1;

      if (isLastQuestion) {
        setPhase("opinion");
      } else {
        setQuestionIndex((i) => i + 1);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpinionSubmit = async (comment: string) => {
    if (!runStart || isSubmitting) return;
    setIsSubmitting(true);

    const teacher = runStart.teachers[teacherIndex];

    try {
      const res = await fetch(`/api/evaluacion-docente/runs/${runStart.runId}/comentarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: teacher.id, comment }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "No se pudo guardar tu opinión.");

      await advanceAfterTeacher();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !runStart) {
    return (
      <section className="eval-section">
        <div className="container text-center">
          <p>Cargando evaluación...</p>
        </div>
      </section>
    );
  }

  const teacher = runStart.teachers[teacherIndex];
  const question = runStart.questions[questionIndex];

  return (
    <section className="eval-section">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-7 col-lg-9 col-12">
            {phase !== "instructions" && (
              <ProgressIndicator
                teacherIndex={teacherIndex}
                teacherCount={runStart.teachers.length}
                questionIndex={questionIndex}
                questionCount={runStart.questions.length}
              />
            )}

            <AnimatePresence mode="wait">
              {phase === "instructions" ? (
                <motion.div
                  key="instructions"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <InstructionsCard
                    teacherCount={runStart.teachers.length}
                    onStart={() => setPhase("question")}
                  />
                </motion.div>
              ) : phase === "opinion" ? (
                <motion.div
                  key={`opinion-${teacher.id}`}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <TeacherOpinionCard
                    teacher={teacher}
                    onSubmit={handleOpinionSubmit}
                    disabled={isSubmitting}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key={`${teacher.id}-${question.id}`}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <QuestionCard
                    teacher={teacher}
                    questionText={question.text}
                    onAnswer={handleAnswer}
                    disabled={isSubmitting}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EvaluationFlowMain;
