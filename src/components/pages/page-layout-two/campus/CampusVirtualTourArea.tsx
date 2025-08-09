'use client'
import Image from 'next/image';
import React from 'react';
import videoBg from '../../../../../public/assets/images/bg/polideportivo44.png';
import { useVideoModal } from '@/contextApi/VideoProvider';

const CampusVirtualTourArea = () => {
    const { playVideo } = useVideoModal();
    return (
        <>
            <section className="bd-campus-virtual-tour-area section-space-bottom">
                <div className="container">
                    <div className="row">
                        <div className="col-xl-12">
                            <div className="bd-section-title-wrapper section-title-space">
                                <h3 className="bd-section-title bottom-line">Polideportivo San José del Carmen</h3>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="bd-campus-virtual-tour-wrapper p-relative">
                            <div className="bd-campus-virtual-tour-thumb"><Image src={videoBg} style={{ width: '100%', height: 'auto' }} alt="" />
                            </div>
                            <button type='button' onClick={() => playVideo("-S0vuRBOKUo", "youtube")} className="bd-video-btn popup-video has-bg pos-center">
                                <span className="icon"><i className="fa-solid fa-play"></i></span>
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default CampusVirtualTourArea;