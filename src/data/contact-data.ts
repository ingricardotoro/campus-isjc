import { ContactItem } from "@/interFace/interFace";

export const contactData: ContactItem[] = [
    {
        icon: "fa-light fa-map-marker-alt",
        title: "Visitanos",
        details: [
            "Col. La campaña, Tegucigalpa, HN",
            { text: "info@sanjosedelcarmen.edu.hn", link: "info@sanjosedelcarmen.edu.hn" }
        ]
    },
    {
        icon: "fa-light fa-phone",
        title: "Llamanos o Escribenos",
        details: [
            "(+504) 2236-5298",
            "(+504) 9439-2201"
        ]
    },
    {
        icon: "fa-light fa-envelope",
        title: "Correo Electrónico",
        details: [
            { text: "info@sanjosedelcarmen.edu.hn", link: "mailto:info@sanjosedelcarmen.edu.hn" },
            { text: "sistemas@sanjosedelcarmen.edu.hn", link: "mailto:sistemas@sanjosedelcarmen.edu.hn" }
        ]
    },
    {
        icon: "fa-light fa-globe",
        title: "Nuestro Facebook",
        details: [
            { text: "Facebook", link: "https://www.facebook.com/" },
            { text: "www.istudy.info", link: "https://www.istudy.info" }
        ]
    }
];