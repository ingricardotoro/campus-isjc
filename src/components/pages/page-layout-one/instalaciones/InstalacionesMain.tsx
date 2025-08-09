import React from 'react';

import UniversityCtaSectionCommon from '@/components/common/University-section/UniversityCtaSectionCommon';
import CampusAboutArea from '../../page-layout-two/campus/CampusAboutArea';
import CampusIntroArea from '../../page-layout-two/campus/CampusIntroArea';
import CampusVirtualTourArea from '../../page-layout-two/campus/CampusVirtualTourArea';
import CampusLocationArea from '../../page-layout-two/campus/CampusLocationArea';
import CampusGalleryArea from '../../page-layout-two/campus/CampusGalleryArea';
import CampusInfrastructureArea from '../../page-layout-two/campus/CampusInfustructureArea';
import BreadcrumbsInstalaciones from '@/components/common/Breadcrumb/breadcrumbsInstalaciones';

const InstalacionesMain = () => {
    return (
        <>
            <BreadcrumbsInstalaciones breadcrumbTwoTitle='Instalaciones'/>
            <CampusAboutArea />
            <CampusIntroArea />
            {/* <CampusInfrastructureArea /> */}
            <CampusVirtualTourArea />
            <CampusLocationArea />
            <CampusGalleryArea />
            <UniversityCtaSectionCommon />
        </>
    );
};

export default InstalacionesMain;