import Image from 'next/image';
import React from 'react';

import testimonialThumb from '../../../public/assets/images/testimonial/kinder4.jpg';
import Link from 'next/link';
import TestimonialQuote from '@/svg/TestimonialQuote';
import elementaryParentsTestimonials from '@/data/elementary-parents-testimonials';

const TestimonialParentsElementary = () => {
    return (
        <>
            {/* -- testimonial area start -- */}
            <section className="bd-testimonial-area section-space">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-xl-6 col-lg-8">
                            <div className="bd-section-title-wrapper section-title-space text-center">
                                <span className="bd-section-subtitle">Testimonios</span>
                                <h2 className="bd-section-title mb-20">Opiniones de Padres de Familia</h2>
                                <p className="bd-section-paragraph">
                                    Descubra por qué las familias eligen nuestra escuela primaria bilingüe para la formación 
                                    integral de sus hijos, donde la excelencia académica se combina con valores cristianos 
                                    y un cuidado personalizado.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="row gy-30">
                        <div className="col-xl-6 col-lg-6">
                            <div className="bd-testimonial-wrapper style-ten">
                                <div className="bd-testimonial-thumb">
                                    <Image src={testimonialThumb} alt="testimonial" />
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-6 col-lg-6">
                            <div className="bd-testimonial-box">
                                {elementaryParentsTestimonials.slice(0, 2).map((testimonial, index) => (
                                    <div key={`parent-testimonial-${testimonial.name}-${index}`} className={`bd-testimonial-wrapper style-ten mb-25`}>
                                        <div className={`bd-testimonial-item ${testimonial.bgClass || ''}`}>
                                            <div className="bd-testimonial-rating rating-spacing-2 mb-30">
                                                {[...Array(5)].map((_, starIndex) => (
                                                    <Link key={`star-${testimonial.name}-${index}-${starIndex}`} href="#"><i className="fa-solid fa-star"></i></Link>
                                                ))}
                                            </div>
                                            <div className="bd-testimonial-content mb-35">
                                                <p>{testimonial.review}</p>
                                            </div>
                                            <div className="bd-testimonial-avatar d-flex-between">
                                                <div className="d-flex align-items-center gap-10">
                                                    <div className="bd-testimonial-avatar-thumb">
                                                        <Image style={{ width: "100%", height: "auto" }} src={testimonial.avatar} alt="avatar" />
                                                    </div>
                                                    <h6 className="name mb-0">{testimonial.name}</h6>
                                                </div>
                                                <div className="bd-testimonial-quote d-none d-sm-block clr-2">
                                                    <TestimonialQuote />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* -- testimonial area end -- */}
        </>
    );
};

export default TestimonialParentsElementary;
