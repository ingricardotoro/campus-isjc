import { IAcademicCalendar } from "@/interFace/interFace";
import fallSemisterImg from '../../public/assets/images/calendar/fall-semester.webp';
import springSemisterImg from '../../public/assets/images/calendar/spring-semester.webp';
import summerSemisterImg from '../../public/assets/images/calendar/summer-semester.webp';

export const academicCalendarData: IAcademicCalendar[] = [
    {
        semester: "Primer Parcial",
        image: fallSemisterImg,
        events: [
            { label: "Inicio de clases", date: "Aug 30, 2024" },
            { label: "Último día para agregar/eliminar materias", date: "September 6, 2024" },
            { label: "Día del Trabajo (No hay clases)", date: "September 2, 2024" },
            { label: "Exámenes parciales", date: "October 14 - October 18, 2024" },
            { label: "Vacaciones Semana Santa", date: "November 27 - November 29, 2024" },
            { label: "Último día de clases", date: "December 6, 2024" },
            { label: "Exámenes Parciales", date: "December 10 - December 14, 2024" },
          
        ],
    },
    {
        semester: "Segundo Parcial",
        image: springSemisterImg,
        events: [
            { label: "Inicio de clases", date: "Jan 8, 2025" },
            { label: "Último día para agregar/eliminar materias", date: "Jan 15, 2025" },
            { label: "Día de Martin Luther King Jr. (No hay clases)", date: "Jan 20, 2025" },
            { label: "Exámenes parciales", date: "March 3 - March 7, 2025" },
            { label: "Vacaciones de primavera", date: "March 24 - March 28, 2025" },
            { label: "Último día de clases", date: "May 2, 2025" },
            { label: "Exámenes Parciales", date: "May 5 - May 9, 2025" },
          
        ],
    },
    {
        semester: "Tercer Parcial",
        image: summerSemisterImg,
        events: [
            { label: "Inicio de clases", date: "May 12, 2025" },
            { label: "Último día para agregar/eliminar materias", date: "May 19, 2025" },
            { label: "Día de los Caídos (No hay clases)", date: "May 26, 2025" },
            { label: "Último día de clases", date: "July 5, 2025" },
            { label: "Feriado Nacional", date: "July 6 - Aug 15, 2025" },
            { label: "Exámenes Parciales", date: "June 30 - July 4, 2025" },
        ],
    },
    {
        semester: "Cuarto Parcial",
        image: summerSemisterImg,
        events: [
            { label: "Inicio de clases", date: "May 12, 2025" },
            { label: "Último día para agregar/eliminar materias", date: "May 19, 2025" },
            { label: "Día de los Caídos (No hay clases)", date: "May 26, 2025" },
            { label: "Exámenes finales", date: "June 30 - July 4, 2025" },
            { label: "Último día de clases", date: "July 5, 2025" },
            
        ],
    },
];