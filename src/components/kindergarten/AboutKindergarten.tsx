"use client"
import Image from 'next/image';
import React from 'react';
import AboutThumb from '../../../public/assets/images/about/about-thumb-052.webp';
import AboutThumbSmall from '../../../public/assets/images/about/about-thumb-small-022.webp';
import textShape from '../../../public/assets/images/shape/text-shape.webp';
import waveShape from '../../../public/assets/images/shape/wave-shape.webp';
import orangeShape from '../../../public/assets/images/shape/orange-shape.webp';
import Link from 'next/link';
import MouseMoveEffect from '../common/MouseMoveEffect';
import { useVideoModal } from '@/contextApi/VideoProvider';

const AboutKindergarten = () => {
  // Call the custom hook here
  const { playVideo } = useVideoModal();
  MouseMoveEffect();

  const promotionData = [
    { number: '60+', text: ['Años de', 'experiencia'] },
    { number: '1K+', text: ['Estudiantes', 'Cada año'] },
    { number: '50+', text: ['Promociones', 'Graduadas'] },
  ];

  const features = [
    "Reconocemos la inteligencia única de cada niño y les brindamos nuestro cuidado.",
    "Los maestros marcan la diferencia en la vida de tu hijo.",
  ];

  return (
    <>
      {/* -- about area start -- */}
      <section className="bd-about-area theme-bg-05 section-space">
        <div className="container">
          <div className="row g-30 align-items-center">
            <div className="col-xl-6 col-lg-6 col-md-12">
              <div className="bd-about-wrapper style-four">
                <div className="bd-about-thumb-inner">
                  <div className="bd-about-thumb-wrapper">
                    <div className="bd-about-thumb has-radius">
                      <Image src={AboutThumb} style={{ width: "auto", height: "auto" }} alt="About Image" />
                    </div>
                    <div className="bd-about-thumb has-radius has-small">
                      <Image style={{ width: "100%", height: "auto" }} src={AboutThumbSmall} alt="Small Image" />
                    </div>
                    <div className="bd-about-shape-wrapper d-none d-md-block" />
                    <div className="bd-about-shape has-shape-one">
                      <Image src={textShape} alt="Text Shape" />
                    </div>
                    <div className="bd-about-shape has-shape-two shape-move">
                      <Image style={{ width: "100%", height: "auto" }} src={waveShape} alt="Wave Shape" />
                    </div>
                    <div className="bd-about-shape has-shape-three d-none d-xl-block">
                      <Image style={{ width: "100%", height: "auto" }} src={orangeShape} alt="Orange Shape" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-6 col-lg-6 col-md-12">
              <div className="bd-about-content-wrapper">
                <div className="bd-section-title-wrapper section-title-space">
                  <span className="bd-section-subtitle">Área de Pre-Básica</span>
                  <h2 className="bd-section-title mb-20">Lo mejor para tus hijos</h2>
                  <p className="bd-section-paragraph">Dar el primer paso en la educación pre-básica es regalarle a tus hijos un mundo de posibilidades. Anímate a iniciar este hermoso camino: juntos, construiremos las bases para que crezcan seguros, curiosos y llenos de sueños. ¡El mejor futuro comienza hoy!</p>
               

                  {/* Promotion counters */}
                  <div className="bd-promotion-counter-wrapper mb-40">
                    {promotionData.map(({ number, text }, index) => (
                      <div className="bd-promotion-counter" key={index}>
                        <div className="bd-promotion-counter-number">
                          <p><span className="counter">{number}</span></p>
                        </div>
                        <div className="bd-promotion-counter-text">
                          {text.map((line, idx) => (
                            <span key={idx}>{line}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Feature list */}
                  <div className="bd-about-feature-list">
                    <ul>
                      {features.map((feature, index) => (
                        <li key={index}>
                          <i className="fa-regular fa-check"></i> {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Buttons */}
                <div className="bd-about-btn d-flex-items gap-30">
                   <Link className="bd-btn btn-primary" href="/contactanos">Contáctanos</Link>
                  <button type='button' onClick={() => playVideo("2XsdnFbcZpU", "youtube")} className="bd-video-btn popup-video">
                    <span className="icon text-xxs-none"><i className="fa-solid fa-play"></i></span>
                    Conoce nuestras áreas
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* -- about area end -- */}
    </>
  );
};

export default AboutKindergarten;
