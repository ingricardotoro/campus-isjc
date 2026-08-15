import EvaluacionAdminBreadcrumb from "@/components/common/Breadcrumb/EvaluacionAdminBreadcrumb";
import React, { ReactNode } from "react";
import EvaluacionAdminSidebarMenu from "./sidebar/EvaluacionAdminSidebarMenu";

interface EvaluacionAdminLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
}

const EvaluacionAdminLayout = ({ title, description, children }: EvaluacionAdminLayoutProps) => {
  return (
    <>
      <EvaluacionAdminBreadcrumb title={title} description={description} />
      <div className="bd-dashboard-area section-space-bottom">
        <div className="container">
          <div className="bd-dashboard-main">
            <div className="row gy-30">
              <EvaluacionAdminSidebarMenu />
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EvaluacionAdminLayout;
