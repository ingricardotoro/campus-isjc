import EvaluationFlowMain from "@/components/evaluacion-docente/EvaluationFlowMain";
import React, { Suspense } from "react";

const EvaluacionDocenteEvaluarPage = () => {
  return (
    <Suspense fallback={<p className="text-center">Cargando evaluación...</p>}>
      <EvaluationFlowMain />
    </Suspense>
  );
};

export default EvaluacionDocenteEvaluarPage;
