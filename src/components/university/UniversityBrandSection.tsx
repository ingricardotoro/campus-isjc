import React from 'react';
import brand1 from '../../../public/assets/images/brand/google.png';
import brand2 from '../../../public/assets/images/brand/pearson.jpg';
import brand3 from '../../../public/assets/images/brand/lego.png';
import brand4 from '../../../public/assets/images/brand/kahoot.png';
import brand5 from '../../../public/assets/images/brand/digital_ocean.jpg';
import brand6 from '../../../public/assets/images/brand/bookmaster.jpeg';
import brand7 from '../../../public/assets/images/brand/toefl.webp';
import brand8 from '../../../public/assets/images/brand/sanpablo.jpg';
import Image from 'next/image';

const partners = [
    { src: brand1, alt: 'Google Workspace' },
    { src: brand2, alt: 'Editorial Pearson' },
    { src: brand3, alt: 'Lego Robotic' },
    { src: brand4, alt: 'Kahoot!' },
    { src: brand5, alt: 'Digital Ocean' },
    { src: brand6, alt: 'Book Master' },
    { src: brand7, alt: 'ETS Toefl' },
    { src: brand8, alt: 'Librería San Pablo' },
];

const UniversityBrandSection = () => {
    return (
        <>
            {/* -- brand area start -- */}
            <section className="bd-brand-area section-space primary-bg">
                <div className="container">
                    <div className="row">
                        <div className="col-xl-5 col-lg-5">
                            <div className="bd-brand-section-wrapper has-margin">
                                <div className="bd-section-title-wrapper section-title-space">
                                    <span className="bd-section-subtitle">Nuestros Socios</span>
                                    <h2 className="bd-section-title mb-20">Aprender con nuestros <span
                                        className="down-mark-line">Aliados</span></h2>
                                    <p className="bd-section-paragraph"> Educación fortalecida por grandes aliados estratégicos y de impacto real, para lograr alcanzar nuestra visión institucional.</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-7 col-lg-7">
                            <div className="bd-brand-wrapper style-five">
                                <div className="bd-brand-box">

                                    {partners.map((partner, index) => (
                                        <div key={index} className="bd-brand-item">
                                            <Image
                                                src={partner.src}
                                                alt={partner.alt}
                                                style={{width:"auto", height:"auto"}}
                                            />
                                        </div>
                                    ))}

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* -- brand area end -- */}
        </>
    );
};

export default UniversityBrandSection;