import EvaluacionAdminLayout from "@/layout/EvaluacionAdminLayout";
import AsignacionesMatrixMain from "@/components/dashboard/evaluacion-docente-admin/asignaciones/AsignacionesMatrixMain";
import React from "react";

const AsignacionesPage = () => {
  return (
    <EvaluacionAdminLayout title="Asignaciones" description="Qué docentes dictan clases en cada sección">
      <AsignacionesMatrixMain />
    </EvaluacionAdminLayout>
  );
};

export default AsignacionesPage;
