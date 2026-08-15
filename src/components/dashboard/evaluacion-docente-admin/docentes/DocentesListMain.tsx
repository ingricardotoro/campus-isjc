"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import type { Teacher } from "@/interFace/evaluacion-docente-interface";

const DocentesListMain = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTeachers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/evaluacion-docente-admin/docentes");
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setTeachers(result.teachers);
    } catch {
      toast.error("No se pudieron cargar los docentes.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este docente? Esta acción no se puede deshacer.")) return;
    try {
      const res = await fetch(`/api/evaluacion-docente-admin/docentes/${id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success("Docente eliminado.");
      loadTeachers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar.");
    }
  };

  return (
    <div className="col-xl-9 col-lg-9 col-md-8">
      <div className="bd-dashboard-inner">
        <div className="bd-dashboard-title-inner">
          <div className="d-flex justify-content-between flex-wrap align-items-center">
            <h4 className="bd-dashboard-title">Docentes</h4>
            <Link href="/evaluacion-docente-admin/docentes/nuevo" className="bd-btn btn-primary">
              Nuevo docente
            </Link>
          </div>
        </div>

        <div className="bd-dashboard-table table-responsive mt-30">
          <table className="table table-bordered table-head-bg">
            <thead>
              <tr>
                <th>Foto</th>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={4}>Cargando...</td>
                </tr>
              )}
              {!isLoading && teachers.length === 0 && (
                <tr>
                  <td colSpan={4}>No hay docentes registrados todavía.</td>
                </tr>
              )}
              {teachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td>
                    <div style={{ width: 48, height: 48, position: "relative", borderRadius: "50%", overflow: "hidden", background: "#eee" }}>
                      {teacher.photo_url && (
                        <Image src={teacher.photo_url} alt={teacher.full_name} fill sizes="48px" style={{ objectFit: "cover" }} />
                      )}
                    </div>
                  </td>
                  <td><p>{teacher.full_name}</p></td>
                  <td>
                    <div className={`bd-badge badge-${teacher.is_active ? "success" : "warning"}`}>
                      {teacher.is_active ? "Activo" : "Inactivo"}
                    </div>
                  </td>
                  <td>
                    <div className="bd-button-action">
                      <Link
                        className="bd-default-tooltip edit"
                        href={`/evaluacion-docente-admin/docentes/${teacher.id}/editar`}
                      >
                        <span><i className="fa-light fa-pen-to-square"></i></span>
                      </Link>
                      <button
                        type="button"
                        className="bd-default-tooltip delete border-0 bg-transparent p-0"
                        onClick={() => handleDelete(teacher.id)}
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

export default DocentesListMain;
