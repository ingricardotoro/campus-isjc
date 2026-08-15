import React from "react";

interface InstructionsCardProps {
  teacherCount: number;
  onStart: () => void;
}

const InstructionsCard = ({ teacherCount, onStart }: InstructionsCardProps) => {
  return (
    <div className="eval-card text-center">
      <h4 className="mb-20">Antes de comenzar</h4>
      <ul className="eval-instructions-list text-start mb-30">
        <li>Esta evaluación es <strong>totalmente anónima</strong>: no se registra tu nombre ni ningún dato que te identifique.</li>
        <li>Vas a evaluar a los <strong>{teacherCount}</strong> docente{teacherCount === 1 ? "" : "s"} asignado{teacherCount === 1 ? "" : "s"} a esta sección, uno a la vez.</li>
        <li>Responde cada pregunta con <strong>seriedad y profesionalismo</strong>. Tu opinión ayuda a mejorar la calidad educativa de la institución.</li>
        <li>Todas las preguntas son obligatorias, excepto la última pregunta de opinión de cada docente, que es opcional.</li>
      </ul>
      <button type="button" className="bd-btn btn-primary" onClick={onStart}>
        Comenzar evaluación
      </button>
    </div>
  );
};

export default InstructionsCard;
