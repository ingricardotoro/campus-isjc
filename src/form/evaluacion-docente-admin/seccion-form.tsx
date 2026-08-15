"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ErrorMsg from "@/form/auth/ErrorMsg";
import type { Section } from "@/interFace/evaluacion-docente-interface";

type SeccionFormData = {
  grade: string;
  section_letter: string;
  is_active: boolean;
};

interface SeccionFormProps {
  section?: Section;
}

const SeccionForm = ({ section }: SeccionFormProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SeccionFormData>({
    defaultValues: {
      grade: section?.grade || "",
      section_letter: section?.section_letter || "",
      is_active: section?.is_active ?? true,
    },
  });

  const onSubmit = async (data: SeccionFormData) => {
    setIsSubmitting(true);
    try {
      const url = section
        ? `/api/evaluacion-docente-admin/secciones/${section.id}`
        : "/api/evaluacion-docente-admin/secciones";
      const res = await fetch(url, {
        method: section ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "No se pudo guardar la sección.");

      toast.success(section ? "Sección actualizada." : "Sección creada.");
      router.push("/evaluacion-docente-admin/secciones");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="row">
        <div className="col-md-6">
          <div className="form-input-box mb-20">
            <div className="form-input-title">
              <label htmlFor="grade">Grado <span>*</span></label>
            </div>
            <div className="form-input">
              <input
                {...register("grade", { required: "El grado es obligatorio" })}
                id="grade"
                type="text"
                placeholder="Ej. 7, 9, 10"
              />
              <ErrorMsg error={errors.grade?.message} />
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="form-input-box mb-20">
            <div className="form-input-title">
              <label htmlFor="section_letter">Letra de sección <span>*</span></label>
            </div>
            <div className="form-input">
              <input
                {...register("section_letter", { required: "La letra es obligatoria" })}
                id="section_letter"
                type="text"
                placeholder="Ej. A, B, C"
                maxLength={2}
              />
              <ErrorMsg error={errors.section_letter?.message} />
            </div>
          </div>
        </div>
      </div>

      <div className="form-input-box mb-20">
        <div className="checkout-option">
          <input {...register("is_active")} id="is_active" type="checkbox" />
          <label htmlFor="is_active">Sección activa</label>
        </div>
      </div>

      <div className="bd-change-btn">
        <button type="submit" className="bd-btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : section ? "Guardar cambios" : "Crear sección"}
        </button>
      </div>
    </form>
  );
};

export default SeccionForm;
