import EvaluacionAdminLayout from "@/layout/EvaluacionAdminLayout";
import PreguntaForm from "@/form/evaluacion-docente-admin/pregunta-form";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import React from "react";

interface EditarPreguntaPageProps {
  params: Promise<{ id: string }>;
}

const EditarPreguntaPage = async ({ params }: EditarPreguntaPageProps) => {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: question } = await supabase.from("questions").select("*").eq("id", id).single();

  if (!question) {
    notFound();
  }

  return (
    <EvaluacionAdminLayout title="Editar pregunta">
      <div className="col-xl-9 col-lg-9 col-md-8">
        <div className="bd-dashboard-inner">
          <div className="bd-profile-update-area">
            <PreguntaForm question={question} />
          </div>
        </div>
      </div>
    </EvaluacionAdminLayout>
  );
};

export default EditarPreguntaPage;
