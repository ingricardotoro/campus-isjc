import React from 'react';
import UniversityBannerSection from './UniversityBannerSection';
import UniversityFeatureSection from './UniversityFeatureSection';
import UniversityCounterSection from './UniversityCounterSection';
import UniversityProgrammeArea from './UniversityProgrammeArea';
import UniversityBrandSection from './UniversityBrandSection';
import UniversityTestimonialArea from '../sliders/testimonial/UniversityTestimonialArea';
import UniversityVideoSection from './UniversityVideoSection';
//import UniversityBlogSection from './UniversityBlogSection';
import UniversityAboutSectionCommon from '../common/University-section/UniversityAboutSectionCommon';
import UniversityWhyChooseAreaCommon from '../common/University-section/UniversityWhyChooseAreaCommon';
import UniversityEventSectionCommon from '../common/University-section/UniversityEventSectionCommon';
import UniversityCampusAreaCommon from '../common/University-section/UniversityCampusAreaCommon';
import UniversityCtaSectionCommon from '../common/University-section/UniversityCtaSectionCommon';
//import EventMain from '../pages/page-layout-three/event/EventMain';
//import CourseGridFiveMainHome from '../courses-inner-pages/courses-grid-five/CourseGridFiveMainHome';
import AcademyBlogArea from '../language-academy/AcademyBlogArea';

const UniversityMain = () => {
    return (
        <>
            <UniversityBannerSection />
            <UniversityFeatureSection />
            <UniversityAboutSectionCommon />
            <UniversityCounterSection />
            <UniversityWhyChooseAreaCommon />
            {/* <UniversityProgrammeArea /> 
            <CourseGridFiveMainHome />*/}
            <AcademyBlogArea />
            {/* <EventMain /> */}
            <section className="bd-event-area section-space p-relative">
                <UniversityEventSectionCommon />
            </section>
            <UniversityBrandSection />
            <UniversityCampusAreaCommon />
            <UniversityTestimonialArea />
            <UniversityVideoSection />
       {/*      <UniversityBlogSection /> */}
            <UniversityCtaSectionCommon />
        </>
    );
};

export default UniversityMain;