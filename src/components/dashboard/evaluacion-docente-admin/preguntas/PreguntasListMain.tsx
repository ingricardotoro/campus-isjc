"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { Question } from "@/interFace/evaluacion-docente-interface";

const PreguntasListMain = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/evaluacion-docente-admin/preguntas");
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setQuestions(result.questions);
    } catch {
      toast.error("No se pudieron cargar las preguntas.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta pregunta? Esta acción no se puede deshacer.")) return;
    try {
      const res = await fetch(`/api/evaluacion-docente-admin/preguntas/${id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success("Pregunta eliminada.");
      loadQuestions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar.");
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const current = questions[index];
    const target = questions[targetIndex];

    try {
      await Promise.all([
        fetch(`/api/evaluacion-docente-admin/preguntas/${current.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_index: target.order_index }),
        }),
        fetch(`/api/evaluacion-docente-admin/preguntas/${target.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_index: current.order_index }),
        }),
      ]);
      loadQuestions();
    } catch {
      toast.error("No se pudo reordenar la pregunta.");
    }
  };

  return (
    <div className="col-xl-9 col-lg-9 col-md-8">
      <div className="bd-dashboard-inner">
        <div className="bd-dashboard-title-inner">
          <div className="d-flex justify-content-between flex-wrap align-items-center">
            <h4 className="bd-dashboard-title">Preguntas</h4>
            <Link href="/evaluacion-docente-admin/preguntas/nuevo" className="bd-btn btn-primary">
              Nueva pregunta
            </Link>
          </div>
        </div>

        <div className="bd-dashboard-table table-responsive mt-30">
          <table className="table table-bordered table-head-bg">
            <thead>
              <tr>
                <th>Orden</th>
                <th>Pregunta</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={4}>Cargando...</td>
                </tr>
              )}
              {!isLoading && questions.length === 0 && (
                <tr>
                  <td colSpan={4}>No hay preguntas registradas todavía.</td>
                </tr>
              )}
              {questions.map((question, index) => (
                <tr key={question.id}>
                  <td style={{ width: 90 }}>
                    <div className="d-flex gap-5">
                      <button
                        type="button"
                        className="border-0 bg-transparent p-0"
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                        aria-label="Mover arriba"
                      >
                        <i className="fa-light fa-arrow-up"></i>
                      </button>
                      <button
                        type="button"
                        className="border-0 bg-transparent p-0"
                        disabled={index === questions.length - 1}
                        onClick={() => move(index, 1)}
                        aria-label="Mover abajo"
                      >
                        <i className="fa-light fa-arrow-down"></i>
                      </button>
                    </div>
                  </td>
                  <td><p>{question.text}</p></td>
                  <td>
                    <div className={`bd-badge badge-${question.is_active ? "success" : "warning"}`}>
                      {question.is_active ? "Activa" : "Inactiva"}
                    </div>
                  </td>
                  <td>
                    <div className="bd-button-action">
                      <Link
                        className="bd-default-tooltip edit"
                        href={`/evaluacion-docente-admin/preguntas/${question.id}/editar`}
                      >
                        <span><i className="fa-light fa-pen-to-square"></i></span>
                      </Link>
                      <button
                        type="button"
                        className="bd-default-tooltip delete border-0 bg-transparent p-0"
                        onClick={() => handleDelete(question.id)}
                      >
                        <span><i className="fa-light fa-trash-can"></i></span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PreguntasListMain;
