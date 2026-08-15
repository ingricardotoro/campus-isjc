"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { Section } from "@/interFace/evaluacion-docente-interface";

const SeccionesListMain = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSections = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/evaluacion-docente-admin/secciones");
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setSections(result.sections);
    } catch {
      toast.error("No se pudieron cargar las secciones.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSections();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta sección? Esta acción no se puede deshacer.")) return;
    try {
      const res = await fetch(`/api/evaluacion-docente-admin/secciones/${id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success("Sección eliminada.");
      loadSections();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar.");
    }
  };

  return (
    <div className="col-xl-9 col-lg-9 col-md-8">
      <div className="bd-dashboard-inner">
        <div className="bd-dashboard-title-inner">
          <div className="d-flex justify-content-between flex-wrap align-items-center">
            <h4 className="bd-dashboard-title">Secciones</h4>
            <Link href="/evaluacion-docente-admin/secciones/nuevo" className="bd-btn btn-primary">
              Nueva sección
            </Link>
          </div>
        </div>

        <div className="bd-dashboard-table table-responsive mt-30">
          <table className="table table-bordered table-head-bg">
            <thead>
              <tr>
                <th>Sección</th>
                <th>Grado</th>
                <th>Letra</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5}>Cargando...</td>
                </tr>
              )}
              {!isLoading && sections.length === 0 && (
                <tr>
                  <td colSpan={5}>No hay secciones registradas todavía.</td>
                </tr>
              )}
              {sections.map((section) => (
                <tr key={section.id}>
                  <td><p><strong>{section.label}</strong></p></td>
                  <td><p>{section.grade}</p></td>
                  <td><p>{section.section_letter}</p></td>
                  <td>
                    <div className={`bd-badge badge-${section.is_active ? "success" : "warning"}`}>
                      {section.is_active ? "Activa" : "Inactiva"}
                    </div>
                  </td>
                  <td>
                    <div className="bd-button-action">
                      <Link
                        className="bd-default-tooltip edit"
                        href={`/evaluacion-docente-admin/secciones/${section.id}/editar`}
                      >
                        <span><i className="fa-light fa-pen-to-square"></i></span>
                      </Link>
                      <button
                        type="button"
                        className="bd-default-tooltip delete border-0 bg-transparent p-0"
                        onClick={() => handleDelete(section.id)}
                      >
                        <span><i className="fa-light fa-trash-can"></i></span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SeccionesListMain;
