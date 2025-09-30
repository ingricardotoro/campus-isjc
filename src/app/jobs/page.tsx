import JobsMain from '@/components/pages/JobsMain';
import Wrapper from '@/layout/DefaultWrapper';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
    title: "Jobs - Find Your Dream Job",
};

const Jobs = () => {
    return (
        
        <Wrapper>
            <main>
                <JobsMain />
            </main>
        </Wrapper>
        
    );
};

export default Jobs;