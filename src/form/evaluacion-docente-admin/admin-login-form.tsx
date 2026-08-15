"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ErrorMsg from "@/form/auth/ErrorMsg";

type AdminLoginFormData = {
  email: string;
  password: string;
};

const AdminLoginForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginFormData>();

  const onSubmit = async (data: AdminLoginFormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/evaluacion-docente-admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "No se pudo iniciar sesión.");
        return;
      }

      router.push("/evaluacion-docente-admin/docentes");
      router.refresh();
    } catch {
      toast.error("Error de conexión. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="form-input-box mb-20">
        <div className="form-input-title">
          <label htmlFor="emailAddress">Correo electrónico <span>*</span></label>
        </div>
        <div className="form-input">
          <input
            {...register("email", {
              required: "El correo es obligatorio",
              pattern: {
                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                message: "Formato de correo inválido",
              },
            })}
            id="emailAddress"
            type="email"
            placeholder="admin@correo.com"
          />
          <ErrorMsg error={errors.email?.message} />
        </div>
      </div>

      <div className="form-input-box mb-20">
        <div className="form-input-title">
          <label htmlFor="password">Contraseña <span>*</span></label>
        </div>
        <div className="form-input">
          <input
            {...register("password", { required: "La contraseña es obligatoria" })}
            id="password"
            type="password"
            placeholder="Tu contraseña"
            autoComplete="current-password"
          />
          <ErrorMsg error={errors.password?.message} />
        </div>
      </div>

      <div className="bd-sign-btn">
        <button type="submit" className="bd-btn btn-primary w-100" disabled={isSubmitting}>
          {isSubmitting ? "Ingresando..." : "Ingresar"}
        </button>
      </div>
    </form>
  );
};

export default AdminLoginForm;
