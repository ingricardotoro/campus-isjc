import React from "react";
import Image, { StaticImageData } from "next/image";
import circleImg from "../../../public/assets/images/shape/about-solid-circle.webp";
import bookShapeImg from "../../../public/assets/images/shape/about-book-shape.webp";
import aboutWaveShape from "../../../public/assets/images/shape/about-wave-shape.webp";
import aboutCircle from "../../../public/assets/images/shape/about-circle.webp";
import aboutThumb1 from "../../../public/assets/images/about/valores2.jpg"; // Usando la misma imagen por ahora
import aboutThumbSmall from "../../../public/assets/images/about/elecciones3.jpg"; // Usando la misma imagen por ahora
import dotShape from "../../../public/assets/images/shape/dot-shape-01.webp";

interface AboutFeatureProps {
  iconClass: string;
  title: string;
  description: string;
}

const AboutFeatureItem: React.FC<AboutFeatureProps> = ({
  iconClass,
  title,
  description,
}) => (
  <div className="bd-about-feature-item">
    <div className="bd-about-feature-icon">
      <span>
        <i className={iconClass}></i>
      </span>
    </div>
    <div className="bd-about-feature-content">
      <h6 className="bd-about-feature-title">{title}</h6>
      <p className="bd-about-feature-desc">{description}</p>
    </div>
  </div>
);

interface AboutShapeProps {
  src: StaticImageData;
  alt: string;
  className: string;
}

const AboutShape: React.FC<AboutShapeProps> = ({ src, alt, className }) => (
  <div className={className}>
    <Image src={src} style={{ width: "100%", height: "auto" }} alt={alt} />
  </div>
);

const CourseAboutAreaHS: React.FC = () => {
  return (
    <section className="bd-about-area section-space theme-bg p-relative bd-noise-bg">
      <div className="container">
        <div className="bd-about-shape-wrap">
          <AboutShape src={circleImg} alt="shape" className="shape-1" />
          <AboutShape src={bookShapeImg} alt="shape" className="shape-2" />
          <AboutShape src={aboutWaveShape} alt="shape" className="shape-3" />
          <AboutShape src={aboutCircle} alt="shape" className="shape-4" />
        </div>
        <div className="row g-5">
          <div className="col-xl-6 col-lg-6 col-md-12">
            <div className="bd-about-wrapper style-one">
              <div className="bd-about-thumb-inner">
                <div className="bd-about-thumb-wrapper">
                  <div className="bd-about-thumb">
                    <Image src={aboutThumb1} style={{ width: "100%", height: "auto" }} alt="image" priority />
                  </div>
                  <div className="bd-about-thumb-small">
                    <Image src={aboutThumbSmall} style={{ width: "100%", height: "auto" }} alt="image" priority />
                  </div>
                </div>
                <div className="bd-about-thumb-shape">
                  <Image src={dotShape} alt="image" />
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-6 col-lg-6 col-md-12">
            <div className="bd-about-wrapper style-one">
              <div className="bd-about-content-wrapper">
                <div className="bd-section-title-wrapper">
                  <span className="bd-section-subtitle text-secondary">Nuestra Propuesta</span>
                  <h2 className="bd-section-title white-text mb-20">
                    Formando <span className="down-mark-line">Líderes</span> para el Futuro
                  </h2>
                  <p className="bd-section-paragraph has-border-sec">
                    En nuestra educación media bilingüe católica, preparamos a jóvenes para los desafíos universitarios y profesionales, combinando excelencia académica con una sólida formación en valores cristianos y habilidades de liderazgo.
                  </p>
                </div>
                <div className="bd-about-feature-list">
                  <AboutFeatureItem
                    iconClass="icon-online-class"
                    title="Programa Académico Avanzado"
                    description="Currículo de alta exigencia académica con opciones de estudio orientadas a ciencias, humanidades y tecnología, con énfasis en preparación para estudios superiores."
                  />
                  <AboutFeatureItem
                    iconClass="icon-expert-trainers"
                    title="Profesores Especializados"
                    description="Nuestro cuerpo docente cuenta con amplia experiencia y especialización en sus áreas, muchos con grados de maestría y experiencia internacional."
                  />
                  <AboutFeatureItem
                    iconClass="icon-career-growth"
                    title="Orientación Universitaria"
                    description="Ofrecemos un completo programa de orientación vocacional y universitaria con apoyo para aplicaciones nacionales e internacionales, y preparación para exámenes estandarizados."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CourseAboutAreaHS;