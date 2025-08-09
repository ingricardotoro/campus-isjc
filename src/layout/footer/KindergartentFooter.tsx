import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import logoWhite from '../../../public/assets/images/logo/logo_isj_2.png';
//import Logo from '../../../public/assets/images/logo/logo.png';
import { getCurrentYear } from '@/utils/dateUtils';
interface ISubFooter {
    href: string,
    label: string
}
interface FooterWidgetProps {
    title: string;
    links: ISubFooter[];
}

const FooterWidget: React.FC<FooterWidgetProps> = ({ title, links }) => (
    <div className="bd-footer-widget">
        <h6 className="bd-footer-widget-title has-color-off">{title}</h6>
        <div className="bd-footer-widget-links has-white">
            <ul>
                {links.map((link, index) => (
                    <li key={index} className="underline-two">
                        <Link href={link.href}>{link.label}</Link>
                    </li>
                ))}
            </ul>
        </div>
    </div>
);

const ContactInfo = () => (
    <div className="bd-footer-widget">
        <h6 className="bd-footer-widget-title has-color-off">Contáctanos</h6>
        <div className="bd-footer-widget-content">
            <div className="bd-footer-widget-contact-info mb-25">
                <div className="bd-footer-widget-contact-item has-white">
                    <span>Dirección:</span>
                    <Link href="https://maps.app.goo.gl/J5zkKhJxy6R8C5dS8"> La campaña, Tegucigalpa, Hn</Link>
                </div>
                <div className="bd-footer-widget-contact-item has-white">
                    <span>Telefónos:</span>
                    <Link href="#">(+504) 2236-5298</Link>
                </div>
                <div className="bd-footer-widget-contact-item has-white">
                    <span>WhatsApp:</span>
                    <Link href="#">(+504) 9439-2201</Link>
                </div>
                <div className="bd-footer-widget-contact-item has-white">
                    <span>Correo:</span>
                    <Link href="mailto:istudy@mail.com"> info@sanjosedelcarmen.edu.hn</Link>
                </div>
                
                
            </div>
            <div className="bd-footer-social">
                <div className='theme-social secondary'>
                    <ul className="social-icon-list">
                        <li><Link className="facebook" href="https://www.facebook.com/" target="_blank"><i className="fa-brands fa-facebook-f"></i></Link> </li>
                       {/*  <li><Link href="https://x.com/" target="_blank"><i className="fa-brands fa-x-twitter"></i></Link></li>
                        <li><Link href="https://www.linkedin.com/feed/" target="_blank"><i className="fa-brands fa-linkedin-in"></i></Link></li>
                        <li><Link href="https://www.instagram.com/" target="_blank"><i className="fa-brands fa-instagram"></i></Link></li>
                        <li><Link href="https://www.behance.net/" target="_blank"><i className="fa-brands fa-behance"></i></Link></li> */}
                    </ul>
                </div>
            </div>
        </div>
    </div>
);
 
const KindergartenFooter = () => {
    const navigationLinks = [
        { label: 'inicio', href: '/' },
        { label: 'Historia', href: '/hisoria' },
        { label: 'Misión y Visión', href: '/mision-vision' },
        { label: 'Proyecto Carmelitano', href: '/#' },
        { label: 'Instalaciones', href: '/instalaciones' },
        { label: 'Calendarización', href: '/calendarizacion' },
    ];

    const quickLinks = [
        { label: 'Contáctanos', href: '/contactanos' },
        { label: 'Matrícula', href: '/matricula' },
        { label: 'Pre - Básica', href: '/prebasica' },
        { label: 'Básica', href: '/basica' },
        { label: 'Media', href: '/media' },
        { label: 'Empleo', href: '/empleo' },
    ];

    // const programs = [
    //     { href: "/kindergarten-program-details", label: "Play School" },
    //     { href: "/kindergarten-program-details", label: "Nursery" },
    //     { href: "/kindergarten-program-details", label: "Senior Kg" },
    //     { href: "/kindergarten-program-details", label: "Junior Kg" },
    //     { href: "/kindergarten-program-details", label: "Day Care" }
    // ];

    return (
        <footer>
            <div className="bd-footer-wave p-relative fix theme-bg">
                <div className="bd-wave-wrapper">
                    <div className="bd-wave"></div>
                    <div className="bd-wave"></div>
                </div>
                <div className="container">
                    <div className="bd-footer-top section-space-small">
                        <div className="row gy-30 justify-content-between">
                            <div className="col-lg-8">
                                <div className="bd-footer-top-widget">
                                    <div className="bd-footer-logo mb-15">
                                        <Link href="index">
                                            <Image src={logoWhite} alt="logo" />
                                        </Link>
                                    </div>
                                    <p className="bd-footer-widget-description light-color">
                                       Comprometidos con brindar una educación transformadora, preparando a los estudiantes con el conocimiento, las habilidades y los valores esenciales para el éxito a lo largo de su vida profesional.
                                    </p>
                                </div>
                            </div>
                            <div className="col-lg-4">
                                <div className="bd-cta-content">
                                   
                                     <div className="bd-section-title-wrapper mb-30">
                                        <h5 className="bd-section-title white-text">Agenda una visita</h5>
                                    </div> 
                                    <div className="bd-newsletter-input">
                                        <Link className="bd-btn btn-outline-border-secondary" href="/contactanos">Contáctanos</Link>
                                    </div> 
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bd-footer-area ">
                        <div className="row gy-30 justify-content-between">
                            <div className="col-lg-3 col-md-6 col-sm-6">
                                <FooterWidget title="Navigation" links={navigationLinks} />
                            </div>
                            <div className="col-lg-3 col-md-6 col-sm-6">
                                <FooterWidget title="Áreas y Secciones" links={quickLinks} />
                            </div>
                           {/*  <div className="col-lg-3 col-md-6 col-sm-6">
                                <FooterWidget title="Programs" links={programs} />
                            </div> */}
                            <div className="col-lg-3 col-md-6 col-sm-6">
                                <ContactInfo />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bd-footer-copyright-area bd-copyright-bg">
                    <div className="container">
                        <div className="row justify-content-center">
                            <div className="col-xl-8 text-center">
                                <div className='bd-footer-copyright text-center p-relative z-index-11'>
                                    <p className="underline">© Copyright <span>{getCurrentYear()}</span> | Derechos Reservados por ISJC</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default KindergartenFooter;
