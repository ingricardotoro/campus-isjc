import React, { Suspense } from "react";
import AdmisionesAdminLayout from "@/layout/AdmisionesAdminLayout";
import { LoadingState } from "@/components/admissions-admin/AdminStates";
import ProspectListMain from "@/components/admissions-admin/ProspectListMain";

const AdmisionesAdminProspectsPage = () => {
  return (
    <AdmisionesAdminLayout title="Solicitudes" description="Buscar y filtrar solicitudes de admisión">
      {/* The list reads its filters from the URL, which is only known in the browser. */}
      <Suspense fallback={<LoadingState label="Cargando solicitudes..." />}>
        <ProspectListMain />
      </Suspense>
    </AdmisionesAdminLayout>
  );
};

export default AdmisionesAdminProspectsPage;
