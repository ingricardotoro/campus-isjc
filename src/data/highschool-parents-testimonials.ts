import { StaticImageData } from 'next/image';
import parentsThumb1 from '../../public/assets/images/testimonial/parents-thumb-01.webp';
import parentsThumb2 from '../../public/assets/images/testimonial/parents-thumb-02.webp';

interface HighSchoolParentsTestimonial {
    name: string;
    avatar: StaticImageData;
    review: string;
    bgClass?: string;
}

const highSchoolParentsTestimonials: HighSchoolParentsTestimonial[] = [
    {
        name: "Patricia Mendoza Velázquez",
        avatar: parentsThumb1,
        review: "Como madre de un adolescente, valoro enormemente la formación que recibe mi hijo en la secundaria. Los profesores mantienen altos estándares académicos mientras fomentan valores cristianos. La preparación bilingüe que recibe le abrirá puertas en su futuro universitario y profesional. Aprecio especialmente la comunicación constante entre el colegio y los padres."
    },
    {
        name: "Roberto Castillo Flores",
        avatar: parentsThumb2,
        review: "Elegimos este colegio para nuestros hijos por su excelente balance entre formación académica rigurosa y desarrollo humano integral. El programa de secundaria prepara a los estudiantes no solo para obtener buenas calificaciones, sino para enfrentar los desafíos de la vida con valores sólidos y pensamiento crítico. La educación bilingüe es excepcional.",
        bgClass: "bg-2"
    },
    {
        name: "Elena Sánchez Gutiérrez",
        avatar: parentsThumb1,
        review: "La adolescencia es una etapa crítica, y estamos muy satisfechos con el acompañamiento que recibe nuestra hija. Los profesores están atentos a las necesidades individuales y el departamento de orientación brinda un apoyo extraordinario. La formación católica ha sido fundamental para que mantenga valores firmes en un mundo lleno de presiones sociales."
    },
    {
        name: "Miguel Ángel Ramírez",
        avatar: parentsThumb2,
        review: "Como padre de dos estudiantes de secundaria, puedo afirmar que la inversión en su educación en este colegio ha sido la mejor decisión. El nivel académico es excepcional, con un profesorado altamente calificado que domina ambos idiomas. Además, las actividades extracurriculares y los retiros espirituales contribuyen a su desarrollo integral.",
        bgClass: "bg-2"
    }
];

export default highSchoolParentsTestimonials;