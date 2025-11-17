'use client'
import Image from 'next/image';
import React from 'react';
import campusGalleryOne from "../../../public/assets/images/gallery/elementary/elementary1.jpg";
import campusGalleryTwo from "../../../public/assets/images/gallery/elementary/elementary21.jpg";
import campusGalleryThree from "../../../public/assets/images/gallery/elementary/spelling.jpg";
import campusGalleryFour from "../../../public/assets/images/gallery/elementary/elementary29.jpg";
import campusGalleryFive from "../../../public/assets/images/gallery/elementary/elementary24.jpg";
import campusGallerySix from "../../../public/assets/images/gallery/elementary/elementary18.jpg";
import campusGallerySeven from "../../../public/assets/images/gallery/elementary/elementary19.jpg";
import campusGalleryEight from "../../../public/assets/images/gallery/elementary/elementary20.jpg";

import campusGalleryNine from "../../../public/assets/images/gallery/elementary/canto.jpg";
import campusGalleryTen from "../../../public/assets/images/gallery/elementary/polideportivo.jpg";
import campusGalleryEleven from "../../../public/assets/images/gallery/elementary/clarita.jpg";
import campusGalleryTwelve from "../../../public/assets/images/gallery/elementary/comunion.jpg";

import { PhotoProvider, PhotoView } from 'react-photo-view';
//import Link from 'next/link';

const ElementaryGallery = () => {
    // Image data array
    const galleryData = [
        { img: campusGalleryOne, text:"Desfiles Patrios" },
        { img: campusGalleryTwo, text:"Feria Científica" },
        { img: campusGalleryThree, text:"Día de la Tierra" },
        { img: campusGalleryFour, text:"Celebraciones" },
        { img: campusGalleryFive, text:"Día del árbol" },
        { img: campusGallerySix, text:"Bautismo y primera comunión" },
        { img: campusGallerySeven, text:"Celebración Carmelitana" },
        { img: campusGalleryEight, text:"Olimpiadas Matemáticas" },

        { img: campusGalleryNine, text:"Día del árbol" },
        { img: campusGalleryTen, text:"Bautismo y primera comunión" },
        { img: campusGalleryEleven, text:"Celebración Carmelitana" },
        { img: campusGalleryTwelve, text:"Olimpiadas Matemáticas" },
    ];
    return (
        
        <PhotoProvider>
            <section className="bd-campus-gallery-area pt-40 section-space-bottom">
                <div className="container">
                    <div className="row">
                        <div className="col-xl-12">
                            <div className="bd-section-title-wrapper section-title-space">
                                <h3 className="bd-section-title bottom-line">Galería de Eventos</h3>
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
                  {/*   <div className="bd-gallery-more-btn d-flex justify-content-center mt-50">
                        <Link className="bd-btn btn-outline-border-primary" href="#">Ver Mas <span className="right-icon"><i
                            className="fa-duotone fa-spinner"></i></span></Link>
                    </div> */}
                    {/* <!-- gallery-more style end --> */}
                </div>
            </section>
        </PhotoProvider>
        
    );
};

export default ElementaryGallery;