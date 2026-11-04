import React from "react";
import type { AdmissionsCatalog } from "@/lib/admissions/catalog-types";
import AdmissionsInterestForm from "./AdmissionsInterestForm";

type Props = {
  /** Null when the catalog could not be loaded. */
  catalog: AdmissionsCatalog | null;
};

const STEPS = [
  "Complete este formulario con sus datos de contacto y el grado de interés.",
  "Nuestro equipo de admisiones se comunicará con usted para resolver sus dudas.",
  "Le orientaremos sobre requisitos, fechas importantes y, si lo desea, una visita al Instituto.",
];

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="text-center py-5" role="status">
      <h2 className="bd-section-title mb-20">{title}</h2>
      <p className="bd-section-paragraph mb-0">{children}</p>
    </div>
  );
}

const AdmissionsMain: React.FC<Props> = ({ catalog }) => {
  const isOpen = !!catalog && catalog.academicYears.length > 0 && catalog.grades.length > 0;
  const yearNames = catalog?.academicYears.map((year) => year.year).join(" y ");

  return (
    <section className="bd-contact-form-area section-space">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-8 col-lg-10">
            {catalog === null ? (
              <Notice title="Formulario no disponible">
                En este momento no podemos mostrar el formulario de admisiones. Por favor, intente
                nuevamente más tarde o comuníquese con el Instituto por nuestros canales de contacto.
              </Notice>
            ) : !isOpen ? (
              <Notice title="Inscripciones cerradas">
                Por ahora no hay un periodo de admisión abierto. Le invitamos a visitar este sitio
                más adelante o a comunicarse con el Instituto por nuestros canales de contacto.
              </Notice>
            ) : (
              <>
                <div className="bd-section-title-wrapper section-title-space">
                  <h1 className="bd-section-title mb-20">Admisiones {yearNames}</h1>
                  <p className="bd-section-paragraph">
                    Gracias por su interés en el Instituto San José del Carmen. Déjenos sus datos y
                    con gusto le acompañaremos en el proceso de admisión.
                  </p>
                  <ol className="bd-section-paragraph ps-3 mb-0">
                    {STEPS.map((step) => (
                      <li key={step} className="mb-5">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="bd-contact-form">
                  <AdmissionsInterestForm catalog={catalog} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdmissionsMain;
