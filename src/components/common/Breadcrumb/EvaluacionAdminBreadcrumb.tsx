import React from "react";

interface EvaluacionAdminBreadcrumbProps {
  title: string;
  description?: string;
}

const EvaluacionAdminBreadcrumb = ({ title, description }: EvaluacionAdminBreadcrumbProps) => {
  return (
    <div className="bd-dashboard-breadcrumb section-space-small-top">
      <div className="container custom-container">
        <div className="row">
          <div className="col-xl-12">
            <div className="bd-dashboard-breadcrumb-wrapper p-relative">
              <div className="bd-dashboard-profile">
                <div className="content">
                  <h3 className="name mb-0">{title}</h3>
                  {description && <span className="designation d-block">{description}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluacionAdminBreadcrumb;
