import React from 'react';
// import BreadcrumbThree from '@/components/common/Breadcrumb/BreadcrumbThree';
//import SchoolingWhyChooseAreaCommon from '@/components/common/modern-schooling/SchoolingWhyChooseAreaCommon';
// import ModernSchollingTestimonial from '@/components/sliders/testimonial/ModernSchollingTestimonial';
// import bgImg from '../../../../../public/assets/images/about/sanjosedelcarmen4_lite.png';

//import AboutCtaArea from '@/components/common/about-cta/AboutCtaArea';
import AboutSchoolingMissionArea from '../about-modern-schooling/AboutSchoolingMissionArea';
import AboutSchoolingCoreValueArea from '../about-modern-schooling/AboutSchoolingCoreValueArea';
// import AboutSchoolingBrandArea from '../about-modern-schooling/AboutSchoolingBrandArea';
// import BreadcrumbsTwo from '@/components/common/Breadcrumb/BreadcrumbsTwo';
import BreadcrumbsMV from '@/components/common/Breadcrumb/BreadcrumsMV';
import UniversityBrandSection from '@/components/university/UniversityBrandSection';
import UniversityTestimonialArea from '@/components/sliders/testimonial/UniversityTestimonialArea';
//import AboutSchoolingInstructorArea from '../about-modern-schooling/AboutSchoolingInstructorArea';

const MisionVisionMain = () => {
    return (
        <>
            <BreadcrumbsMV
                breadcrumbTwoTitle='Misión y Visión'
            />
            <AboutSchoolingMissionArea />
            <AboutSchoolingCoreValueArea />
            <UniversityBrandSection />
            <UniversityTestimonialArea />
             {/*<ModernSchollingTestimonial themeBackground={''}/>
            <AboutSchoolingInstructorArea />
            <section className="bd-why-choose-area section-space-bottom fix">
                <SchoolingWhyChooseAreaCommon />
            </section>
            <AboutCtaArea/> */}
        </>
    );
};

export default MisionVisionMain;