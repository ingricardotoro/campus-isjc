import React from 'react';
import Breadcrumbs from '@/components/common/Breadcrumb/Breadcrumbs';
import TermsConditionArea from './TermsConditionArea';
import ContactAddressArea from '../contact-us/ContactAddressArea';

const TermsConditionsMain = () => {
    return (
        <>
            <Breadcrumbs breadcrumbTitle='Proceso de Matrícula'/>
            <TermsConditionArea />
            <ContactAddressArea />
        </>
    );
};

export default TermsConditionsMain;