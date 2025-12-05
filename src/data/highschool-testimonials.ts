import { ITestimonial } from "@/interFace/interFace";
import avatar1 from "../../public/assets/images/avatar/avatar.webp";
import avatar2 from "../../public/assets/images/avatar/avatar2.webp";
import avatar3 from "../../public/assets/images/avatar/avatar3.webp";
import avatar4 from "../../public/assets/images/avatar/avatar4.webp";

const highSchoolTestimonials: ITestimonial[] = [
    {
        id: 1,
        rating: 5,
        content: "El programa académico de secundaria ha sido fundamental para mi desarrollo. Los profesores no solo se preocupan por nuestro rendimiento académico, sino también por nuestra formación en valores. El ambiente bilingüe me ha permitido mejorar significativamente mi inglés.",
        name: "Ricardo",
        avatar: avatar1,
        designation: "Estudiante de 10mo Grado"
    },
    {
        id: 2,
        rating: 5,
        content: "Estudiar en un colegio que valora tanto la excelencia académica como la formación espiritual ha sido una experiencia transformadora. He participado en proyectos científicos y competencias académicas que me han ayudado a descubrir mi vocación por la medicina. Estoy agradecida por la preparación integral que recibo.",
        name: "Angel",
        avatar: avatar2,
        designation: "Estudiante de 11vo Grado"
    },
    {
        id: 3,
        rating: 5,
        content: "Como estudiante de último año, puedo decir que el colegio me ha preparado muy bien para mi futuro. El enfoque bilingüe me han abierto puertas a universidades internacionales. Además, las actividades extracurriculares han fortalecido mis habilidades de liderazgo.",
        name: "Sofía",
        avatar: avatar3,
        designation: "Estudiante de 11vo Grado"
    },
    {
        id: 4,
        rating: 5,
        content: "Lo que más valoro de mi colegio es el equilibrio entre lo académico y lo humano. Los retiros espirituales y las actividades de servicio comunitario nos ayudan a crecer como personas íntegras. He encontrado verdaderos amigos y mentores entre mis compañeros y profesores.",
        name: "Valeria",
        avatar: avatar4,
        designation: "Estudiante de 9no Grado"
    }
];

export default highSchoolTestimonials;