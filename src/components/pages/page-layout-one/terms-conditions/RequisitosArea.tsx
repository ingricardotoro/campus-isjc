// import AboutCtaArea from '@/components/common/about-cta/AboutCtaArea';
// import Breadcrumbs from '@/components/common/Breadcrumb/Breadcrumbs';
// import Image from 'next/image';
import React from 'react';
// import faqShape from '../../../../../public/assets/images/faq/faq-shape.png';

const RequisitosArea = () => {
    return (
        <>
          
            {/* -- faq area start -- */}
            <section className="bd-faq-area p-relative">
                <div className="container">
                    <div className="row gy-30">
                       
                        <div className="col-xl-12 col-lg-12">
                            <div className="bd-faq-tab-content">
                                <div className="tab-content" id="pills-tabContent">
                                    <div className="tab-pane fade show active" id="pills-home" role="tabpanel" aria-labelledby="pills-home-tab" tabIndex={0}>
                                        <div className="bd-faq-accordion">
                                            <div className="accordion-common-style accordion-transparent accordion-style-one">
                                                <div className="accordion" id="accordionExampleTwo">
                                                    {/* -- Question 1 -- */}
                                                    <div className="accordion-item">
                                                        <h2 className="accordion-header" id="headingOne">
                                                            <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                                                                Área de Pre-Básica
                                                            </button>
                                                        </h2>
                                                        <div id="collapseOne" className="accordion-collapse collapse show" aria-labelledby="headingOne" data-bs-parent="#accordionExampleTwo">
                                                            <div className="accordion-body">
                                                                <ul>
                                                                    <li>Acta de Nacimiento Original</li>
                                                                    <li>Tarjeta de Vacunación</li>
                                                                    <li>Constancia de Fe de Bautismo</li>
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* -- Question 2 -- */}
                                                    <div className="accordion-item">
                                                        <h2 className="accordion-header" id="headingTwo">
                                                            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                                                                Área de Básica ( 1 - 9 Grado)
                                                            </button>
                                                        </h2>
                                                        <div id="collapseTwo" className="accordion-collapse collapse" aria-labelledby="headingTwo" data-bs-parent="#accordionExampleTwo">
                                                            <div className="accordion-body">
                                                                <ul>
                                                                    <li>Acta de Nacimiento Original</li>
                                                                    <li>Copia de certificado de Pre-Básica (para primer grado)</li>
                                                                    <li>Constancia de Fe de Bautismo</li>
                                                                    <li>Constancia de Solvencia de Kinder de Procedencia.</li>
                                                                </ul>
                                                            </div>
                                                        </div>       
                                                    </div>
                                                    {/* -- Question 3 -- */}
                                                    <div className="accordion-item">
                                                        <h2 className="accordion-header" id="headingThree">
                                                            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
                                                                Área de Media ( 10 y 11 Grado)
                                                            </button>
                                                        </h2>
                                                        <div id="collapseThree" className="accordion-collapse collapse" aria-labelledby="headingThree" data-bs-parent="#accordionExampleTwo">
                                                            <div className="accordion-body">
                                                                <ul>
                                                                    <li>Acta de Nacimiento Original</li>
                                                                    <li>Copia de certificado de Básica</li>
                                                                    <li>Constancia de Fe de Bautismo</li>
                                                                    <li>Constancia de Muy Buena o Excelente Conducta.</li>
                                                                    <li>Examen de V.D.R.L.</li>
                                                                    <li>Constancia de Solvencia de Esculea de Procedencia.</li>
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* -- Question 4 -- */}
                                                   {/*  <div className="accordion-item">
                                                        <h2 className="accordion-header" id="headingFour">
                                                            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseFour" aria-expanded="false" aria-controls="collapseFour">
                                                                Can I access courses on mobile devices?
                                                            </button>
                                                        </h2>
                                                        <div id="collapseFour" className="accordion-collapse collapse" aria-labelledby="headingFour" data-bs-parent="#accordionExampleTwo">
                                                            <div className="accordion-body">
                                                                Yes, iStudy’s platform is fully responsive, and you can access all our
                                                                courses on your smartphone or tablet through the mobile web browser or our
                                                                dedicated mobile app.
                                                            </div>
                                                        </div>
                                                    </div> */}
                                                  
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                    
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* <div className="bd-faq-page-shape d-none d-xxl-block"><Image src={faqShape} alt="shape" />
                    </div> */}
                </div>
            </section>
            {/* -- faq area end -- */}
           
        </>
    );
};

export default RequisitosArea;