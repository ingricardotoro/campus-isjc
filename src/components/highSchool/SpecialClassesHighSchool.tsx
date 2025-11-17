import instructorsData from '@/data/instructor-data';
import React from 'react';
import testimonialShape from '../../../public/assets/images/testimonial/testimonial-shape-bg.webp';
//import Link from 'next/link';
import Image from 'next/image';

const SpecialClassesHighSchool = () => {
    return (
        <>
            {/* -- instructor area start -- */}
            <div className="bd-instructor-area section-space theme-bg p-relative z-index-11">
                <div className="bd-kinder-bg" style={{ backgroundImage: `url(${testimonialShape.src})` }}></div>
                <div className="bd-kinder-bg-overlay"></div>
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-xl-6 col-lg-6">
                            <div className="bd-section-title-wrapper section-title-space text-center">
                                <span className="bd-section-subtitle secondary">Nuestro Curriculum</span>
                                <h2 className="bd-section-title white-text">Programas Especiales</h2>
                            </div>
                        </div>
                    </div>
                    <div className="row gy-30">
                        {
                            instructorsData.slice(34, 38).map((item, index) => {
                                // Adaptar nombres y títulos para high school
                                const highSchoolPrograms = [
                                    { name: "Retiros Espirituales", title: "Desarrollo de habilidades espirituales" },
                                    { name: "Viajes Académicos", title: "Museos y excursiones educativas" },
                                    { name: "Programa Desarrollo Social", title: "Trabajo Educativo Social" },
                                    { name: "Orientación Universitaria", title: "Preparación para admisiones" }
                                ];

                                return (
                                    <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6" key={`highschool-program-${item.id}-${index}`}>
                                        <div className="bd-instructor-wrapper style-nine light-color">
                                            <div className="bd-instructor-item">
                                                <div className="bd-instructor-thumb-wrap">
                                                    <div className="bd-instructor-thumb">
                                                      
                                                            <Image style={{width:"100%", height:"auto"}} src={item.image} alt="image" priority/>
                                                       
                                                    </div>
                                                </div>
                                                <div className="bd-instructor-info">
                                                    <h6 className="name underline-two">
                                                        
                                                            {highSchoolPrograms[index].name}
                                                       
                                                    </h6>
                                                    <span>{highSchoolPrograms[index].title}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>
            </div>
            {/* -- instructor area end -- */}
        </>
    );
};

export default SpecialClassesHighSchool;