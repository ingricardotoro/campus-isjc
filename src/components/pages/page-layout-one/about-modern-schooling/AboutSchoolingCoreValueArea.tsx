import Image from 'next/image';
import React from 'react';
import { CoreValue } from "@/interFace/interFace";
//import bgCoreValue from '../../../../../public/assets/images/mission/core-values.webp';
import bgCoreValue from '../../../../../public/assets/images/mission/pentecostes.jpg';
import handshakeIcon from '../../../../../public/assets/images/icon/handshake.svg';
import innovationIcon from '../../../../../public/assets/images/icon/innovation.svg';
import excellenceIcon from '../../../../../public/assets/images/icon/excellence.svg';
import textBookIcon from '../../../../../public/assets/images/icon/text-books.svg';

export const coreValuesData: CoreValue[] = [
    {
        icon: handshakeIcon,
        title: "Integridad",
        description: "Vivimos la honestidad y la coherencia entre lo que pensamos, decimos y hacemos, guiándonos siempre por los valores del Evangelio y el ejemplo de Cristo. Fomentamos un ambiente de confianza y respeto mutuo en toda la comunidad educativa."
    },
    {
        icon: innovationIcon,
        title: "Innovación",
        description: "Promovemos la creatividad y la apertura al cambio, buscando constantemente nuevas formas de enseñar y aprender. Nos adaptamos a los desafíos de la sociedad actual, integrando herramientas y metodologías que enriquecen la formación integral de nuestros estudiantes."
    },
    {
        icon: excellenceIcon,
        title: "Excelencia",
        description: "Nos esforzamos por alcanzar la excelencia en cada aspecto de la vida escolar, tanto en lo académico como en lo humano y espiritual. Motivamos a nuestros estudiantes y personal a superarse día a día, dando lo mejor de sí mismos al servicio de los demás."
    },
    {
        icon: textBookIcon,
        title: "Fe y Espiritualidad",
        description: "Centramos nuestra labor educativa en la fe católica, cultivando la espiritualidad y el encuentro personal con Dios. Acompañamos a nuestros estudiantes en su crecimiento interior, promoviendo la oración, los valores cristianos y el compromiso con la comunidad."
    }
];

const AboutSchoolingCoreValueArea = () => {

    return (
        <>
            <section className="bd-core-values-area bd-core-values-bg section-space" style={{backgroundImage: `url(${bgCoreValue.src})`}}>
                <div className="container">
                    <div className="row justify-content-between">
                        <div className="col-xl-6">
                            <div className="bd-section-wrapper section-title-space sidebar-sticky">
                                <h2 className="bd-section-title white-text mb-20">Principios y Valores</h2>
                                <p className="bd-section-paragraph white-text">Los principios y valores que guían nuestro enfoque educativo en el ISJC</p>
                            </div>
                        </div>
                        <div className="col-xl-5">
                            <div className="bd-core-values-box-wrapper">
                                {coreValuesData.map((value, index) => (
                                    <div className="bd-core-values-box bg-flashlight" key={index}>
                                        <div className="bd-core-values-icon">
                                            <Image src={value.icon} style={{width: 'auto', height: 'auto'}} alt="icon"/>
                                        </div>
                                        <h4 className="bd-core-values-title">{value.title}</h4>
                                        <p className="bd-core-values-desc" dangerouslySetInnerHTML={{ __html: value.description }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default AboutSchoolingCoreValueArea;