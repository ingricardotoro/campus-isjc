'use client'
import Image from 'next/image';
import React from 'react';
import campusGalleryOne from "../../../../../public/assets/images/gallery/campus-gallery-img-1.webp";
import campusGalleryTwo from "../../../../../public/assets/images/gallery/campus-gallery-img-2.webp";
import campusGalleryThree from "../../../../../public/assets/images/gallery/campus-gallery-img-3.webp";
import campusGalleryFour from "../../../../../public/assets/images/gallery/campus-gallery-img-4.webp";
import campusGalleryFive from "../../../../../public/assets/images/gallery/campus-gallery-img-5.webp";
import campusGallerySix from "../../../../../public/assets/images/gallery/campus-gallery-img-6.webp";
import campusGallerySeven from "../../../../../public/assets/images/gallery/campus-gallery-img-7.webp";
import campusGalleryEight from "../../../../../public/assets/images/gallery/campus-gallery-img-8.webp";
import { PhotoProvider, PhotoView } from 'react-photo-view';
import Link from 'next/link';

const CampusGalleryArea = () => {
    // Image data array
    const galleryData = [
        { img: campusGalleryOne, text:"Laboratorios" },
        { img: campusGalleryTwo, text:"Capilla" },
        { img: campusGalleryThree, text:"Estacionamiento" },
        { img: campusGalleryFour, text:"Biblioteca" },
        { img: campusGalleryFive, text:"Clínica" },
        { img: campusGallerySix, text:"Areas Verdes" },
        { img: campusGallerySeven, text:"Casa Retiro" },
        { img: campusGalleryEight, text:"Patios" },
    ];
    return (
        <>
            <PhotoProvider>
                <section className="bd-campus-gallery-area section-space-bottom">
                    <div className="container">
                        <div className="row">
                            <div className="col-xl-12">
                                <div className="bd-section-title-wrapper section-title-space">
                                    <h3 className="bd-section-title bottom-line">Galería de Instalaciones Generales</h3>
                                </div>
                            </div>
                        </div>
                        <div className="row g-30 justify-content-center">

                            {galleryData.map((item, index) => (
                                <div key={index} className="col-xxl-3 col-xl-4 col-lg-4 col-md-6">
                                    <div
                                        className={`bd-campus-gallery-wrapper`}
                                    >
                                        <div className={`bd-campus-gallery-thumb`}>
                                            <PhotoView src={item.img.src}>
                                                <Image
                                                    src={item.img}
                                                    alt='image'
                                                    style={{ cursor: "pointer", width: "auto", height: "100%" }}
                                                />
                                            </PhotoView>
                                        </div>
                                        <h6 className="bd-campus-gallery-title">{item.text}</h6>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* <!-- gallery-more style --> */}
                        <div className="bd-gallery-more-btn d-flex justify-content-center mt-50">
                            <Link className="bd-btn btn-outline-border-primary" href="#">Ver Mas <span className="right-icon"><i
                                className="fa-duotone fa-spinner"></i></span></Link>
                        </div>
                        {/* <!-- gallery-more style end --> */}
                    </div>
                </section>
            </PhotoProvider>
        </>
    );
};

export default CampusGalleryArea;