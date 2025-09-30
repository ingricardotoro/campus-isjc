import HighSchoolMain from '@/components/highSchool/HighSchoolMain';
import Wrapper from '@/layout/DefaultWrapper';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
    title: "HighSchool - Education in principles and values",
};

const HighSchool = () => {
    return (
        
        <Wrapper>
            <main>
                <HighSchoolMain />
            </main>
        </Wrapper>
        
    );
};

export default HighSchool;