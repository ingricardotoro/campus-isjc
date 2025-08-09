import Link from 'next/link';
import React from 'react';

const HistoryArea = () => {
    return (
        <>
            <section className="bd-promotion-area section-space">
                <div className="container">
                    <div className="row g-30 justify-content-between align-items-center">
                        <div className="col-xl-6 col-lg-6 col-md-6">
                            <div className="bd-section-title-wrapper">
                                <h2 className="bd-section-title mb-20"><span
                                        className="down-mark-line">Historia</span> del Instituto San José del Carmen</h2>
                                <p className="bd-section-paragraph">Durante más de seis décadas hemos formado profesionales exitosos, guiados por firmes valores morales y espirituales. </p>
                            </div>
                        </div>
                        <div className="col-xl-6 col-lg-6 col-md-6">
                            <div className="bd-history-centuries-list list-none">
                                <ul>
                                    <li className="underline"><Link href="#1600s">1963: La fundacion del ISJC</Link></li>
                                    <li className="underline"><Link href="#1700s">1970: ISJC role in early education</Link>
                                    </li>
                                    <li className="underline"><Link href="#1800s">1980: A period of growth and expansion</Link></li>
                                    <li className="underline"><Link href="#2000s">1990: A new era of innovation and discovery</Link></li>
                                    <li className="underline"><Link href="#2000s">2000: A new era of innovation and discovery</Link></li>
                                    <li className="underline"><Link href="#2000s">2010: A new era of innovation and discovery</Link></li>
                                    <li className="underline"><Link href="#2000s">2020: A new era of innovation and discovery</Link></li>
                                    
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default HistoryArea;