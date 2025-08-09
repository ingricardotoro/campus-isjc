import Link from 'next/link';
import React from 'react';
interface Category {
    title: string;
    description: string;
    coursesCount: number;
    iconClass: string;
    colorClass: string;
}

const categories: Category[] = [
    {
        title: '1. Entrevista Personal',
        description: 'Es necesario realizar una entrevista personal con los padres y el estudiante, la cual se realiza en la institución.',
        coursesCount: 30,
        iconClass: 'fa-light fa-palette',
        colorClass: 'color-primary',
    },
    {
        title: '2. Documentación',
        description: 'Es necesario presentar la documentación específica que se solicita en cada área, más abajo podrá encontrarla con detalles.',
        coursesCount: 30,
        iconClass: 'fa-light fa-code',
        colorClass: 'color-secondary',
    },
    {
        title: '3. Curso Nivelación',
        description: 'Se debe realizar un curso y un examen de nivelación para evaluar los conocimientos, se realiza en el mes de enero.',
        coursesCount: 30,
        iconClass: 'fa-light fa-chart-line',
        colorClass: 'color-extra-01',
    },
   
];
const CategoriasAdmision: React.FC = () => {
    return (
        <>
            {/* -- category style 06 start -- */}
            <section className="bd-elements-category ">
                <div className="container">
                    <div className="row align-items-center justify-content-center">
                        <div className="col-lg-12">
                            <div className="bd-elements-section-wrapper section-title-space text-center">
                                <div className="bd-elements-line">
                                    <div className="bd-separator-line line-left"></div>
                                    <div className="bd-elements-title-wrapper">
                                        <h2 className="bd-elements-title small">Etapas del Proceso</h2>
                                    </div>
                                    <div className="bd-separator-line line-right"></div>
                                </div>
                                <p className=""></p>
                            </div>
                        </div>
                    </div>
                    <div className="row g-30">
                        {categories.map((category, index) => (
                            <div className="col-xl-4 col-lg-4 col-md-6" key={index}>
                                <div className="bd-category-wrapper style-six">
                                    <div className="bd-category-item">
                                             {/* <span className={`bd-category-icon ${category.colorClass} has-white`}> 
                                            <i className={category.iconClass}></i>
                                        </span>*/}
                                        
                                        <div className="bd-category-content">
                                            <h6 className="bd-category-title">
                                                <Link href="#">{category.title}</Link>
                                            </h6>
                                            <p className="bd-category-descrip">{category.description}</p>
                                            {/* <span className={`bd-category-total ${category.colorClass}`}>{category.coursesCount} course</span> */}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            {/* -- category style 06 end -- */}
        </>
    );
};

export default CategoriasAdmision;
