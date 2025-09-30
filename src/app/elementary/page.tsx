import ElementaryMain from '@/components/elementary/ElementaryMain';
import Wrapper from '@/layout/DefaultWrapper';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
    title: "Elementary - Education in principles and values",
};

const Elementary = () => {
    return (
        
        <Wrapper>
            <main>
                <ElementaryMain />
            </main>
        </Wrapper>
        
    );
};

export default Elementary;