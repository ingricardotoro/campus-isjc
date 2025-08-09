import Image from 'next/image';
import React from 'react';
import campusImg from '../../../../../public/assets/images/campus/basica3.png';
import campusImgTwo from '../../../../../public/assets/images/campus/polideportivo33.png';
import campusImgThree from '../../../../../public/assets/images/campus/media22.png';
import campusImgFour from '../../../../../public/assets/images/campus/kinder1.png';

const CampusIntroArea = () => {
    return (
        <>
            <section  className="bd-campus-intro section-space-bottom">
                <div  className="container">
                    <div  className="row gy-30 justify-content-between align-items-end">
                        <div  className="col-lg-4 col-md-6">
                            <div  className="bd-section-title-wrapper section-title-space">
                                <h3  className="bd-section-title mb-20">Entornos pensados para el Aprendizaje.</h3>
                                <p  className="bd-section-paragraph">Únete a más de 1,200 estudiantes que están forjando su futuro en el Instituto San José del Carmen.</p>
                            </div>
                            <div  className="bd-campus-intro-thumb">
                                <Image src={campusImg} style={{width:"auto", height:"auto"}}  alt="campus"/>
                            </div>
                        </div>
                        <div  className="col-lg-4 col-md-6">
                            <div  className="bd-campus-intro-thumb">
                                <Image src={campusImgTwo} alt="campus"/>
                            </div>
                        </div>
                        <div  className="col-lg-4 col-md-12">
                            <div  className="bd-campus-intro-thumb-group">
                                <div  className="bd-campus-intro-thumb">
                                    <Image src={campusImgThree} alt="campus"/>
                                </div>
                                <div  className="bd-campus-intro-thumb">
                                    <Image src={campusImgFour}  alt="campus"/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default CampusIntroArea;