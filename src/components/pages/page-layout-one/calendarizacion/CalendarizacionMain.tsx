import UniversityCtaSectionCommon from '@/components/common/University-section/UniversityCtaSectionCommon';
import React from 'react';
import AcademicCalenderArea from '../../page-layout-two/academic-calendar/AcademicCalenderArea';
import BreadcrumbsCalendarizacion from '@/components/common/Breadcrumb/BreadcrumsCalendarizacion';
import CalendarioAboutArea from './calendarioAboutArea';


const CalendarizacionMain = () => {
    return (
        <>
         <BreadcrumbsCalendarizacion breadcrumbTwoTitle='Calendarización'/>   
         <CalendarioAboutArea />
         <AcademicCalenderArea />
         <UniversityCtaSectionCommon />
        </>
    );
};

export default CalendarizacionMain;