'use client'
import Image from 'next/image';
import React from 'react';
import campusGalleryOne from "../../../../../public/assets/images/instalaciones/basica.jpg";
import campusGalleryTwo from "../../../../../public/assets/images/instalaciones/basica1.png";
import campusGalleryThree from "../../../../../public/assets/images/instalaciones/basica2.png";
import campusGalleryFour from "../../../../../public/assets/images/instalaciones/basica4.jpg";
import campusGalleryFive from "../../../../../public/assets/images/instalaciones/basica5.jpg";
import campusGallerySix from "../../../../../public/assets/images/instalaciones/basica6.jpg";
import campusGallerySeven from "../../../../../public/assets/images/instalaciones/basica9.jpg";
import campusGalleryEight from "../../../../../public/assets/images/instalaciones/basica10.jpg";

import campusGalleryNine from "../../../../../public/assets/images/instalaciones/cancha.jpg";
import campusGalleryTen from "../../../../../public/assets/images/instalaciones/gimnasio1.jpg";
import campusGallerEleven from "../../../../../public/assets/images/instalaciones/gimnasio2.jpg";
import campusGalleryTwelve from "../../../../../public/assets/images/instalaciones/gimnasio3.jpg";

import campusGalleryThreeteen from "../../../../../public/assets/images/instalaciones/kinder3.png";
import campusGalleryFourteen from "../../../../../public/assets/images/instalaciones/kinder4.png";
import campusGallerFifteen from "../../../../../public/assets/images/instalaciones/kinder5.jpg";
import campusGalleryTSixteen from "../../../../../public/assets/images/instalaciones/media1.png";

import campusGalleryEighteen from "../../../../../public/assets/images/instalaciones/media2.png";
import campusGalleryNinteen from "../../../../../public/assets/images/instalaciones/media3.png";
import campusGallerTwenty from "../../../../../public/assets/images/instalaciones/patio.jpg";
import campusGalleryTwentyOne from "../../../../../public/assets/images/instalaciones/patio2.jpg";

import campusGalleryTwentyTwo from "../../../../../public/assets/images/instalaciones/patio3.jpg";
import campusGalleryTwentyThree from "../../../../../public/assets/images/instalaciones/poli1.jpg";
import campusGalleryTwentyFour from "../../../../../public/assets/images/instalaciones/poli2.jpg";
import campusGalleryTwentyFive from "../../../../../public/assets/images/instalaciones/polideportivo.jpg";

import campusGalleryTwentySix from "../../../../../public/assets/images/instalaciones/retiro1.jpg";
import campusGalleryTwentySeven from "../../../../../public/assets/images/instalaciones/retiro2.jpg";
import campusGalleryTwentyEight from "../../../../../public/assets/images/instalaciones/salon.jpg";
import campusGalleryTwentyNine from "../../../../../public/assets/images/instalaciones/secundaria2.jpg";

import { PhotoProvider, PhotoView } from 'react-photo-view';
//import Link from 'next/link';

const CampusGalleryArea = () => {
    // Image data array
    const galleryData = [
        { img: campusGalleryOne, text:"Edificio Primaria" },
        { img: campusGalleryTwo, text:"Cancha de Primaria" },
        { img: campusGalleryThree, text:"Cancha de Primaria" },
        { img: campusGalleryFour, text:"Área de Educ. Física" },
        { img: campusGallerySix, text:"Aula de Primaria" },
        { img: campusGalleryFive, text:"Patio superior" },
        { img: campusGallerySeven, text:"Patio inferior" },
        { img: campusGalleryEight, text:"Aula Primaria" },

        { img: campusGalleryNine, text:"Cancha de Secundaria" },
        { img: campusGalleryTen, text:"Gimnasio General" },
        { img: campusGallerEleven, text:"Gimnasio General" },
        { img: campusGalleryTwelve, text:"Gimnasio" },

        { img: campusGalleryThreeteen, text:"Cancha Pre-Básica" },
        { img: campusGalleryFourteen, text:"Patio Pre-Básica" },
        { img: campusGallerFifteen, text:"Patio Pre-Básica" },
        { img: campusGalleryTSixteen, text:"Pasillos Secundaria" },

        { img: campusGalleryEighteen, text:"Patio Secundaria" },
        { img: campusGalleryNinteen, text:"Patio Secundaria" },
        { img: campusGallerTwenty, text:"Primaria" },
        { img: campusGalleryTwentyOne, text:"Primaria" },

        { img: campusGalleryTwentyTwo, text:"Primaria" },
        { img: campusGalleryTwentyThree, text:"Polideportivo" },
        { img: campusGalleryTwentyFour, text:"Polideportivo" },
        { img: campusGalleryTwentyFive, text:"Polideportivo" },

        { img: campusGalleryTwentySix, text:"Retiros" },
        { img: campusGalleryTwentySeven, text:"Areas Verdes" },
        { img: campusGalleryTwentyEight, text:"Salon Primaria" },
        { img: campusGalleryTwentyNine, text:"Secundaria" },
    ];
    return (
        
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

export default CampusGalleryArea;