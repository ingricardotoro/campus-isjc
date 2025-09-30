import BreadcrumbsTwo from '@/components/common/Breadcrumb/BreadcrumbsTwo';
import React from 'react';
import Link from 'next/link';
import JobApplicationForm from '@/form/JobApplicationForm';

const JobsMain = () => {
    return (
        <>
            <BreadcrumbsTwo breadcrumbTwoTitle='Oportunidades de Empleo' />
            <section className="bd-apply-form-area form-max section-space">
                <div className="container custom-container">
                    <div className="row justify-content-center">
                        <div className="col-xl-12">
                            <div className="bd-apply-form">
                                <div className="bd-apply-form-top">
                                    <h3 className="bd-course-details-content-title text-center">Formulario de Aplicación Laboral</h3>
                                    <p className="text-center mb-4">
                                        Completa el siguiente formulario para aplicar a las oportunidades laborales disponibles en nuestra institución. 
                                        Buscamos profesionales comprometidos con la excelencia educativa y que compartan nuestros valores.
                                    </p>
                                    <ul>
                                        <li>Asegúrate de completar todos los campos marcados con (*) correctamente.</li>
                                        <li>Ten preparado tu curriculum vitae en formato PDF para adjuntar.</li>
                                        <li>Verifica que la información proporcionada sea precisa antes de enviar.</li>
                                        <li>Si tienes problemas con el formulario, puedes contactarnos directamente a <Link href="mailto:empleos@isjc.edu.hn" className="text-primary">empleos@isjc.edu.hn</Link>.</li>
                                    </ul>
                                </div>
                                <div className="bd-form-divider"></div>
                                <JobApplicationForm />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default JobsMain;