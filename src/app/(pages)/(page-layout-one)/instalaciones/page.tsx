import InstalacionesMain from '@/components/pages/page-layout-one/instalaciones/InstalacionesMain';
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
                    <InstalacionesMain />
                </main>
            </Wrapper>
        </>
    );
};

export default Instalaciones;