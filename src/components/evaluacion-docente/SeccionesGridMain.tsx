"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Section } from "@/interFace/evaluacion-docente-interface";
import SectionCard from "./SectionCard";

const SeccionesGridMain = () => {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("evalGateOpen")) {
      router.replace("/evaluacion-docente");
      return;
    }

    const load = async () => {
      try {
        const res = await fetch("/api/evaluacion-docente/secciones");
        if (res.status === 401) {
          router.replace("/evaluacion-docente");
          return;
        }
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);
        setSections(result.sections);
      } catch {
        toast.error("No se pudieron cargar las secciones.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="eval-section">
      <div className="container">
        <div className="text-center mb-40">
          <h3>¿Qué sección vas a evaluar?</h3>
          <p>Selecciona tu curso y sección para comenzar.</p>
        </div>

        {isLoading && <p className="text-center">Cargando secciones...</p>}
        {!isLoading && sections.length === 0 && (
          <p className="text-center">No hay secciones disponibles para evaluar en este momento.</p>
        )}

        <div className="row gy-30 justify-content-center">
          {sections.map((section) => (
            <SectionCard key={section.id} section={section} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SeccionesGridMain;
