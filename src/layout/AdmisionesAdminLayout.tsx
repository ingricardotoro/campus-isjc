import React, { ReactNode } from "react";
import styles from "@/components/admissions-admin/AdmissionsAdmin.module.scss";
import { UnsavedChangesProvider } from "@/components/admissions-admin/UnsavedChangesGuard";
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
              {/* In normal flow, unlike the theme's absolutely placed profile, which needs a
                  360px cover image behind it. The dashboard card overlaps the band's bottom. */}
              <div className={`bd-dashboard-breadcrumb-wrapper theme-bg ${styles.pageHeader}`}>
                <h1 className={`h3 mb-0 text-white ${styles.pageTitle}`}>{title}</h1>
                {description && <p className={styles.pageDescription}>{description}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bd-dashboard-area section-space-bottom">
        <div className="container">
          <div className="bd-dashboard-main">
            <div className="row gy-30">
              {/* Lets the sidebar ask before leaving a record with unsaved changes. */}
              <UnsavedChangesProvider>
                <AdmisionesAdminSidebarMenu />
                <main id={MAIN_CONTENT_ID} tabIndex={-1} className="col-xl-9 col-lg-9 col-md-8">
                  {children}
                </main>
              </UnsavedChangesProvider>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdmisionesAdminLayout;
