import React from "react";
import AdmisionesAdminLayout from "@/layout/AdmisionesAdminLayout";
import AdmissionsDashboardMain from "@/components/admissions-admin/AdmissionsDashboardMain";

const AdmisionesAdminDashboardPage = () => {
  return (
    <AdmisionesAdminLayout title="Resumen" description="Estado de las solicitudes de admisión">
      <AdmissionsDashboardMain />
    </AdmisionesAdminLayout>
  );
};

export default AdmisionesAdminDashboardPage;
