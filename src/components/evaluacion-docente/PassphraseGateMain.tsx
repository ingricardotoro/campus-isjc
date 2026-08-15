"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Image from "next/image";
import ErrorMsg from "@/form/auth/ErrorMsg";
import logo from "../../../public/assets/images/logo/logo_isjc_hd.webp";

type GateFormData = {
  passphrase: string;
};

const PassphraseGateMain = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GateFormData>();

  const onSubmit = async (data: GateFormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/evaluacion-docente/acceso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Clave incorrecta.");
        return;
      }

      localStorage.setItem("evalGateOpen", "1");
      router.push("/evaluacion-docente/secciones");
    } catch {
      toast.error("Error de conexión. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="eval-section eval-gate">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-5 col-lg-6 col-md-8 col-12">
            <div className="text-center mb-30">
              <Image src={logo} alt="logo San José del Carmen" style={{ width: 140, height: "auto" }} className="mb-20" priority />
              <h3>Evaluación Docente</h3>
              <p>Ingresa la clave de acceso proporcionada por tu institución para continuar.</p>
            </div>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="form-input-box mb-20">
                <div className="form-input">
                  <input
                    {...register("passphrase", { required: "La clave de acceso es obligatoria" })}
                    type="password"
                    placeholder="Clave de acceso"
                    autoFocus
                  />
                  <ErrorMsg error={errors.passphrase?.message} />
                </div>
              </div>
              <div className="bd-sign-btn">
                <button type="submit" className="bd-btn btn-primary w-100" disabled={isSubmitting}>
                  {isSubmitting ? "Verificando..." : "Continuar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PassphraseGateMain;
