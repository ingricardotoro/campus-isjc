"use client"

import { principlesCategories } from '@/data/categories';
import Link from 'next/link';
import React from 'react';
import Image from 'next/image';

const CourseCatagory = () => {
    return (
        <>
            {/* -- category area start -- */}
            <section className="bd-category-area section-space">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-xl-6">
                            <div className="bd-section-wrapper section-title-space text-center">
                                <h2 className="bd-section-title">
                                    <span className="down-mark-line">Valores y Formación</span>
                                </h2>
                            </div>
                        </div>
                    </div>
                    <div className="row gy-30">
                        {principlesCategories.slice(0, 8).map((principio) => (
                            <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6" key={principio.id}>
                                <Link href="/courses" className="bd-category-wrapper style-one wow bdFadeInUp" data-wow-delay=".4s">
                                    <div className="bd-category-item">
                                        <Image src={principio.icon} alt={principio.title} width={48} height={48} />
                                        <div className="bd-category-content">
                                            <h6 className="bd-category-title">{principio.title}</h6>
                                          
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            {/* -- category area end -- */}
        </>
    );
};

export default CourseCatagory;