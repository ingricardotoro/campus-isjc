import { ITestimonial } from "@/interFace/interFace";
import avatar1 from "../../public/assets/images/avatar/avatar.webp";
import avatar2 from "../../public/assets/images/avatar/avatar2.webp";
import avatar3 from "../../public/assets/images/avatar/avatar3.webp";
import avatar4 from "../../public/assets/images/avatar/avatar4.webp";
import testimonialQuote from "../../public/assets/images/shape/testimonial-quotes.webp";
import testimonialQuote2 from "../../public/assets/images/icon/quote-icon.webp";

const testimonialData: ITestimonial[] = [
    {
        id: 1,
        rating: 5,
        content: "The courses on iStudy have transformed my career. The practical projects and expert instructors made learning seamless and enjoyable. Highly recommend it!",
        name: "Sarah Johnson",
        avatar: avatar1,
    },
    {
        id: 2,
        rating: 5,
        content: "iStudy is a game-changer! The flexible schedules and top-notch content allowed me to upskill while managing my busy routine. Thank you, iStudy!",
        name: "James Parker",
        avatar: avatar2,
    },
    {
        id: 3,
        rating: 5,
        content: "Joining iStudy was the best decision I made this year. The course variety and personalized learning paths helped me achieve my professional goals with ease.",
        name: "Emily Davis",
        avatar: avatar3,
    },
    //modern schooling testimonial data
    {
        id: 4,
        rating: 5,
        content: "Modern Schooling at iStudy has transformed my child's learning experience. The interactive classes and expert instructors make education truly engaging.",
        name: "Sophia Carter",
        avatar: avatar1,
        designation: "Parent"
    },
    {
        id: 5,
        rating: 5,
        content: "iStudy's modern schooling approach ensures that students are prepared for the future. I love the balance between academics and extracurricular activities.",
        name: "James Taylor",
        avatar: avatar2,
        designation: "Teacher"
    },
    {
        id: 6,
        rating: 5,
        content: "The state-of-the-art facilities and digital tools have made learning seamless and enjoyable. It's the best decision we've made for our child's education.",
        name: "Emma Johnson",
        avatar: avatar3,
        designation: "Parent"
    },
    //University testimonial data
    {
        id: 7,
        rating: 5,
        content: "Estudiar en el ISJC ha sido una experiencia que ha marcado mi vida académica. Los profesores realmente se preocupan por nuestro aprendizaje y el ambiente de clases es súper dinámico. Ha sido el lugar ideal para crecer, mejorar mis habilidades y sentirme seguro para lo que viene en el futuro.",
        name: "Sophia",
        avatar: avatar1,
        designation: "Estudiante de 9no Grado"
    },
    {
        id: 8,
        rating: 5,
        content: "Mi tiempo en el ISJC ha sido una experiencia que me cambió la vida. Los cursos están muy bien organizados y los recursos que ofrecen son de primera. Aquí no solo he aprendido cosas útiles para mi carrera, también he hecho amistades que me acompañarán toda la vida.",
        name: "David",
        avatar: avatar2,
        designation: "Estudiante del 10mo Grado"
    },
    {
        id: 9,
        rating: 5,
        content: "El ISJC me ha dado mucho más que solo conocimientos académicos. Aquí descubrí mis verdaderas pasiones, aprendí a trabajar en equipo y encontré un espacio donde mi opinión cuenta. Gracias al apoyo de mis profesores y compañeros, hoy me siento listo para enfrentar cualquier desafío.",
        name: "Emma",
        avatar: avatar3,
        designation: "Estudiante de Último Año"
    },
    //Quran learning testimonial data
    {
        id: 10,
        name: "Amir Hamza",
        designation: "Student",
        avatar: avatar1,
        rating: 5,
        quoteImage: testimonialQuote,
        highlight: "Great Course !",
        content: "The Quran Learning Program at iStudy has been a transformative experience for me. The structured lessons and dedicated instructors have helped me understand the Quran.",
    },
    {
        id: 11,
        name: "Omar Ali",
        designation: "Student",
        avatar: avatar2,
        rating: 5,
        quoteImage: testimonialQuote,
        highlight: "Great Course !",
        content: "The instructors are incredibly knowledgeable and supportive. The online classes are convenient and flexible, allowing me to learn at my own pace while receiving valuable feedback.",
    },
    {
        id: 12,
        name: "Mohammad Yousuf",
        designation: "Student",
        avatar: avatar3,
        rating: 5,
        quoteImage: testimonialQuote,
        highlight: "Great Course !",
        content: "I highly recommend the Quran Learning Program. The curriculum is well-structured, and the focus on Tajweed has helped me recite with proper pronunciation. It's a truly enriching experience.",
    },
    //Language academy testimonial data
    {
        id: 13,
        name: "John Wick",
        designation: "Language Instructor",
        avatar: avatar2,
        rating: 5,
        quoteImage: testimonialQuote2,
        highlight: "Great Course !",
        content: "“Using the iStudy Language Academy was a game-changer for my language school. The layout is clean, modern, and intuitive. It was incredibly easy to adapt the template to my needs, and the responsiveness across devices is fantastic. Highly recommended for anyone building a language learning platform!”",
    },
    {
        id: 14,
        name: "Amber Page",
        designation: "Language Coach",
        avatar: avatar3,
        rating: 5,
        quoteImage: testimonialQuote2,
        content: "“Using the iStudy Language Academy was a game-changer for my language school. The layout is clean, modern, and intuitive. It was incredibly easy to adapt the template to my needs, and the responsiveness across devices is fantastic. Highly recommended for anyone building a language learning platform!”",
    },
    {
        id: 15,
        name: "Cody Fisher",
        designation: "Language Program Manager",
        avatar: avatar4,
        rating: 5,
        quoteImage: testimonialQuote2,
        content: "“Using the iStudy Language Academy was a game-changer for my language school. The layout is clean, modern, and intuitive. It was incredibly easy to adapt the template to my needs, and the responsiveness across devices is fantastic. Highly recommended for anyone building a language learning platform!”",
    },
];

export default testimonialData;