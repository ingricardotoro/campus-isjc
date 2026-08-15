import EvaluacionAdminLayout from "@/layout/EvaluacionAdminLayout";
import SeccionForm from "@/form/evaluacion-docente-admin/seccion-form";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import React from "react";

interface EditarSeccionPageProps {
  params: Promise<{ id: string }>;
}

const EditarSeccionPage = async ({ params }: EditarSeccionPageProps) => {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: section } = await supabase.from("sections").select("*").eq("id", id).single();

  if (!section) {
    notFound();
  }

  return (
    <EvaluacionAdminLayout title="Editar sección">
      <div className="col-xl-9 col-lg-9 col-md-8">
        <div className="bd-dashboard-inner">
          <div className="bd-profile-update-area">
            <SeccionForm section={section} />
          </div>
        </div>
      </div>
    </EvaluacionAdminLayout>
  );
};

export default EditarSeccionPage;
