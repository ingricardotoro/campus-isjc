import React from 'react';
import BannerSectionOne from './BannerSectionOne';
import CourseFeatureArea from './CourseFeatureArea';
import CourseCatagory from './CourseCatagory';
import CourseAboutAreaHS from './CourseAboutAreaHS';
import HighSchoolGallery from './HighSchoolGallery';
import TestimonialHighSchool from './TestimonialHighSchool';
import SpecialClassesHighSchool from './SpecialClassesHighSchool';
import UniversityBrandSection from '../university/UniversityBrandSection';
import TestimonialParentsHighSchool from './TestimonialParentsHighSchool';

const HighSchoolMain = () => {
    return (
        <>
            <BannerSectionOne />
            <CourseFeatureArea />
            <CourseCatagory />
            <CourseAboutAreaHS />
            <HighSchoolGallery />
            <TestimonialHighSchool />
            <UniversityBrandSection />
            <SpecialClassesHighSchool />
            <TestimonialParentsHighSchool />
        </>
    );
};

export default HighSchoolMain;