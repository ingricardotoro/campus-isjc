import Image from 'next/image';
import React from 'react';
import faqThumb from '../../../public/assets/images/faq/kinder.png';
import faqGroupStartImg from '../../../public/assets/images/shape/faq-star-group.webp';

// Define the type for FAQ items
interface FAQItemProps {
    question: string;
    answer: string;
    id: string;
}

// FAQ data array with proper types
const faqData: FAQItemProps[] = [
    {
        id: 'TwentyEight',
        question: '¿Cómo asegura la escuela un aprendizaje personalizado?',
        answer: 'Mantenemos grupos pequeños para garantizar atención individual y utilizamos instrucción diferenciada para adaptarnos a los diferentes estilos de aprendizaje. Los docentes trabajan de cerca con los estudiantes para identificar sus fortalezas y áreas de mejora, brindando apoyo personalizado para ayudarlos a tener éxito.',
    },
    {
        id: 'TwentyNine',
        question: '¿Cómo participan los padres en la comunidad escolar?',
        answer: 'Se anima a los padres a involucrarse mediante comunicación regular, reuniones de padres y maestros, y oportunidades de voluntariado. También contamos con un consejo asesor de padres que colabora con la dirección escolar en iniciativas clave.',
    },
    {
        id: 'Thirty',
        question: '¿Qué actividades extracurriculares se ofrecen?',
        answer: 'Ofrecemos una amplia variedad de actividades extracurriculares, incluyendo deportes, artes, robótica, clubes de programación, equipos de debate y oportunidades de servicio comunitario. Estas actividades están diseñadas para que los estudiantes exploren sus intereses y desarrollen nuevas habilidades fuera del aula.',
    }
];

const FAQItem: React.FC<FAQItemProps & { isActive: boolean }> = ({ id, question, answer, isActive }) => (
    <div className="accordion-item">
        <h2 className="accordion-header" id={`heading${id}`}>
            <button
                className={`accordion-button ${isActive ? '' : 'collapsed'}`}
                type="button"
                data-bs-toggle="collapse"
                data-bs-target={`#collapse${id}`}
                aria-expanded={isActive ? "true" : "false"}
                aria-controls={`collapse${id}`}
            >
                {question}
            </button>
        </h2>
        <div 
            id={`collapse${id}`} 
            className={`accordion-collapse collapse ${isActive ? 'show' : ''}`} 
            aria-labelledby={`heading${id}`} 
            data-bs-parent="#accordionExampleTen"
        >
            <div className="accordion-body">{answer}</div>
        </div>
    </div>
);

const KindergartenFaqArea = () => {
    return (
        <section className="bd-faq-area p-relative secondary-bg-05 section-space">
            <div className="container">
                <div className="row gy-30 align-items-center justify-content-between">
                    {/* FAQ Content Section */}
                    <div className="col-xl-6 col-lg-6">
                        <div className="bd-section-title-wrapper section-title-space">
                            <span className="bd-section-subtitle">Preguntas Frecuentes</span>
                            <h2 className="bd-section-title">Conoce más sobre el área de Pre-Básica</h2>
                        </div>
                        <div className="bd-faq-content">
                            <div className="accordion-common-style accordion-bg accordion-theme-bg accordion-item-margin">
                                <div className="accordion" id="accordionExampleTen">
                                    {faqData.map((item, index) => (
                                        <FAQItem key={item.id} {...item} isActive={index === 0} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FAQ Image Section */}
                    <div className="col-xl-6 col-lg-6">
                        <div className="bd-faq-thumb-wrapper">
                            <div className="bd-faq-thumb-two">
                                <Image style={{width:"auto", height:"auto"}} src={faqThumb} alt="FAQ" />
                            </div>
                            <div className="bd-faq-shape d-none d-lg-block">
                                {[1, 2].map((index) => (
                                    <div key={index} className={`shape-${index}`}>
                                        <Image src={faqGroupStartImg} alt="Shape" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default KindergartenFaqArea;
