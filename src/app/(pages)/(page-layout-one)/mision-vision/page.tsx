import MissionVisionMain from '@/components/pages/page-layout-one/mision-vision/MisionVisionMain';
import Wrapper from '@/layout/DefaultWrapper';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
    title: "Misión y Visión - Educación & Cursos Online",
};

const MissionVision = () => {
    return (
        <>
            <Wrapper>
                <main>
                    <MissionVisionMain />
                </main>
            </Wrapper>
        </>
    );
};

export default MissionVision; 