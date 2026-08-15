import EvaluacionAdminLayout from "@/layout/EvaluacionAdminLayout";
import DocentesListMain from "@/components/dashboard/evaluacion-docente-admin/docentes/DocentesListMain";
import React from "react";

const DocentesPage = () => {
  return (
    <EvaluacionAdminLayout title="Docentes" description="Lista oficial del personal docente">
      <DocentesListMain />
    </EvaluacionAdminLayout>
  );
};

export default DocentesPage;
