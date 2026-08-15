import React from "react";

interface ProgressIndicatorProps {
  teacherIndex: number;
  teacherCount: number;
  questionIndex: number;
  questionCount: number;
}

const ProgressIndicator = ({
  teacherIndex,
  teacherCount,
  questionIndex,
  questionCount,
}: ProgressIndicatorProps) => {
  const questionProgress = ((questionIndex + 1) / questionCount) * 100;
  const teacherProgress = ((teacherIndex + 1) / teacherCount) * 100;

  return (
    <div className="eval-progress mb-30">
      <div className="d-flex justify-content-between mb-5">
        <span>Docente {teacherIndex + 1} de {teacherCount}</span>
        <span>Pregunta {questionIndex + 1} de {questionCount}</span>
      </div>
      <div className="eval-progress-track mb-10">
        <div className="eval-progress-fill" style={{ width: `${teacherProgress}%` }} />
      </div>
      <div className="eval-progress-track eval-progress-track-sm">
        <div className="eval-progress-fill" style={{ width: `${questionProgress}%` }} />
      </div>
    </div>
  );
};

export default ProgressIndicator;
