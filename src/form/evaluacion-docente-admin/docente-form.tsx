"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ErrorMsg from "@/form/auth/ErrorMsg";
import type { Teacher } from "@/interFace/evaluacion-docente-interface";

type DocenteFormData = {
  full_name: string;
  is_active: boolean;
};

interface DocenteFormProps {
  teacher?: Teacher;
}

const DocenteForm = ({ teacher }: DocenteFormProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>(teacher?.photo_url || "");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DocenteFormData>({
    defaultValues: {
      full_name: teacher?.full_name || "",
      is_active: teacher?.is_active ?? true,
    },
  });

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadPhoto = async (teacherId: string) => {
    if (!photoFile) return;
    const formData = new FormData();
    formData.append("file", photoFile);
    const res = await fetch(`/api/evaluacion-docente-admin/docentes/${teacherId}/foto`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const result = await res.json();
      throw new Error(result.error || "No se pudo subir la foto.");
    }
  };

  const onSubmit = async (data: DocenteFormData) => {
    setIsSubmitting(true);
    try {
      let teacherId = teacher?.id;

      if (teacher) {
        const res = await fetch(`/api/evaluacion-docente-admin/docentes/${teacher.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "No se pudo actualizar el docente.");
      } else {
        const res = await fetch("/api/evaluacion-docente-admin/docentes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "No se pudo crear el docente.");
        teacherId = result.teacher.id;
      }

      if (teacherId) {
        await uploadPhoto(teacherId);
      }

      toast.success(teacher ? "Docente actualizado." : "Docente creado.");
      router.push("/evaluacion-docente-admin/docentes");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="bd-cover-details-thumb details-slide-full mb-30">
        <div className="bd-cover-thumb-chnage">
          <div className="bd-cover-thumb-preview">
            <div
              className="bd-cover-thumb-preview-box"
              style={{
                backgroundImage: preview ? `url(${preview})` : undefined,
                backgroundColor: preview ? undefined : "#eee",
              }}
            />
          </div>
          <div className="bd-cover-thumb-edit">
            <input type="file" id="photoUpload" accept="image/*" onChange={handlePhotoChange} />
            <label htmlFor="photoUpload">Agregar / Cambiar foto</label>
          </div>
        </div>
      </div>

      <div className="form-input-box mb-20">
        <div className="form-input-title">
          <label htmlFor="full_name">Nombre completo <span>*</span></label>
        </div>
        <div className="form-input">
          <input
            {...register("full_name", { required: "El nombre completo es obligatorio" })}
            id="full_name"
            type="text"
            placeholder="Ej. María Fernández Solano"
          />
          <ErrorMsg error={errors.full_name?.message} />
        </div>
      </div>

      <div className="form-input-box mb-20">
        <div className="checkout-option">
          <input {...register("is_active")} id="is_active" type="checkbox" />
          <label htmlFor="is_active">Docente activo</label>
        </div>
      </div>

      <div className="bd-change-btn">
        <button type="submit" className="bd-btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : teacher ? "Guardar cambios" : "Crear docente"}
        </button>
      </div>
    </form>
  );
};

export default DocenteForm;
