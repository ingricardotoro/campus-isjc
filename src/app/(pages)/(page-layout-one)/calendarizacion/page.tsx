import CalendarizacionMain from '@/components/pages/page-layout-one/calendarizacion/CalendarizacionMain';
import Wrapper from '@/layout/DefaultWrapper';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
    title: "History - Education & Online Courses React NextJs Template",
};

const Instalaciones = () => {
    return (
        <>
            <Wrapper>
                <main>
                    <CalendarizacionMain />
                </main>
            </Wrapper>
        </>
    );
};

export default Instalaciones;