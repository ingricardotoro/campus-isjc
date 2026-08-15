import EvaluacionAdminLayout from "@/layout/EvaluacionAdminLayout";
import PreguntaForm from "@/form/evaluacion-docente-admin/pregunta-form";
import React from "react";

const NuevaPreguntaPage = () => {
  return (
    <EvaluacionAdminLayout title="Nueva pregunta">
      <div className="col-xl-9 col-lg-9 col-md-8">
        <div className="bd-dashboard-inner">
          <div className="bd-profile-update-area">
            <PreguntaForm />
          </div>
        </div>
      </div>
    </EvaluacionAdminLayout>
  );
};

export default NuevaPreguntaPage;
