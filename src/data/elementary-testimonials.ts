import { ITestimonial } from "@/interFace/interFace";
import avatar1 from "../../public/assets/images/avatar/avatar.webp";
import avatar2 from "../../public/assets/images/avatar/avatar2.webp";
import avatar3 from "../../public/assets/images/avatar/avatar3.webp";
import avatar4 from "../../public/assets/images/avatar/avatar4.webp";

const elementaryTestimonials: ITestimonial[] = [
    {
        id: 1,
        rating: 5,
        content: "Lo que más me gusta de mi escuela son las canchas de fútbol donde jugamos durante la clase de educación física. Nuestro profesor nos enseña diferentes deportes y siempre nos anima a mantenernos activos. ¡Es mi clase favorita porque puedo correr, jugar con mis amigos y aprender nuevas habilidades!",
        name: "Sofía Martínez",
        avatar: avatar1,
        designation: "Estudiante de Primaria"
    },
    {
        id: 2,
        rating: 5,
        content: "En mi escuela aprendemos muchas cosas interesantes. Me gusta mucho la clase de computación donde hacemos proyectos divertidos. También disfruto las clases de valores porque aprendemos a ser buenas personas y a ayudar a los demás.",
        name: "Carlos Rodríguez",
        avatar: avatar2,
        designation: "Estudiante de Primaria"
    },
    {
        id: 3,
        rating: 5,
        content: "Mi maestra siempre nos explica todo muy bien y nos ayuda cuando no entendemos algo. En mi escuela celebramos muchas actividades especiales y aprendemos sobre Dios. Me siento muy feliz cuando vengo a estudiar y puedo hablar en inglés y español.",
        name: "María Fernanda López",
        avatar: avatar3,
        designation: "Estudiante de Primaria"
    },
    {
        id: 4,
        rating: 5,
        content: "Lo que más me gusta de mi escuela es que tenemos una biblioteca con muchos libros interesantes y un laboratorio de ciencias donde hacemos experimentos. Los maestros nos enseñan con mucha paciencia y me ayudan a mejorar cada día.",
        name: "Diego Hernández",
        avatar: avatar4,
        designation: "Estudiante de Primaria"
    }
];

export default elementaryTestimonials;