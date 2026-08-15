"use client";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ReportsData } from "@/interFace/evaluacion-docente-interface";
import TeacherScoreBarChart from "./TeacherScoreBarChart";
import ExportExcelButton from "./ExportExcelButton";
import ExportPdfButton from "./ExportPdfButton";

const ReportesMain = () => {
  const [data, setData] = useState<ReportsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/evaluacion-docente-admin/reportes");
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);
        setData(result);
      } catch {
        toast.error("No se pudieron cargar los reportes.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="col-xl-9 col-lg-9 col-md-8">
      <div className="bd-dashboard-inner">
        <div className="bd-dashboard-title-inner">
          <div className="d-flex justify-content-between flex-wrap align-items-center gap-10">
            <h4 className="bd-dashboard-title">Reportes</h4>
            {data && (
              <div className="d-flex gap-10">
                <ExportExcelButton data={data} />
                <ExportPdfButton data={data} />
              </div>
            )}
          </div>
        </div>

        {isLoading && <p className="mt-30">Cargando reportes...</p>}

        {!isLoading && data && data.byTeacher.length === 0 && (
          <p className="mt-30">Todavía no hay evaluaciones registradas.</p>
        )}

        {!isLoading && data && data.byTeacher.length > 0 && (
          <>
            <div className="mt-30">
              <TeacherScoreBarChart
                title="Promedio por docente"
                categories={data.byTeacher.map((t) => t.full_name)}
                data={data.byTeacher.map((t) => Number(t.average_score.toFixed(2)))}
              />
            </div>

            <div className="bd-dashboard-table table-responsive mt-30">
              <h6 className="bd-dashboard-menu-title mt-0">Por docente</h6>
              <table className="table table-bordered table-head-bg">
                <thead>
                  <tr>
                    <th>Docente</th>
                    <th>Promedio</th>
                    <th>Respuestas</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byTeacher.map((row) => (
                    <tr key={row.teacher_id}>
                      <td><p>{row.full_name}</p></td>
                      <td><p>{row.average_score.toFixed(2)}</p></td>
                      <td><p>{row.response_count}</p></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bd-dashboard-table table-responsive mt-30">
              <h6 className="bd-dashboard-menu-title">Por pregunta</h6>
              <table className="table table-bordered table-head-bg">
                <thead>
                  <tr>
                    <th>Pregunta</th>
                    <th>Promedio</th>
                    <th>Respuestas</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byQuestion.map((row) => (
                    <tr key={row.question_id}>
                      <td><p>{row.text}</p></td>
                      <td><p>{row.average_score.toFixed(2)}</p></td>
                      <td><p>{row.response_count}</p></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bd-dashboard-table table-responsive mt-30">
              <h6 className="bd-dashboard-menu-title">Por sección</h6>
              <table className="table table-bordered table-head-bg">
                <thead>
                  <tr>
                    <th>Sección</th>
                    <th>Evaluaciones iniciadas</th>
                    <th>Evaluaciones completadas</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bySection.map((row) => (
                    <tr key={row.section_id}>
                      <td><p>{row.label}</p></td>
                      <td><p>{row.run_count}</p></td>
                      <td><p>{row.completed_run_count}</p></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.commentsByTeacher.length > 0 && (
              <div className="bd-dashboard-table table-responsive mt-30">
                <h6 className="bd-dashboard-menu-title">Opiniones de los estudiantes</h6>
                <table className="table table-bordered table-head-bg">
                  <thead>
                    <tr>
                      <th>Docente</th>
                      <th>Comentarios (anónimos)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.commentsByTeacher.map((row) => (
                      <tr key={row.teacher_id}>
                        <td style={{ whiteSpace: "nowrap" }}><p>{row.full_name}</p></td>
                        <td>
                          <ul className="mb-0 ps-3">
                            {row.comments.map((comment, index) => (
                              <li key={index}>{comment}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReportesMain;
