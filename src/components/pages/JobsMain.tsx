"use client"
import React from 'react';
import JobApplicationForm from '@/form/JobApplicationForm';
import BreadcrumbsJobs from '../common/Breadcrumb/BreadcrumbsJobs';

const JobsMain = () => {
    return (
        <>
            <BreadcrumbsJobs breadcrumbTitle="Empleos - Forma Parte de Nuestro Equipo" />
            
            {/* Área de Empleos */}
            <section className="bd-joining-application-area pt-120 pb-120">
                <div className="container">
                    <div className="row">
                        <div className="col-12">
                            <div className="bd-joining-application">
                                <div className="bd-joining-application-content">
                                    <h3 className="bd-joining-application-title">Únete a Nuestro Equipo</h3>
                                    <p>En el Instituto San José del Carmen, buscamos profesionales apasionados que compartan nuestra visión de una educación de excelencia basada en valores católicos. Si deseas formar parte de nuestra comunidad educativa y contribuir al desarrollo integral de nuestros estudiantes, te invitamos a aplicar.</p>
                                    
                                    <div className="bd-section-title-wrapper mb-45">
                                        <h2 className="bd-section-title mb-0">Áreas de Oportunidad</h2>
                                        <p>Constantemente buscamos talento en las siguientes áreas:</p>
                                    </div>
                                    
                                    <div className="row">
                                        <div className="col-xl-4 col-lg-4 col-md-6">
                                            <div className="bd-job-card mb-30">
                                                <div className="bd-job-card-icon">
                                                    <i className="fa-solid fa-graduation-cap"></i>
                                                </div>
                                                <div className="bd-job-card-content">
                                                    <h4>Docencia</h4>
                                                    <ul>
                                                        <li>Profesores bilingües para todos los niveles</li>
                                                        <li>Especialistas en diferentes materias</li>
                                                        <li>Profesores de religión y valores</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="col-xl-4 col-lg-4 col-md-6">
                                            <div className="bd-job-card mb-30">
                                                <div className="bd-job-card-icon">
                                                    <i className="fa-solid fa-building"></i>
                                                </div>
                                                <div className="bd-job-card-content">
                                                    <h4>Administración</h4>
                                                    <ul>
                                                        <li>Personal administrativo</li>
                                                        <li>Coordinadores académicos</li>
                                                        <li>Asistentes escolares</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="col-xl-4 col-lg-4 col-md-6">
                                            <div className="bd-job-card mb-30">
                                                <div className="bd-job-card-icon">
                                                    <i className="fa-solid fa-screwdriver-wrench"></i>
                                                </div>
                                                <div className="bd-job-card-content">
                                                    <h4>Servicios de Apoyo</h4>
                                                    <ul>
                                                        <li>Tecnología de la información</li>
                                                        <li>Mantenimiento e infraestructura</li>
                                                        <li>Seguridad y servicios generales</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Separador de sección con onda */}
                               

                                {/* Requisitos generales */}
                                <div className="bd-joining-requirements mb-65">
                                    <h3 className="bd-section-title mb-20">Requisitos Generales</h3>
                                    <div className="row">
                                        <div className="col-lg-6">
                                            <ul className="bd-job-requirements-list">
                                                <li><i className="fas fa-check"></i> Título universitario en el área correspondiente</li>
                                                <li><i className="fas fa-check"></i> Experiencia previa demostrable</li>
                                                <li><i className="fas fa-check"></i> Compromiso con la filosofía católica de la institución</li>
                                                <li><i className="fas fa-check"></i> Capacidad de trabajo en equipo</li>
                                            </ul>
                                        </div>
                                        <div className="col-lg-6">
                                            <ul className="bd-job-requirements-list">
                                                <li><i className="fas fa-check"></i> Para puestos docentes Bilingües: nivel avanzado de inglés</li>
                                                <li><i className="fas fa-check"></i> Vocación de servicio y excelentes relaciones interpersonales</li>
                                                <li><i className="fas fa-check"></i> Responsabilidad y compromiso con la excelencia</li>
                                                <li><i className="fas fa-check"></i> Disposición para desarrollo profesional continuo</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Beneficios */}
                                <div className="bd-joining-benefits mb-65">
                                    <h3 className="bd-section-title mb-20">Beneficios de Formar Parte de Nuestro Equipo</h3>
                                    <div className="row">
                                        <div className="col-lg-6">
                                            <ul className="bd-job-benefits-list">
                                                <li><i className="fas fa-star"></i> Ambiente laboral basado en valores cristianos</li>
                                                <li><i className="fas fa-star"></i> Oportunidades de desarrollo profesional</li>
                                                <li><i className="fas fa-star"></i> Estabilidad laboral</li>
                                            </ul>
                                        </div>
                                        <div className="col-lg-6">
                                            <ul className="bd-job-benefits-list">
                                                <li><i className="fas fa-star"></i> Integración en una comunidad educativa comprometida</li>
                                                <li><i className="fas fa-star"></i> Participación en proyectos educativos innovadores</li>
                                                <li><i className="fas fa-star"></i> Prestaciones de ley y beneficios adicionales</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Formulario de aplicación */}
                                <div className="bd-application-form-wrapper">
                                    <div className="bd-section-title-wrapper mb-35">
                                        <h2 className="bd-section-title mb-0">Formulario de Aplicación</h2>
                                        <p>Complete el siguiente formulario para aplicar a una posición en nuestra institución:</p>
                                    </div>
                                    <div className="bd-application-form">
                                        <JobApplicationForm />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default JobsMain;