"use client";
import React, { useState } from "react";
import type { ReportsData } from "@/interFace/evaluacion-docente-interface";

interface ExportExcelButtonProps {
  data: ReportsData;
}

const ExportExcelButton = ({ data }: ExportExcelButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();

      const teacherSheet = workbook.addWorksheet("Por docente");
      teacherSheet.columns = [
        { header: "Docente", key: "full_name", width: 32 },
        { header: "Promedio (1-4)", key: "average_score", width: 16 },
        { header: "Respuestas", key: "response_count", width: 14 },
      ];
      data.byTeacher.forEach((row) =>
        teacherSheet.addRow({
          full_name: row.full_name,
          average_score: Number(row.average_score.toFixed(2)),
          response_count: row.response_count,
        })
      );

      const questionSheet = workbook.addWorksheet("Por pregunta");
      questionSheet.columns = [
        { header: "Pregunta", key: "text", width: 60 },
        { header: "Promedio (1-4)", key: "average_score", width: 16 },
        { header: "Respuestas", key: "response_count", width: 14 },
      ];
      data.byQuestion.forEach((row) =>
        questionSheet.addRow({
          text: row.text,
          average_score: Number(row.average_score.toFixed(2)),
          response_count: row.response_count,
        })
      );

      const sectionSheet = workbook.addWorksheet("Por sección");
      sectionSheet.columns = [
        { header: "Sección", key: "label", width: 14 },
        { header: "Evaluaciones iniciadas", key: "run_count", width: 20 },
        { header: "Evaluaciones completadas", key: "completed_run_count", width: 22 },
      ];
      data.bySection.forEach((row) =>
        sectionSheet.addRow({
          label: row.label,
          run_count: row.run_count,
          completed_run_count: row.completed_run_count,
        })
      );

      if (data.commentsByTeacher.length > 0) {
        const commentsSheet = workbook.addWorksheet("Comentarios");
        commentsSheet.columns = [
          { header: "Docente", key: "full_name", width: 32 },
          { header: "Comentario (anónimo)", key: "comment", width: 70 },
        ];
        data.commentsByTeacher.forEach((row) =>
          row.comments.forEach((comment) =>
            commentsSheet.addRow({ full_name: row.full_name, comment })
          )
        );
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "reporte-evaluacion-docente.xlsx";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button type="button" className="bd-btn btn-outline-primary" onClick={handleExport} disabled={isExporting}>
      {isExporting ? "Exportando..." : "Exportar Excel"}
    </button>
  );
};

export default ExportExcelButton;
