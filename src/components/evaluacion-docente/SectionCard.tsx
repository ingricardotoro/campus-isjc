"use client";
import React from "react";
import { useRouter } from "next/navigation";
import type { Section } from "@/interFace/evaluacion-docente-interface";

interface SectionCardProps {
  section: Section;
}

const SectionCard = ({ section }: SectionCardProps) => {
  const router = useRouter();

  return (
    <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6">
      <button
        type="button"
        className="bd-category-wrapper style-one w-100 border-0 text-start"
        onClick={() => router.push(`/evaluacion-docente/evaluar?sectionId=${section.id}`)}
      >
        <div className="bd-category-item">
          <span className="bd-category-icon">
            <i className="fa-light fa-people-group" />
          </span>
          <div className="bd-category-content">
            <h6 className="bd-category-title">{section.label}</h6>
            <span className="bd-category-total">Evaluar esta sección</span>
          </div>
        </div>
      </button>
    </div>
  );
};

export default SectionCard;
