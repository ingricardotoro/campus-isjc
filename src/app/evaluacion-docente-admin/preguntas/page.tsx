import EvaluacionAdminLayout from "@/layout/EvaluacionAdminLayout";
import PreguntasListMain from "@/components/dashboard/evaluacion-docente-admin/preguntas/PreguntasListMain";
import React from "react";

const PreguntasPage = () => {
  return (
    <EvaluacionAdminLayout title="Preguntas" description="Banco de preguntas de la evaluación">
      <PreguntasListMain />
    </EvaluacionAdminLayout>
  );
};

export default PreguntasPage;
