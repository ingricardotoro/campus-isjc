import React from "react";
import Image, { StaticImageData } from "next/image";
import circleImg from "../../../public/assets/images/shape/about-solid-circle.webp";
import bookShapeImg from "../../../public/assets/images/shape/about-book-shape.webp";
import aboutWaveShape from "../../../public/assets/images/shape/about-wave-shape.webp";
import aboutCircle from "../../../public/assets/images/shape/about-circle.webp";
import aboutThumb1 from "../../../public/assets/images/about/valores.jpg";
import aboutThumbSmall from "../../../public/assets/images/about/elecciones2_2.jpg";
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

const CourseAboutAreaE: React.FC = () => {
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
                  <span className="bd-section-subtitle text-secondary">Sobre Nosotros</span>
                  <h2 className="bd-section-title white-text mb-20">
                    Formando <span className="down-mark-line">Valores</span> y Excelencia Académica 
                  </h2>
                  <p className="bd-section-paragraph has-border-sec">
                    En nuestra primaria bilingüe católica, fomentamos el desarrollo integral de cada estudiante, combinando excelencia académica con sólidos valores cristianos en un ambiente bilingüe enriquecedor.
                  </p>
                </div>
                <div className="bd-about-feature-list">
                  <AboutFeatureItem
                    iconClass="icon-online-class"
                    title="Educación Bilingüe"
                    description="Programa de inmersión total en inglés y español que prepara a nuestros estudiantes para un mundo globalizado desde temprana edad."
                  />
                  <AboutFeatureItem
                    iconClass="icon-expert-trainers"
                    title="Docentes Calificados"
                    description="Nuestro equipo educativo cuenta con certificaciones bilingües y formación especializada en pedagogía católica y métodos de enseñanza innovadores."
                  />
                  <AboutFeatureItem
                    iconClass="icon-career-growth"
                    title="Formación en Valores"
                    description="Integramos los valores católicos en todas las asignaturas, formando estudiantes con excelencia académica, espiritualidad y compromiso social."
                  />
                </div>
               {/*  <div className="bd-about-btn">
                  <Link className="bd-btn btn-secondary-white" href="/about-online-course">
                    Conocer Más
                  </Link>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CourseAboutAreaE;
