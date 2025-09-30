"use client"
import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';
import LogoMain from '../../../public/assets/images/logo/logo.png';
import CommonHeaderMainMenu from './component/MainMenu';
import HeaderSearch from './component/HeaderSearch';
import SidebarCart from '@/components/common/sidebar-cart/SidebarCart';
import SidebarMenu from '../sidebar/SidebarMenu';
import useGlobalContext from '@/hooks/useContexts';

const HighSchoolHeader = () => {
    const { scrollDirection } = useGlobalContext();
    const [openCart, setOpenCart] = useState(false);
    const [openSearchField, setOpenSearchField] = useState<boolean>(false);

    return (
        <>
            {/* -- Header area start -- */}
            <header>
                <div className={`bd-header-area bd-header-transparent ${scrollDirection === "down" ? "bd-sticky" : ""}`}>
                    <div className="bd-header-inner">
                        <div className="bd-header-left">
                            <div className="bd-header-logo">
                                <Link href="/"><Image src={LogoMain} style={{ width: "100%", height: "auto" }} alt="logo" /></Link>
                            </div>
                            <div className="bd-header-menu nav-position-one">
                                <nav className="main-menu bd-mobile-menu-active d-none d-xl-block">
                                    <CommonHeaderMainMenu />
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            {/* -- Header area end --  */}
            {/* header search input */}
            <HeaderSearch setOpenSearchField={setOpenSearchField} openSearchField={openSearchField} />
            {/* sidebar cart start */}
            <SidebarCart openCart={openCart} setOpenCart={setOpenCart} />
            {/* sidebar cart end */}
            {/* sidebar mobile menu */}
            <SidebarMenu />
        </>
    );
};

export default HighSchoolHeader;