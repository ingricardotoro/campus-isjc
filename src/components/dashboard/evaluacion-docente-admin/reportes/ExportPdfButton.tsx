"use client";
import React, { useState } from "react";
import type { ReportsData } from "@/interFace/evaluacion-docente-interface";

interface ExportPdfButtonProps {
  data: ReportsData;
}

const ExportPdfButton = ({ data }: ExportPdfButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();

      doc.setFontSize(14);
      doc.text("Reporte de Evaluación Docente", 14, 16);

      doc.setFontSize(11);
      doc.text("Promedio por docente", 14, 26);
      autoTable(doc, {
        startY: 30,
        head: [["Docente", "Promedio (1-4)", "Respuestas"]],
        body: data.byTeacher.map((row) => [
          row.full_name,
          row.average_score.toFixed(2),
          String(row.response_count),
        ]),
      });

      const afterTeacherY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
      doc.text("Promedio por pregunta", 14, afterTeacherY);
      autoTable(doc, {
        startY: afterTeacherY + 4,
        head: [["Pregunta", "Promedio (1-4)", "Respuestas"]],
        body: data.byQuestion.map((row) => [
          row.text,
          row.average_score.toFixed(2),
          String(row.response_count),
        ]),
      });

      const afterQuestionY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
      doc.text("Evaluaciones por sección", 14, afterQuestionY);
      autoTable(doc, {
        startY: afterQuestionY + 4,
        head: [["Sección", "Iniciadas", "Completadas"]],
        body: data.bySection.map((row) => [
          row.label,
          String(row.run_count),
          String(row.completed_run_count),
        ]),
      });

      if (data.commentsByTeacher.length > 0) {
        const afterSectionY =
          (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
        let commentsStartY = afterSectionY;
        if (afterSectionY > 260) {
          doc.addPage();
          commentsStartY = 20;
        }
        doc.text("Opiniones de los estudiantes (anónimas)", 14, commentsStartY);
        autoTable(doc, {
          startY: commentsStartY + 4,
          head: [["Docente", "Comentario"]],
          body: data.commentsByTeacher.flatMap((row) =>
            row.comments.map((comment) => [row.full_name, comment])
          ),
          columnStyles: { 1: { cellWidth: 130 } },
        });
      }

      doc.save("reporte-evaluacion-docente.pdf");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button type="button" className="bd-btn btn-outline-secondary" onClick={handleExport} disabled={isExporting}>
      {isExporting ? "Exportando..." : "Exportar PDF"}
    </button>
  );
};

export default ExportPdfButton;
