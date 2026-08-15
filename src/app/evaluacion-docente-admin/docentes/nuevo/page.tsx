import EvaluacionAdminLayout from "@/layout/EvaluacionAdminLayout";
import DocenteForm from "@/form/evaluacion-docente-admin/docente-form";
import React from "react";

const NuevoDocentePage = () => {
  return (
    <EvaluacionAdminLayout title="Nuevo docente">
      <div className="col-xl-9 col-lg-9 col-md-8">
        <div className="bd-dashboard-inner">
          <div className="bd-profile-update-area">
            <DocenteForm />
          </div>
        </div>
      </div>
    </EvaluacionAdminLayout>
  );
};

export default NuevoDocentePage;
