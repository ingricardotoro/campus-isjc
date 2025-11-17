'use client'
import Image from 'next/image';
import React from 'react';
import campusGalleryOne from "../../../public/assets/images/gallery/kinder/kinder1.png";
import campusGalleryTwo from "../../../public/assets/images/gallery/kinder/kinder2.png";
import campusGalleryThree from "../../../public/assets/images/gallery/kinder/kinder3.png";
import campusGalleryFour from "../../../public/assets/images/gallery/kinder/kinder4.png";
import campusGalleryFive from "../../../public/assets/images/gallery/kinder/fiesta.jpg";
import campusGallerySix from "../../../public/assets/images/gallery/kinder/ciencia.jpg";
import campusGallerySeven from "../../../public/assets/images/gallery/kinder/20250930_125324.png";
import campusGalleryEight from "../../../public/assets/images/gallery/kinder/poli3.jpg";
import campusGalleryNine from "../../../public/assets/images/gallery/kinder/20250930_125510.png";
import campusGalleryTen from "../../../public/assets/images/gallery/kinder/viaje.jpg";
import campusGalleryEleven from "../../../public/assets/images/gallery/kinder/poli2.jpg";
import campusGalleryTwelve from "../../../public/assets/images/gallery/kinder/retiro.jpg";

import { PhotoProvider, PhotoView } from 'react-photo-view';
//import Link from 'next/link';

const KinderGallery = () => {
    // Image data array
    const galleryData = [
        { img: campusGalleryOne, text:"Uniforme de Trabajo" },
        { img: campusGalleryTwo, text:"Salón de Clases" },
        { img: campusGalleryThree, text:"Patio de juegos" },
        { img: campusGalleryFour, text:"Patio de juegos" },
        { img: campusGalleryFive, text:"Celebraciones" },
        { img: campusGallerySix, text:"Ferias Científicas" },
        { img: campusGallerySeven, text:"Patios" },
        { img: campusGalleryEight, text:"Actividades Religiosas" },
        { img: campusGalleryNine, text:"Cancha Sintética" },
        { img: campusGalleryTen, text:"Viajes Académicos" },
        { img: campusGalleryEleven, text:"Polideportivo" },
        { img: campusGalleryTwelve, text:"Casa Retiro" },
    ];
    return (
        
        <PhotoProvider>
            <section className="bd-campus-gallery-area section-space-bottom">
                <div className="container">
                    <div className="row">
                        <div className="col-xl-12">
                            <div className="bd-section-title-wrapper section-title-space">
                                <h3 className="bd-section-title bottom-line">Galería de Pre - Básica</h3>
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
                   {/*  <div className="bd-gallery-more-btn d-flex justify-content-center mt-50">
                        <Link className="bd-btn btn-outline-border-primary" href="#">Ver Mas <span className="right-icon"><i
                            className="fa-duotone fa-spinner"></i></span></Link>
                    </div> */}
                    {/* <!-- gallery-more style end --> */}
                </div>
            </section>
        </PhotoProvider>
        
    );
};

export default KinderGallery;