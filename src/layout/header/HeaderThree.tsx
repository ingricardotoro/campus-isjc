"use client"
import Link from 'next/link';
import React, { useState } from 'react';
import headerLogo from "../../../public/assets/images/logo/logo.png";
import Image from 'next/image';
import HeaderSearch from './component/HeaderSearch';
import SidebarCart from '@/components/common/sidebar-cart/SidebarCart';
//import UniversityHeaderMenu from './component/UniversityHeaderMenu';
import UniversitySidebar from '../sidebar/UniversitySidebar';
import useGlobalContext from '@/hooks/useContexts';
//import useCart from '@/hooks/useCart';
import CommonHeaderMainMenu from './component/MainMenu';

const HeaderThree = () => {
    const { scrollDirection } = useGlobalContext();
    const [openCart, setOpenCart] = useState(false)
    //cart quantity
    //const { getCartProductQuantity } = useCart();
    //const TotalCartQuantity = getCartProductQuantity();
    //search functionality
    const [openSearchField, setOpenSearchField] = useState<boolean>(false);
    /* const handleSearchToggle = () => {
        setOpenSearchField(!openSearchField);
    }; */

    return (
        <>
            <header>
                <div className="header-style-two">
                    <div className="bd-header-top style-two">
                        <div className="bd-header-top-left">
                            <ul>
                                <li><Link href="tel:+50422365298"><span><i className="fa-solid fa-phone-volume"></i></span>(+504) 2236-5298</Link></li>
                                <li><Link href="tel:+5049439-2201"><span><i className="fa-solid fa-comment"></i></span>(+504) 9439-2201</Link></li>
                                <li><Link href="mailto:info@sanjosedelcarmen.edu.hn"><span><i
                                    className="fa-sharp fa-light fa-envelope"></i></span>info@sanjosedelcarmen.edu.hn</Link></li>
                            </ul>
                        </div>
                        <div className="bd-header-top-right text-md-end">
                            <Link href="https://maps.app.goo.gl/J5zkKhJxy6R8C5dS8" target="blank"><span><i className="fa-sharp fa-regular fa-location-dot"></i></span>La Campaña, Tegucigalpa, HN</Link>
                        </div>
                    </div>
                    <div className={`bd-header-area ${scrollDirection === "down" ? "bd-sticky" : ""}`} >
                        <div className="bd-header-inner" style={{display:"flex", justifyContent:"space-around"}}>
                            <div className="bd-header-left">
                                <div className="bd-header-logo logo-white">
                                    <Link href="/"><Image src={headerLogo} style={{ width: "auto", height: "auto" }} priority alt="logo" /></Link>
                                </div>
                                <div className="bd-header-logo logo-black">
                                    <Link href="/"><Image src={headerLogo} style={{ width: "auto", height: "auto" }} priority alt="logo" /></Link>
                                </div>
                            </div>
                            <div className="bd-header-menu">
                                <nav className="main-menu bd-mobile-menu-active d-none d-xl-block">
                                    {/* <UniversityHeaderMenu /> */}
                                    <CommonHeaderMainMenu />
                                </nav>
                            </div>
                            <div className="bd-header-right">
                               
                                <div className="bd-header-sign-btn">
                                    <Link className="bd-btn btn-outline-border-primary h-40px" href="/contactanos">Contáctanos</Link>
                                </div>
                               
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            {/* header search input */}
            <HeaderSearch setOpenSearchField={setOpenSearchField} openSearchField={openSearchField} />

            {/* sidebar cart start */}
            <SidebarCart openCart={openCart} setOpenCart={setOpenCart} />
            {/* sidebar cart end */}
            {/* sidebar mobile menu */}
            <UniversitySidebar />
        </>
    );
};

export default HeaderThree;