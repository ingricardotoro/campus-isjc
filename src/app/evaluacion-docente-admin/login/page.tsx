import React from "react";
import AdminLoginForm from "@/form/evaluacion-docente-admin/admin-login-form";

const EvaluacionAdminLoginPage = () => {
  return (
    <section className="bd-authentication-cover-main">
      <div className="row h100vh mx-0 justify-content-center align-items-center">
        <div className="col-xxl-4 col-xl-5 col-lg-6 col-md-8 col-sm-10 col-12">
          <div className="bd-authentication-form-wrapper">
            <h3 className="title mb-10">Evaluación Docente — Administración</h3>
            <p className="subtitle mb-20">Ingresa con tu cuenta de administrador.</p>
            <AdminLoginForm />
          </div>
        </div>
      </div>
    </section>
  );
};

export default EvaluacionAdminLoginPage;
