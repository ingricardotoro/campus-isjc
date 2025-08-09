import Image from 'next/image';
import React from 'react';
//import modernMissionImg from '../../../../../public/assets/images/mission/modern-mission.webp';
import modernMissionImg from '../../../../../public/assets/images/mission/elecciones3.jpg';
import counterData from '@/data/counter-data';
import CountUpContent from '@/components/common/counter/CountUpContent';
import UniversityCounterSection from '@/components/university/UniversityCounterSection';

const AboutSchoolingMissionArea = () => {
    return (
        <>
            <section className="bd-why-choose-area section-space" id="learnMore">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-xl-6">
                            <div className="bd-section-wrapper section-title-space text-center">
                                <span className="bd-section-subtitle">Nuestra Misión y Visión</span>
                                <h2 className="bd-section-title mb-20">Dirigiendo el Futuro de la Educación en el <span
                                    className="text-primary">ISJC</span></h2>
                            </div>
                        </div>
                    </div>
                    <div className="row gy-30 align-items-center justify-content-between">
                        <div className="col-xl-5">
                            <div className="bd-mission-vision-thumb">
                                <div className="bd-mission-vision-thumb-mask">
                                    <Image src={modernMissionImg} style={{width: 'auto', height: 'auto'}} alt="image" />
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-7">
                            <div className="bd-mission-vision-wrapper mb-20">
                                <h3 className="bd-mission-vision-title">Nuestra Misión</h3>
                                <p className="bd-mission-vision-desc">El Instituto San José del Carmen inspirado en la misión evangelizadora de la iglesia católica y el carisma propio de la congregación de las Carmelitas de San José, ofrece educación integral y de calidad, a niños y jóvenes de la sociedad hondureña, que es a la vez portadora de valores profundamente morales, éticos y espirituales. Para lograrlo estimulados el perfeccionamiento de nuestro personal docente, las relaciones de trabajo armoniosas y promovemos sólidos principios de integridad, ética y equidad.</p>
                            </div>
                            <div className="bd-mission-vision-wrapper">
                                <h3 className="bd-mission-vision-title">Nuestra Visión</h3>
                                <p className="bd-mission-vision-desc">Ser una comunidad educativa de excelencia, transmisora y portadora de valores humanos, cristianos y científicos. En el cual todo alumno egresado se forme e identifique como auténtico cristiano, ciudadano de principios y valores, que aporten a la sociedad justicia , amor y paz en el área donde se desenvuelvan , siendo con ello artífice de una nueva Honduras.</p>
                            </div>
                        </div>
                    </div>
                    <UniversityCounterSection />
                </div>
            </section>
        </>
    );
};

export default AboutSchoolingMissionArea;