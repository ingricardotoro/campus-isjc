"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ErrorMsg from "@/form/auth/ErrorMsg";
import type { Question } from "@/interFace/evaluacion-docente-interface";

type PreguntaFormData = {
  text: string;
  is_active: boolean;
};

interface PreguntaFormProps {
  question?: Question;
}

const PreguntaForm = ({ question }: PreguntaFormProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PreguntaFormData>({
    defaultValues: {
      text: question?.text || "",
      is_active: question?.is_active ?? true,
    },
  });

  const onSubmit = async (data: PreguntaFormData) => {
    setIsSubmitting(true);
    try {
      const url = question
        ? `/api/evaluacion-docente-admin/preguntas/${question.id}`
        : "/api/evaluacion-docente-admin/preguntas";
      const res = await fetch(url, {
        method: question ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "No se pudo guardar la pregunta.");

      toast.success(question ? "Pregunta actualizada." : "Pregunta creada.");
      router.push("/evaluacion-docente-admin/preguntas");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="form-input-box mb-20">
        <div className="form-input-title">
          <label htmlFor="text">Texto de la pregunta <span>*</span></label>
        </div>
        <div className="form-input">
          <textarea
            {...register("text", { required: "El texto de la pregunta es obligatorio" })}
            id="text"
            rows={3}
            placeholder="Ej. El/la docente explica los temas de manera clara y fácil de entender."
          />
          <ErrorMsg error={errors.text?.message} />
        </div>
      </div>

      <div className="form-input-box mb-20">
        <div className="checkout-option">
          <input {...register("is_active")} id="is_active" type="checkbox" />
          <label htmlFor="is_active">Pregunta activa</label>
        </div>
      </div>

      <div className="bd-change-btn">
        <button type="submit" className="bd-btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : question ? "Guardar cambios" : "Crear pregunta"}
        </button>
      </div>
    </form>
  );
};

export default PreguntaForm;
