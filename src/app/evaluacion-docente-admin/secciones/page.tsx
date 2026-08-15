import EvaluacionAdminLayout from "@/layout/EvaluacionAdminLayout";
import SeccionesListMain from "@/components/dashboard/evaluacion-docente-admin/secciones/SeccionesListMain";
import React from "react";

const SeccionesPage = () => {
  return (
    <EvaluacionAdminLayout title="Secciones" description="Cursos y secciones de la institución">
      <SeccionesListMain />
    </EvaluacionAdminLayout>
  );
};

export default SeccionesPage;
