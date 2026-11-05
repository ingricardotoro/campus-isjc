import React, { ReactNode } from "react";
import AdmisionesAdminSidebarMenu from "./sidebar/AdmisionesAdminSidebarMenu";

interface AdmisionesAdminLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
}

const MAIN_CONTENT_ID = "admisiones-admin-contenido";

const AdmisionesAdminLayout = ({ title, description, children }: AdmisionesAdminLayoutProps) => {
  return (
    <>
      <a href={`#${MAIN_CONTENT_ID}`} className="visually-hidden-focusable">
        Saltar al contenido
      </a>
      <div className="bd-dashboard-breadcrumb section-space-small-top">
        <div className="container custom-container">
          <div className="row">
            <div className="col-xl-12">
              <div className="bd-dashboard-breadcrumb-wrapper p-relative">
                <div className="bd-dashboard-profile">
                  <div className="content">
                    <h1 className="name h3 mb-0">{title}</h1>
                    {description && <span className="designation d-block">{description}</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bd-dashboard-area section-space-bottom">
        <div className="container">
          <div className="bd-dashboard-main">
            <div className="row gy-30">
              <AdmisionesAdminSidebarMenu />
              <main id={MAIN_CONTENT_ID} tabIndex={-1} className="col-xl-9 col-lg-9 col-md-8">
                {children}
              </main>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdmisionesAdminLayout;
