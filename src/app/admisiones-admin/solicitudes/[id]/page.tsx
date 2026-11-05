import React, { Suspense } from "react";
import AdmisionesAdminLayout from "@/layout/AdmisionesAdminLayout";
import { LoadingState } from "@/components/admissions-admin/AdminStates";
import ProspectRecordMain from "@/components/admissions-admin/ProspectRecordMain";

const AdmisionesAdminProspectPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return (
    <AdmisionesAdminLayout title="Solicitud" description="Ficha de la solicitud de admisión">
      {/* The record reads the list filters from the URL, which is only known in the browser. */}
      <Suspense fallback={<LoadingState label="Cargando la solicitud..." />}>
        <ProspectRecordMain id={id} />
      </Suspense>
    </AdmisionesAdminLayout>
  );
};

export default AdmisionesAdminProspectPage;
