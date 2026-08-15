"use client";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Assignment, Section, Teacher } from "@/interFace/evaluacion-docente-interface";

const AsignacionesMatrixMain = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [pendingTeacherId, setPendingTeacherId] = useState<string | null>(null);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [teachersRes, sectionsRes, assignmentsRes] = await Promise.all([
        fetch("/api/evaluacion-docente-admin/docentes"),
        fetch("/api/evaluacion-docente-admin/secciones"),
        fetch("/api/evaluacion-docente-admin/asignaciones"),
      ]);
      const teachersData = await teachersRes.json();
      const sectionsData = await sectionsRes.json();
      const assignmentsData = await assignmentsRes.json();

      if (!teachersRes.ok) throw new Error(teachersData.error);
      if (!sectionsRes.ok) throw new Error(sectionsData.error);
      if (!assignmentsRes.ok) throw new Error(assignmentsData.error);

      setTeachers(teachersData.teachers);
      setSections(sectionsData.sections);
      setAssignments(assignmentsData.assignments);
      setSelectedSectionId((current) => current || sectionsData.sections[0]?.id || "");
    } catch {
      toast.error("No se pudo cargar la información de asignaciones.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const assignedTeacherIds = useMemo(
    () =>
      new Set(
        assignments.filter((a) => a.section_id === selectedSectionId).map((a) => a.teacher_id)
      ),
    [assignments, selectedSectionId]
  );

  const toggleAssignment = async (teacherId: string) => {
    if (!selectedSectionId) return;
    setPendingTeacherId(teacherId);
    try {
      const existing = assignments.find(
        (a) => a.section_id === selectedSectionId && a.teacher_id === teacherId
      );

      if (existing) {
        const res = await fetch(`/api/evaluacion-docente-admin/asignaciones/${existing.id}`, {
          method: "DELETE",
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);
        setAssignments((prev) => prev.filter((a) => a.id !== existing.id));
      } else {
        const res = await fetch("/api/evaluacion-docente-admin/asignaciones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teacher_id: teacherId, section_id: selectedSectionId }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);
        setAssignments((prev) => [...prev, result.assignment]);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar la asignación.");
    } finally {
      setPendingTeacherId(null);
    }
  };

  return (
    <div className="col-xl-9 col-lg-9 col-md-8">
      <div className="bd-dashboard-inner">
        <div className="bd-dashboard-title-inner">
          <h4 className="bd-dashboard-title">Asignaciones</h4>
        </div>

        {isLoading ? (
          <p className="mt-30">Cargando...</p>
        ) : sections.length === 0 ? (
          <p className="mt-30">Primero crea al menos una sección.</p>
        ) : (
          <>
            <div className="form-input-box mt-30 mb-20" style={{ maxWidth: 320 }}>
              <div className="form-input-title">
                <label htmlFor="sectionSelect">Sección</label>
              </div>
              <div className="form-input">
                <select
                  id="sectionSelect"
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                >
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="mb-20">
              Selecciona los docentes que dictan clases en esta sección:
            </p>

            <div className="bd-dashboard-table table-responsive">
              <table className="table table-bordered table-head-bg">
                <thead>
                  <tr>
                    <th>Asignado</th>
                    <th>Docente</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.length === 0 && (
                    <tr>
                      <td colSpan={2}>No hay docentes registrados todavía.</td>
                    </tr>
                  )}
                  {teachers.map((teacher) => (
                    <tr key={teacher.id}>
                      <td style={{ width: 80 }}>
                        <input
                          id={`assign-${teacher.id}`}
                          type="checkbox"
                          checked={assignedTeacherIds.has(teacher.id)}
                          disabled={pendingTeacherId === teacher.id}
                          onChange={() => toggleAssignment(teacher.id)}
                        />
                        <label
                          htmlFor={`assign-${teacher.id}`}
                          className="mb-0"
                          style={{ display: "inline-block", width: 20, height: 22 }}
                        >
                          <span className="visually-hidden">Asignar a {teacher.full_name}</span>
                        </label>
                      </td>
                      <td>
                        <p>
                          {teacher.full_name}
                          {!teacher.is_active && " (inactivo)"}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AsignacionesMatrixMain;
