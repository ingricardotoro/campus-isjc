import Image from 'next/image';
import React from 'react';
import contactThumb from '../../../../../public/assets/images/contact/contact-thumb2.webp';
import ContactForm from '@/form/ContactForm';
import Link from 'next/link';

const ContactFormArea = () => {
    return (
        
        <section className="bd-contact-form-area section-space">
            <div className="container">
                <div className="row gy-30 justify-content-between align-items-center">
                    <div className="col-xl-6 col-lg-6">
                        <div className="bd-contact-form-wrapper">
                            <div className="bd-section-title-wrapper section-title-space">
                                <h2 className="bd-section-title mb-20">Escríbenos para más información</h2>
                                <p className="bd-section-paragraph">Nuestro amable equipo estaría encantado de saber de ti.</p> 
                            </div>
                            <div className="bd-contact-form">
                                <ContactForm />
                            </div>

                            
                        </div>

                        <div className="container" style={{marginTop: '20px', textAlign: 'center'}}>
                            <p ><Link href="/jobs">Área de Empleo</Link></p>
                        </div>
                    </div>
                    <div  className="col-xl-6 col-lg-6 section-space">
                        <div className="bd-contact-form-thumb"><Image src={contactThumb} priority style={{ width: '100%', height: '100%' }} alt="images" /></div>
                    </div>
                </div>
            </div>
        </section>
        
    );
};

export default ContactFormArea;