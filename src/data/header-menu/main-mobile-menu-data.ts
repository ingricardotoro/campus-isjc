
import { MenuItem } from "@/interFace/interFace";

const main_mobile_menu_data: MenuItem[] = [
  {
    id: 1,
    hasDropdown: false,
    children: false,
    active: true,
    title: "Inicio",
    pluseIncon: false,
    link: "/",
    previewImg: false,
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
        title: "Misión y Visión",
        link: "/mision-vision",
        pluseIncon: false,
      },
      {
        title: "Instalaciones",
        link: "/instalaciones",
        pluseIncon: false,
      },
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
        link: "https://www.facebook.com/polideportivoSJ",
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
    hasDropdown: false,
    active: true,
    megaMenu: false,
    children: false,
    title: "Contáctanos",
    pluseIncon: true,
    link: "/contactanos",
  },
];

export default main_mobile_menu_data;
