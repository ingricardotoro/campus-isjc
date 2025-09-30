import instructorsData from '@/data/instructor-data';
import React from 'react';
import testimonialShape from '../../../public/assets/images/testimonial/testimonial-shape-bg.webp';
import Link from 'next/link';
import Image from 'next/image';

const SpecialClassesElementary = () => {
    return (
        <>
            {/* -- instructor area start -- */}
            <div className="bd-instructor-area section-space theme-bg p-relative z-index-11">
                <div className="bd-kinder-bg" style={{ backgroundImage: `url(${testimonialShape.src})` }}></div>
                <div className="bd-kinder-bg-overlay"></div>
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-xl-6 col-lg-6">
                            <div className="bd-section-title-wrapper section-title-space text-center">
                                <span className="bd-section-subtitle secondary">Nuestro Curriculum</span>
                                <h2 className="bd-section-title white-text">Clases Especiales</h2>
                            </div>
                        </div>
                    </div>
                    <div className="row gy-30">
                        {
                            instructorsData.slice(26, 30).map((item) => (
                                <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6" key={item.id}>
                                    <div className="bd-instructor-wrapper style-nine light-color">
                                        <div className="bd-instructor-item">
                                            <div className="bd-instructor-thumb-wrap">
                                                <div className="bd-instructor-thumb">
                                                    <Link href={`/instructor/instructor-details/${item.id}`}><Image style={{width:"100%", height:"auto"}} src={item.image} alt="image" priority/></Link>
                                                </div>
                                               
                                            </div>
                                            <div className="bd-instructor-info">
                                                <h6 className="name underline-two"><Link href={`/instructor/instructor-details/${item.id}`}>{item.name}</Link>
                                                </h6>
                                                <span>{item.title}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>
            {/* -- instructor area end -- */}
        </>
    );
};

export default SpecialClassesElementary;