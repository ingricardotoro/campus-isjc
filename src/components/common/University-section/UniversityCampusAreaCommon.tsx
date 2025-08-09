import AcademicBuildingSvg from '@/svg/campus/AcademicBuildingSvg';
import ArtsSvg from '@/svg/campus/ArtsSvg';
import LibrariesSvg from '@/svg/campus/LibrariesSvg';
import Link from 'next/link';
import React from 'react';
//image
import prebasica from '../../../../public/assets/images/campus/kinder4.jpg';
import primaria from '../../../../public/assets/images/campus/primaria6.jpg';
import secundaria from '../../../../public/assets/images/campus/secundaria3.jpg';


import Image from 'next/image';

const UniversityCampusAreaCommon = () => {
    // Define campus data
    const campusItems = [
        {
            id: 1,
            title: 'Pre - Básica',
            image: prebasica,
            SvgComponent: ArtsSvg,
        },
        {
            id: 2,
            title: 'Primaria 1 - 6',
            image: primaria,
            SvgComponent: LibrariesSvg,
        },
        {
            id: 3,
            title: 'Secundaria 7 -11',
            image: secundaria,
            SvgComponent: AcademicBuildingSvg,
        },
    ];

    return (
        <>
            {/* -- campus area start -- */}
            <section className="bd-campus-area section-space">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-xl-6">
                            <div className="bd-section-wrapper section-title-space text-center">
                                <span className="bd-section-subtitle">Nuestras Modalidades</span>
                                <h2 className="bd-section-title mb-20">
                                    Explora las <span className="down-mark-line">áreas</span> Educativas
                                </h2>
                            </div>
                        </div>
                    </div>
                    <div className="row g-30">
                        {/* Render campus items dynamically */}
                        {campusItems.map((item) => (
                            <div className="col-xl-4 col-lg-4 col-md-6" key={item.id}>
                                <div className="bd-campus-wrapper style-one">
                                    <div className="bd-campus-item">
                                        <div className="bd-campus-thumb2">
                                            <Link href="/campus">
                                                <Image src={item.image} priority style={{ width: "100%", height: "auto" }} alt={item.title} />
                                            </Link>
                                        </div>
                                        <div className="bd-campus-content">
                                            <div className="bd-campus-info">
                                                <h5 className="bd-campus-title underline">
                                                    <Link href="/campus">{item.title}</Link>
                                                </h5>
                                                <div className="bd-campus-btn underline">
                                                    <Link href="/campus">Ver mas actividades</Link>
                                                </div>
                                            </div>
                                            <div className="bd-campus-icon">
                                                <item.SvgComponent />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            {/* -- campus area end -- */}
        </>
    );
};

export default UniversityCampusAreaCommon;
