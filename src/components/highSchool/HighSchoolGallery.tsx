'use client'
import Image from 'next/image';
import React from 'react';
import campusGalleryOne from "../../../public/assets/images/gallery/elementary/elementary1.jpg"; // Usando las mismas imágenes por ahora
import campusGalleryTwo from "../../../public/assets/images/gallery/elementary/elementary21.jpg";
import campusGalleryThree from "../../../public/assets/images/gallery/elementary/elementary27.jpg";
import campusGalleryFour from "../../../public/assets/images/gallery/elementary/elementary29.jpg";
import campusGalleryFive from "../../../public/assets/images/gallery/elementary/elementary24.jpg";
import campusGallerySix from "../../../public/assets/images/gallery/elementary/elementary18.jpg";
import campusGallerySeven from "../../../public/assets/images/gallery/elementary/elementary19.jpg";
import campusGalleryEight from "../../../public/assets/images/gallery/elementary/elementary20.jpg";
import { PhotoProvider, PhotoView } from 'react-photo-view';
import Link from 'next/link';

const HighSchoolGallery = () => {
    // Image data array
    const galleryData = [
        { img: campusGalleryOne, text:"Graduación" },
        { img: campusGalleryTwo, text:"Proyectos de Investigación" },
        { img: campusGalleryThree, text:"Competencias Deportivas" },
        { img: campusGalleryFour, text:"Voluntariado Social" },
        { img: campusGalleryFive, text:"Feria Universitaria" },
        { img: campusGallerySix, text:"Retiros Espirituales" },
        { img: campusGallerySeven, text:"Modelo de Naciones Unidas" },
        { img: campusGalleryEight, text:"Olimpiadas Científicas" },
    ];
    return (
        
        <PhotoProvider>
            <section className="bd-campus-gallery-area pt-40 section-space-bottom">
                <div className="container">
                    <div className="row">
                        <div className="col-xl-12">
                            <div className="bd-section-title-wrapper section-title-space">
                                <h3 className="bd-section-title bottom-line">Galería de Actividades</h3>
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
                        <Link className="bd-btn btn-outline-border-primary" href="#">Ver Más <span className="right-icon"><i
                            className="fa-duotone fa-spinner"></i></span></Link>
                    </div>
                    {/* <!-- gallery-more style end --> */}
                </div>
            </section>
        </PhotoProvider>
        
    );
};

export default HighSchoolGallery;