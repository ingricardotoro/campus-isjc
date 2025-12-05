import { ITestimonial } from "@/interFace/interFace";
import avatar1 from "../../public/assets/images/avatar/avatar.webp";
import avatar2 from "../../public/assets/images/avatar/avatar2.webp";
import avatar3 from "../../public/assets/images/avatar/avatar3.webp";
import avatar4 from "../../public/assets/images/avatar/avatar4.webp";

const elementaryTestimonials: ITestimonial[] = [
    {
        id: 1,
        rating: 5,
        content: "Lo que más me gusta de mi escuela son las canchas de fútbol donde jugamos durante la clase de educación física. Nuestra maestra nos enseña diferentes deportes y siempre nos anima a mantenernos activos. Es mi clase favorita porque puedo correr, jugar con mis amigos.",
        name: "Sofía Martínez",
        avatar: avatar1,
        designation: "Estudiante de Primaria"
    },
    {
        id: 2,
        rating: 5,
        content: "En mi escuela aprendemos muchas cosas interesantes. Me gusta mucho la clase de computación donde hacemos proyectos divertidos. También disfruto las clases de religión porque aprendemos a ser buenas personas y a ayudar a los demás.",
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
        content: "Me encanta mi escuela porque tenemos muchas excursiones educativas. El año pasado fuimos a un museo y aprendimos sobre historia. También me gusta que en mi escuela todos somos amigos y nos ayudamos mutuamente. ¡Es un lugar donde me siento seguro y feliz!",
        name: "Diego Hernández",
        avatar: avatar4,
        designation: "Estudiante de Primaria"
    }
];

export default elementaryTestimonials;