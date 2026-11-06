import React from "react";
import AdmissionsAdminLoginForm from "@/components/admissions-admin/AdmissionsAdminLoginForm";

const AdmisionesAdminLoginPage = () => {
  return (
    <main className="bd-authentication-cover-main">
      <div className="row h100vh mx-0 justify-content-center align-items-center">
        <div className="col-xxl-4 col-xl-5 col-lg-6 col-md-8 col-sm-10 col-12">
          <div className="bd-authentication-form-wrapper">
            <h1 className="title h3 mb-10">Admisiones — Administración</h1>
            <p className="subtitle mb-20">Ingrese con su cuenta del equipo de admisiones.</p>
            <AdmissionsAdminLoginForm />
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdmisionesAdminLoginPage;
