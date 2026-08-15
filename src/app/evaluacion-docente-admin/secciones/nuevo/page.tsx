import EvaluacionAdminLayout from "@/layout/EvaluacionAdminLayout";
import SeccionForm from "@/form/evaluacion-docente-admin/seccion-form";
import React from "react";

const NuevaSeccionPage = () => {
  return (
    <EvaluacionAdminLayout title="Nueva sección">
      <div className="col-xl-9 col-lg-9 col-md-8">
        <div className="bd-dashboard-inner">
          <div className="bd-profile-update-area">
            <SeccionForm />
          </div>
        </div>
      </div>
    </EvaluacionAdminLayout>
  );
};

export default NuevaSeccionPage;
