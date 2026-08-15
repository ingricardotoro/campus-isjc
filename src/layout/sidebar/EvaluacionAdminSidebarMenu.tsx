"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";

const EvaluacionAdminSidebarMenu = () => {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { href: "/evaluacion-docente-admin/docentes", icon: "fa-chalkboard-user", label: "Docentes" },
    { href: "/evaluacion-docente-admin/secciones", icon: "fa-layer-group", label: "Secciones" },
    { href: "/evaluacion-docente-admin/asignaciones", icon: "fa-diagram-project", label: "Asignaciones" },
    { href: "/evaluacion-docente-admin/preguntas", icon: "fa-circle-question", label: "Preguntas" },
    { href: "/evaluacion-docente-admin/reportes", icon: "fa-chart-line", label: "Reportes" },
  ];

  const handleLogout = async () => {
    await fetch("/api/evaluacion-docente-admin/logout", { method: "POST" });
    router.push("/evaluacion-docente-admin/login");
    router.refresh();
  };

  return (
    <div className="col-xl-3 col-lg-3 col-md-4">
      <div className="bd-dashboard-menu">
        <h6 className="bd-dashboard-menu-title mt-0">Evaluación Docente</h6>
        <ul>
          {menuItems.map(({ href, icon, label }) => (
            <li key={href}>
              <Link href={href} className={pathname === href ? "active" : ""}>
                <span><i className={`fa-light ${icon}`}></i></span> {label}
              </Link>
            </li>
          ))}
        </ul>

        <h6 className="bd-dashboard-menu-title">Cuenta</h6>
        <ul>
          <li>
            <button
              type="button"
              onClick={handleLogout}
              className="border-0 bg-transparent p-0 w-100 text-start"
            >
              <span><i className="fa-light fa-sign-out-alt"></i></span> Cerrar sesión
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default EvaluacionAdminSidebarMenu;
