import EvaluacionAdminLayout from "@/layout/EvaluacionAdminLayout";
import ReportesMain from "@/components/dashboard/evaluacion-docente-admin/reportes/ReportesMain";
import React from "react";

const ReportesPage = () => {
  return (
    <EvaluacionAdminLayout title="Reportes" description="Resultados de la evaluación docente">
      <ReportesMain />
    </EvaluacionAdminLayout>
  );
};

export default ReportesPage;
