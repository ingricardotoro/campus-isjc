"use client"
import Link from 'next/link';
import React from 'react';
import bannerBg from "../../../public/assets/images/banner/banner-4/kindergarten-banner-bg.webp";
import bannerThumb from "../../../public/assets/images/banner/banner-4/kinder4 - copia.png";
import bannerShape1 from "../../../public/assets/images/shape/kg-banner-shpape-1.webp";
import bannerShap2 from "../../../public/assets/images/shape/kg-banner-shpape-2.webp";
import bannerShap3 from "../../../public/assets/images/shape/kg-banner-shpape-3.webp";
import Image from 'next/image';
import { useVideoModal } from '@/contextApi/VideoProvider';

const BannerArea = () => {
    const { playVideo } = useVideoModal();
    return (
        <>
            {/* -- banner area start  -- */}
            <section className="bd-banner-area bd-banner-four bd-banner-four-mask" style={{ backgroundImage: `url(${bannerBg.src})` }}>
                <div className="bd-banner-bg"></div>
                <div className="container">
                    <div className="row gy-30 align-items-center justify-content-between">
                        <div className="col-xxl-5 col-xl-6 col-lg-6 col-md-12">
                            <div className="bd-banner-section-wrapper p-relative">
                                <span className="bd-banner-subtitle text-primary uppercase mb-10 d-block fw-5">Totalmente Bilingüe</span>
                                <h1 className="bd-banner-title medium mb-20">Welcome to Kindergarten</h1>
                                <p className="bd-banner-description">Brindamos un ambiente seguro y estimulante donde los niños exploran, aprenden y desarrollan sus habilidades a través del juego, la creatividad y el acompañamiento de docentes dedicados.</p>
                                <div className="bd-banner-btn d-flex-items flex-wrap gap-30">
                                    <Link className="bd-btn btn-outline-border-primary" href="/contactanos">Contáctanos</Link>
                                    <button type='button' onClick={() => playVideo("2XsdnFbcZpU", "youtube")} className="bd-video-btn secondary has-primary popup-video">
                                        <span className="icon"><i className="fa-solid fa-play"></i></span></button>
                                </div>
                            </div>
                        </div>
                        <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-12">
                            <div className="">
                                <div className="bd-banner-thumb-four">
                                    <Image src={bannerThumb} style={{width:"auto", height:"auto"}} alt="banner-4" priority/>
                                </div>
                                <div className="curly-arrow">
                                    <Image src={bannerShap2} alt="Education arrow" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bd-banner-four-shape-wrap d-none d-md-block">
                    <div className="shape-1 d-none d-lg-block"><Image src={bannerShape1} alt="shape" /></div>
                    <div className="shape-2"><Image src={bannerShap3} alt="shape" /></div>
                </div>
            </section>
            {/* -- banner area end  -- */}
        </>
    );
};

export default BannerArea;