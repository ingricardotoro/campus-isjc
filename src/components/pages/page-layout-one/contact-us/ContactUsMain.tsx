import React from 'react';
import BreadcrumbsContact from '../../../common/Breadcrumb/BreadcrumbContact';
import ContactFormArea from './ContactFormArea';
import ContactAddressArea from './ContactAddressArea';

const ContactUsMain = () => {
    return (
        <>
            <BreadcrumbsContact breadcrumbTitle='Área de Contacto' />
            <ContactAddressArea />
            <ContactFormArea />
        </>
    );
};

export default ContactUsMain;