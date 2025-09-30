
import { MenuItem } from "@/interFace/interFace";
// import homeOneImg from "../../../public/assets/images/menu/menu-home-1.webp";
// import homeTowImg from "../../../public/assets/images/menu/menu-home-2.webp";
// import homeThreeImg from "../../../public/assets/images/menu/menu-home-3.webp";
// import homeFourImg from "../../../public/assets/images/menu/menu-home-4.webp";
// import homeFiveImg from "../../../public/assets/images/menu/menu-home-5.webp";
// import homeSixImg from "../../../public/assets/images/menu/menu-home-6.webp";
// import homeSevenImg from "../../../public/assets/images/menu/menu-home-7.webp";
// import coummingSoonImg from "../../../public/assets/images/menu/menu-home-soon.webp";

const main_menu_data: MenuItem[] = [
  {
    id: 1,
    hasDropdown: false,
    children: false,
    active: true,
    title: "Inicio",
    pluseIncon: false,
    link: "/",
    previewImg: false,
   /*  submenus: [
      { title: "Online Course", link: "/online-course", previewImg: homeOneImg },
      { title: "University", link: "/university", previewImg: homeTowImg },
      { title: "Modern Schooling", link: "/modern-schooling", previewImg: homeThreeImg },
      { title: "Kindergarten", link: "/kindergarten", previewImg: homeFourImg },
      { title: "Quran Learning", link: "/quran-learning", previewImg: homeFiveImg },
      { title: "Book Store", link: "/book-store", previewImg: homeSixImg },
      { title: "Language Academy", link: "/language-academy", previewImg: homeSevenImg },
      { title: "Kitchen Coach - Soon", link: "#", previewImg: coummingSoonImg },
      { title: "Marketplace - Soon", link: "#", previewImg: coummingSoonImg },
      { title: "Course Hub - Soon", link: "#", previewImg: coummingSoonImg },
    ], */
  },
  {
    id: 2,
    hasDropdown: true,
    active: true,
    megaMenu: true,
    children: true,
    title: "Nosotros",
    pluseIncon: true,
    link: "#",
    submenus: [
      {
        title: "Historia",
        link: "/historia",
        pluseIncon: false,
      },

      {
        title: "Misión y Visión",
        link: "/mision-vision",
        pluseIncon: false,
       /*  megaMenu: [
          { title: "Courses", link: "/courses" },
          { title: "Courses Search Filter", link: "/courses-filter-search" },
          { title: "Courses Filter Category", link: "/courses-filter-category" }
        ], */
      },
      {
        title: "Instalaciones",
        link: "/instalaciones",
        pluseIncon: false,
      },

      {
        title: "Calendarizacion 2025",
        link: "/calendarizacion",
        pluseIncon: false,
      },
      
      {
        title: "Proyecto Carmelitano",
        link: "#",
        pluseIncon: false,
      },

      
     /*  {
        title: "Courses Details",
        link: "#",
        pluseIncon: true,
        megaMenu: [
          { title: "Courses Details", link: "/courses/course-details" },
          { title: "Courses Details Two", link: "/courses/course-details-two" },
          { title: "Courses Details Three", link: "/courses/course-details-three" },
        ],
      }, */

     
    ],
  },
  {
    id: 3,
    hasDropdown: true,
    active: true,
    megaMenu: true,
    children: true,
    title: "Modalidades",
    pluseIncon: true,
    link: "#",
    submenus: [

      {
        title: "Pre-Básica",
        link: "/kindergarten",
      },

      {
        title: "Educ. Básica (1 - 9)",
        link: "/elementary",
      },

      {
        title: "Educ. Media (10 y 11)",
        link: "/highSchool",
      },

    {
        title: "Polideportivo",
        link: "/polideportivo",
      },
      
    ]
  },
  {
    id: 4,
    hasDropdown: false,
    active: true,
    megaMenu: false,
    children: false,
    title: "Matrícula",
    pluseIncon: false,
    link: "/matricula",
  },
  {
    id: 5,
    hasDropdown: false,
    children: false,
    megaMenu: false,
    active: true,
    title: "Empleo",
    pluseIncon: false,
    link: "/jobs",
  },
  {
    id: 6,
    hasDropdown: true,
    active: true,
    megaMenu: true,
    children: true,
    title: "Contáctanos",
    pluseIncon: true,
    link: "/contactanos",
  },
];

export default main_menu_data;
