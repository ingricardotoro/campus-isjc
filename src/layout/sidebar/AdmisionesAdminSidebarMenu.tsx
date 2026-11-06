"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { ADMIN_HOME_PATH, useAdmissionsLogout } from "@/components/admissions-admin/useAdmissionsLogout";

const MENU_ITEMS = [
  { href: ADMIN_HOME_PATH, icon: "fa-gauge", label: "Resumen", exact: true },
  { href: `${ADMIN_HOME_PATH}/solicitudes`, icon: "fa-list-check", label: "Solicitudes", exact: false },
];

/** Section links stay active on their subpages, such as a single application. */
function isActive(pathname: string, href: string, exact: boolean) {
  return pathname === href || (!exact && pathname.startsWith(`${href}/`));
}

const AdmisionesAdminSidebarMenu = () => {
  const pathname = usePathname();
  const { logout, isLoggingOut } = useAdmissionsLogout();

  return (
    <div className="col-xl-3 col-lg-3 col-md-4">
      <nav className="bd-dashboard-menu" aria-label="Menú de admisiones">
        <h2 className="bd-dashboard-menu-title h6 mt-0">Admisiones</h2>
        <ul>
          {MENU_ITEMS.map(({ href, icon, label, exact }) => {
            const active = isActive(pathname, href, exact);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={active ? "active" : ""}
                  aria-current={pathname === href ? "page" : active ? "true" : undefined}
                >
                  <span aria-hidden="true">
                    <i className={`fa-light ${icon}`}></i>
                  </span>{" "}
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        <h2 className="bd-dashboard-menu-title h6">Cuenta</h2>
        <ul>
          <li>
            <button
              type="button"
              onClick={logout}
              disabled={isLoggingOut}
              className="border-0 bg-transparent p-0 w-100 text-start"
            >
              <span aria-hidden="true">
                <i className="fa-light fa-sign-out-alt"></i>
              </span>{" "}
              {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default AdmisionesAdminSidebarMenu;
