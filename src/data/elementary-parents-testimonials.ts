import { StaticImageData } from 'next/image';
import parentsThumb1 from '../../public/assets/images/testimonial/kinder2.webp';
import parentsThumb2 from '../../public/assets/images/testimonial/kinder3.webp';

interface ElementaryParentsTestimonial {
    name: string;
    avatar: StaticImageData;
    review: string;
    bgClass?: string;
}

const elementaryParentsTestimonials: ElementaryParentsTestimonial[] = [
    {
        name: "Ana Gómez Martínez",
        avatar: parentsThumb1,
        review: "Como madre, estoy profundamente agradecida por la formación integral que recibe mi hija en esta escuela. No solo sobresale académicamente gracias al programa bilingüe, sino que ha desarrollado valores cristianos que la han convertido en una niña compasiva y responsable. Los maestros se preocupan genuinamente por cada estudiante."
    },
    {
        name: "Carlos Rodríguez Flores",
        avatar: parentsThumb2,
        review: "Elegimos esta escuela por su excelencia académica, pero nos sorprendió gratamente el cuidado y la atención personalizada que recibe nuestro hijo. Los profesores identifican sus fortalezas y áreas de mejora, trabajando con nosotros como familia. El ambiente seguro y los valores católicos han sido fundamentales para su desarrollo.",
        bgClass: "bg-2"
    },
    {
        name: "María Elena Hernández",
        avatar: parentsThumb1,
        review: "Mi hijo ha florecido increíblemente en esta escuela. El programa bilingüe es excepcional, y ahora se comunica con fluidez en ambos idiomas. Además, el enfoque en valores cristianos y la ética ha moldeado su carácter. Los maestros son dedicados y mantienen una comunicación constante con los padres."
    },
    {
        name: "José Manuel Vásquez",
        avatar: parentsThumb2,
        review: "Lo que más valoramos es cómo la escuela equilibra la excelencia académica con el desarrollo emocional y espiritual. Nuestros gemelos reciben atención individualizada a pesar de estar en el mismo grado. El ambiente familiar y el trato cariñoso del personal han creado un entorno donde nuestros hijos aman aprender.",
        bgClass: "bg-2"
    }
];

export default elementaryParentsTestimonials;