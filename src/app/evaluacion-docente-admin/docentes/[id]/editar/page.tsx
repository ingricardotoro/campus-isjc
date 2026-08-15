import EvaluacionAdminLayout from "@/layout/EvaluacionAdminLayout";
import DocenteForm from "@/form/evaluacion-docente-admin/docente-form";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import React from "react";

interface EditarDocentePageProps {
  params: Promise<{ id: string }>;
}

const EditarDocentePage = async ({ params }: EditarDocentePageProps) => {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: teacher } = await supabase.from("teachers").select("*").eq("id", id).single();

  if (!teacher) {
    notFound();
  }

  return (
    <EvaluacionAdminLayout title="Editar docente">
      <div className="col-xl-9 col-lg-9 col-md-8">
        <div className="bd-dashboard-inner">
          <div className="bd-profile-update-area">
            <DocenteForm teacher={teacher} />
          </div>
        </div>
      </div>
    </EvaluacionAdminLayout>
  );
};

export default EditarDocentePage;
