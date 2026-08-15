import React, { useState } from "react";
import Image from "next/image";
import type { Teacher } from "@/interFace/evaluacion-docente-interface";

interface TeacherOpinionCardProps {
  teacher: Teacher;
  onSubmit: (comment: string) => void;
  disabled?: boolean;
}

const TeacherOpinionCard = ({ teacher, onSubmit, disabled }: TeacherOpinionCardProps) => {
  const [comment, setComment] = useState("");

  return (
    <div className="eval-card text-center">
      <div className="eval-card-photo">
        {teacher.photo_url ? (
          <Image src={teacher.photo_url} alt={teacher.full_name} fill sizes="140px" style={{ objectFit: "cover" }} />
        ) : (
          <i className="fa-light fa-user" />
        )}
      </div>
      <h5 className="eval-card-teacher mt-20">{teacher.full_name}</h5>
      <p className="eval-card-question mt-10 mb-20">
        Pregunta opcional: ¿Deseas dejar una breve opinión sobre este/a docente?
      </p>

      <div className="form-input-box mb-20 text-start">
        <div className="form-input">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Escribe aquí tu opinión (opcional)..."
          />
        </div>
      </div>

      <div className="eval-card-options">
        <button
          type="button"
          className="bd-btn btn-outline-primary eval-option-btn"
          disabled={disabled}
          onClick={() => onSubmit("")}
        >
          Omitir
        </button>
        <button
          type="button"
          className="bd-btn btn-primary eval-option-btn"
          disabled={disabled || !comment.trim()}
          onClick={() => onSubmit(comment)}
        >
          Enviar
        </button>
      </div>
    </div>
  );
};

export default TeacherOpinionCard;
