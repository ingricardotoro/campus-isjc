import React from 'react';
import BannerSectionOne from './BannerSectionOne';
import CourseFeatureArea from './CourseFeatureArea';
import CourseCatagory from './CourseCatagory';
import CourseAboutAreaE from './CourseAboutAreaE';
import ElementaryGallery from './ElementaryGallery';
import TestimonialElementary from './TestimonialElementary';
import SpecialClassesElementary from './SpecialClassesElementary';
import UniversityBrandSection from '../university/UniversityBrandSection';
import TestimonialParentsElementary from './TestimonialParentsElementary';

const ElementaryMain = () => {
    return (
        <>
            <BannerSectionOne />
            <CourseFeatureArea />
            <CourseCatagory />
            <CourseAboutAreaE />
           {/*  <OnlineCourseArea /> 
            <CoursePricingPlanArea />*/}
            <ElementaryGallery />
            <TestimonialElementary />
           {/*  <OnlineCourseInstructor />
            <CourseCounterArea /> */}
            <UniversityBrandSection />
            <SpecialClassesElementary />
             {/*<CourseBlogArea />
            <CourseCareerArea /> */}
            <TestimonialParentsElementary />
        </>
    );
};

export default ElementaryMain;