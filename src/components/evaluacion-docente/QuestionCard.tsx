import React from "react";
import Image from "next/image";
import type { Teacher } from "@/interFace/evaluacion-docente-interface";
import { SCORE_OPTIONS } from "@/interFace/evaluacion-docente-interface";

interface QuestionCardProps {
  teacher: Teacher;
  questionText: string;
  onAnswer: (score: 1 | 2 | 3 | 4) => void;
  disabled?: boolean;
}

const QuestionCard = ({ teacher, questionText, onAnswer, disabled }: QuestionCardProps) => {
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
      <p className="eval-card-question mt-10 mb-30">{questionText}</p>

      <div className="eval-card-options">
        {SCORE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className="bd-btn btn-outline-primary eval-option-btn"
            disabled={disabled}
            onClick={() => onAnswer(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuestionCard;
