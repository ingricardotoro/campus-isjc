import Link from 'next/link';
import React from 'react';
import CategoriasAdmision from './CategoriasAdmision';
import RequisitosArea from './RequisitosArea';

const TermsConditionArea = () => {
    return (
        <>
            <section className="bd-policy-area section-space">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-xl-10 ">
                            <div className="bd-policy-wrapper p-relative z-index-1 ">
                                <div className="bd-policy-item">
                                    <h4 className="bd-policy-title ">Introducción</h4>
                                    <p>¡Bienvenidos al proceso de matrícula escolar del Instituto Católico San José del Carmen! Nos alegra contar con su interés en formar parte de nuestra comunidad educativa, donde promovemos valores, excelencia académica y crecimiento integral. Les animamos a dar este importante paso con confianza y entusiasmo, seguros de que juntos construiremos un camino lleno de aprendizaje, fe y nuevas oportunidades. ¡Gracias por confiar en nosotros para acompañar el desarrollo de sus hijos!</p>
                                   
                                </div>
                                <br />
                                <div className="bd-policy-item ">
                                    <h4 className="bd-policy-title">Proceso de Admisión</h4>
                                    <p className="mb-10">Para poder formar parte del proceso de admisión a cualquiera de nuestras áreas educativas es necesario seguir los siguientes pasos y cumplir con los requisitos solicitados.</p>
                                    <br />
                                    <CategoriasAdmision />
                                </div>

                                <div className="bd-policy-item">
                                    <br />
                                    <h4 className="bd-policy-title">Documentos Requeridos</h4>
                                    <p>Cada área solicita cierta documentación en específico, es necesario presentar toda esta información. A continuación, encontrará los documentos solicitados.</p>

                                    <RequisitosArea />
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default TermsConditionArea;