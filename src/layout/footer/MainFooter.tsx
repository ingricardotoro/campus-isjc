import { getCurrentYear } from '@/utils/dateUtils';
import Link from 'next/link';
import React, { ReactNode } from 'react';
import Logo from '../../../public/assets/images/logo/logo.png';
import playStore from '../../../public/assets/images/icon/play-store.webp';
import appStore from '../../../public/assets/images/icon/app-store.webp';
import Image from 'next/image';
interface MainFooterProps {
    children?: ReactNode;
};
const MainFooter = ({ children }: MainFooterProps) => {
    return (
        <>
            {/* -- footer area start -- */}
            <footer className="bd-footer-area fix">
                <div className="bd-footer-area-main-content section-space theme-bg-05">
                    <div className="container">
                        <div className="row gy-30 justify-content-between">
                            <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-6 col-sm-12">
                                <div className="bd-footer-widget footer-1-col-1">
                                    <div className="bd-footer-widget-content">
                                        <div className="bd-footer-widget-logo">
                                            <Link href="/">
                                                <Image src={Logo} alt="image" priority />
                                            </Link>
                                        </div>
                                         {/*<p className="bd-footer-widget-description">Inspirado en la misión evangelizadora de la iglesia católica y el carisma propio de la congregación de las Carmelitas de San José, ofrece educación integral y de calidad. </p>
                                        <div className="bd-footer-widget-contact-info">
                                            <div className="bd-footer-widget-contact-item">
                                                <span>Phone:</span>
                                                <Link href="tell:123456789">
                                                    +123-4567-8900</Link>
                                            </div>
                                            <div className="bd-footer-widget-contact-item">
                                                <span>Email:</span>
                                                <Link href="mailto:istudy@mail.com"> istudy@mail.com</Link>
                                            </div>
                                            <div className="bd-footer-widget-contact-item">
                                                <span>Address:</span>
                                                <Link href="#"> 27 Division St, New York</Link>
                                            </div>
                                        </div> */}
                                    </div>
                                </div>
                            </div>
                            {/* Children content section - This part allows dynamic content to be injected into the footer */}
                            {children}
                            <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-8 col-sm-12">
                                <div className="bd-footer-widget footer-1-col-4">
                                    <h6 className="bd-footer-widget-title mb-20">Permacene conéctado</h6>
                                    <div className="bd-footer-from-content mb-20">
                                        <div className="bd-footer-social">
                                        <div className="bd-footer-widget-contact-info">
                                            <div className="bd-footer-widget-contact-item">
                                            <span>Telefónos:</span>
                                                <Link href="#">(+504) 2236-5298</Link>
                                            </div>
                                            <div className="bd-footer-widget-contact-item">
                                            <span>WhatsApp:</span>
                                                <Link href="#">(+504) 9439-2201</Link>
                                            </div>
                                            <div className="bd-footer-widget-contact-item">
                                                <span>Correo:</span>
                                                <Link href="mailto:istudy@mail.com"> info@sanjosedelcarmen.edu.hn</Link>
                                            </div>
                                            <div className="bd-footer-widget-contact-item">
                                                <span>Dirección:</span>
                                                <Link href="https://maps.app.goo.gl/J5zkKhJxy6R8C5dS8"> La campaña, Tegucigalpa, Hn</Link>
                                            </div>
                                            <br />
                                            <div className="bd-footer-widget-contact-item">
                                                <span>Visita nuestro Facebook:</span>
                                                {/* <Link className="facebook" href="https://www.facebook.com/" target="_blank"><i className="fa-brands fa-facebook-f"></i></Link> */}
                                            </div>
                                        </div>
                                            <div className="theme-social social-brand-color">
                                               
                                                <ul className="social-icon-list">
                                                <li><Link className="facebook" href="https://www.facebook.com/" target="_blank"><i className="fa-brands fa-facebook-f"></i></Link> </li>

                                                   {/*  <li><Link className="twitter" href="https://x.com/" target="_blank"><i className="fa-brands fa-x-twitter"></i></Link>
                                                    </li>
                                                    <li><Link className="linkedin" href="https://www.linkedin.com/feed/" target="_blank"><i className="fa-brands fa-linkedin-in"></i></Link>
                                                    </li>
                                                    <li><Link className="instagram" href="https://www.instagram.com/" target="_blank"><i className="fa-brands fa-instagram"></i></Link>
                                                    </li>
                                                    <li><Link className="youtube" href="https://www.youtube.com/"><i className="fa-brands fa-youtube"></i></Link>
                                                    </li> */}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                   {/*  <h6 className="bd-footer-widget-title mb-20">Download App</h6>
                                    <div className="bd-footer-from-content">
                                        <div className="bd-footer-app-btn d-flex align-items-center gap-15">
                                            <Link className="bd-app-btn" href="#"><Image src={playStore} style={{ width: "100%", height: "auto" }} alt="play-store" /></Link>
                                            <Link className="bd-app-btn" href="#"><Image src={appStore} style={{ width: "100%", height: "auto" }} alt="app-store" /></Link>
                                        </div>
                                    </div> */}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bd-footer-copyright-area pt-25 pb-20">
                    <div className="container">
                        <div className="row gy-10 align-items-center justify-content-lg-between justify-content-center">
                            <div className="col-xxl-4 col-xl-5 col-lg-5 col-md-8">
                                <div className="bd-footer-copyright text-lg-start text-center">
                                    <p className="underline">© Copyright <span>{getCurrentYear()}</span> | Derechos Reservados por ISJC</p>
                                </div>
                            </div>
                            <div className="col-xxl-5 col-xl-7 col-lg-7 col-md-12">
                                <div className="bd-footer-copyright-list">
                                    <ul className="justify-content-lg-end justify-content-center">
                                        <li className="underline">! Alabado Sea Cristo !</li>
                                        <li className="underline">Ahora y Siempre</li>
                                        
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
            {/* -- footer area end -- */}
        </>
    );
};

export default MainFooter;