"use client"
// import Breadcrumbs from '@/components/common/Breadcrumb/Breadcrumbs';
import CourseFilter from '@/components/common/course-filtering/CourseFilter';
// import Link from 'next/link';
import React from 'react';
import CourseGridFiveCard from './CourseGridFiveCard';
import coursesData from '@/data/courses/courses-data';
import useGlobalContext from '@/hooks/useContexts';
// import { eventData } from '@/data/events-data';

const CourseGridFiveMainHome = () => {
    const { /* toggleOpen */ } = useGlobalContext();
    return (
        <>
             {/*<Breadcrumbs breadcrumbTitle='Course Grid Style 05' />
            -- course grid area start -- */}
           
            <section className="bd-course-grid-area primary-bg">
            <div className="row justify-content-center">
                    <div className="col-xl-6">
                        <div className="bd-section-wrapper section-title-space text-center">
                            <h2 className="bd-section-title mb-20">Eventos Escolares del <span className="down-mark-line">ISJC</span>
                            </h2>
                        </div>
                    </div>
                </div>
                <div className="container">
                    
                    <CourseFilter
                        onFilterChange={() => { }}
                        sliceLimits={{
                            instructors: 5,
                            levels: 4,
                            priceFilters: 5,
                            categories: 10,
                            languages: 6,
                        }}
                    />
                    {/* -- course grid style -- */}
                    <div className="row g-30">
                            {
                                coursesData.slice(68, 74).map((item, index) => (
                                    <CourseGridFiveCard course={item} key={index} />
                                ))
                            }
                    </div>
                    {/* -- course grid style end -- */}

                    {/* -- course-more style -- */}
                    <div className="bd-course-more-btn d-flex justify-content-center mt-50">
                       {/*  <Link className="bd-btn btn-outline-border-primary" href="#">Ver mas <span className="right-icon"><i
                            className="fa-duotone fa-spinner"></i></span></Link> */}
                    </div>
                    {/* -- course-more style end -- */}
                </div>
            </section>
            {/* -- course grid area end -- */}
        </>
    );
};

export default CourseGridFiveMainHome;