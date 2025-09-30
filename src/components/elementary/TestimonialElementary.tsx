"use client"
import React from 'react';
import Image from 'next/image';
import testimonialBg from "../../../public/assets/images/bg/basica3.png";
import testimonialQuoteIcon from "../../../public/assets/images/shape/testimonial-quote-icon.webp";
import elementaryTestimonials from '@/data/elementary-testimonials';
//swiper
import { Navigation, Autoplay, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import GetRating from '@/components/common/GetRating';
import { useVideoModal } from '@/contextApi/VideoProvider';

const TestimonialElementary = () => {
    const { playVideo } = useVideoModal();
    return (
        <>
            {/* -- testimonial area start -- */}
            <section className="bd-testimonial-area p-relative theme-bg">
                <div className="bd-testimonial-video" style={{ backgroundImage: `url(${testimonialBg.src})` }}>
                    <div className="bd-testimonial-video-btn animation-two">
                        <button className="bd-play-btn popup-video" type='button' onClick={() => playVideo("IBrTQ2nziYY", "youtube")}><i
                            className="fa-regular fa-play"></i></button>
                    </div>
                </div>
                <div className="bd-testimonial-bg-two d-none d-lg-block bd-noise-bg"></div>
                <div className="container">
                    <div className="row justify-content-end align-items-center">
                        <div className="col-xxl-7 col-xl-6 col-lg-6">
                            <div className="bd-testimonial-wrap section-space">
                                <div className="bd-testimonial-shape-quote">
                                    <Image src={testimonialQuoteIcon} style={{ width: "100%", height: "auto" }} alt="shape" />
                                </div>
                                <div className="bd-section-title-wrapper section-title-space">
                                    <span className="bd-section-subtitle text-secondary">TESTIMONIOS</span>
                                    <h2 className="bd-section-title white-text mb-20">Lo que Dicen Nuestros <span
                                        className="down-mark-line">Estudiantes</span></h2>
                                </div>
                                <div className="swiper testimonialActiveFour">
                                    <Swiper
                                        modules={[Navigation, Autoplay, Pagination]}
                                        spaceBetween={30}
                                        observeParents={true}
                                        observer={true}
                                        loop={true}
                                        speed={1200}
                                        autoplay={{
                                            delay: 9500,
                                        }}
                                        pagination={{
                                            el: '.bd-testimonial-pagination',
                                            clickable: true,
                                        }}
                                        navigation={{
                                            nextEl: ".testimonial-navigation-next",
                                            prevEl: ".testimonial-navigation-prev",
                                        }}
                                        breakpoints={{
                                            '1200': {
                                                slidesPerView: 1,
                                            },
                                            '992': {
                                                slidesPerView: 1,
                                            },
                                            '768': {
                                                slidesPerView: 1,
                                            },
                                            '576': {
                                                slidesPerView: 1,
                                            },
                                        }}
                                    >
                                        {
                                            elementaryTestimonials.map((item) => (
                                                <SwiperSlide key={item.id}>
                                                    <div className="bd-testimonial-wrapper style-six">
                                                        <div className="bd-testimonial-item">
                                                            <div className="bd-testimonial-rating mb-30">
                                                                <GetRating averageRating={item.rating} />
                                                            </div>
                                                            <div className="bd-testimonial-content mb-55">
                                                                <p>{item.content}</p>
                                                            </div>
                                                            <div className="bd-testimonial-meta d-flex-between">
                                                                <div className="author">
                                                                    <div className="thumb">
                                                                        <Image src={item.avatar} style={{ width: "100%", height: "auto" }} alt="images" />
                                                                    </div>
                                                                    <div className="details">
                                                                        <h6 className="name">{item.name}</h6>
                                                                        {item.designation && <span className="designation">{item.designation}</span>}
                                                                    </div>
                                                                </div>
                                                                <div className="bd-testimonial-quote">
                                                                    <i className="fa-regular fa-quote-right"></i>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </SwiperSlide>
                                            ))
                                        }
                                    </Swiper>
                                </div>
                                {/* -- slider dots pagination -- */}
                                <div className="bd-testimonial-pagination bd-dots-pagination justify-content-start"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* -- testimonial area end -- */}
        </>
    );
};

export default TestimonialElementary;


