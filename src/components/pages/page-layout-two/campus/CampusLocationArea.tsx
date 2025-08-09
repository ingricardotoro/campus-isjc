import React from 'react';

const CampusLocationArea = () => {
    return (
        <>
            <section className="bd-location-area section-space-bottom">
                <div className="container">
                    <div className="row">
                        <div className="col-xl-12">
                            <div className="bd-section-title-wrapper section-title-space">
                                <h3 className="bd-section-title bottom-line">Nuestra Ubicación</h3>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-xl-12">
                            <div className="bd-campus-view">
                                <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3869.4718041013916!2d-87.18759439657286!3d14.108328692941841!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8f6fa2e07d19f023%3A0x36398b8f40a6aab4!2sInstituto%20San%20Jos%C3%A9%20del%20Carmen!5e0!3m2!1ses!2shn!4v1754105500787!5m2!1ses!2shn" width="600" height="400" style={{border: '0'}} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default CampusLocationArea;