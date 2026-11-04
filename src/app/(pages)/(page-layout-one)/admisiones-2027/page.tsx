import { Metadata } from "next";
import AdmissionsMain from "@/components/admissions/AdmissionsMain";
import Wrapper from "@/layout/DefaultWrapper";
import { loadAdmissionsCatalog } from "@/lib/admissions/catalog";
import type { AdmissionsCatalog } from "@/lib/admissions/catalog-types";

// Catalogs change from the admin side; read them on every request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admisiones 2027",
  description: "Solicite información sobre el proceso de admisión del Instituto San José del Carmen.",
  // Reachable by URL only until launch.
  robots: { index: false, follow: false },
};

async function getCatalog(): Promise<AdmissionsCatalog | null> {
  try {
    return await loadAdmissionsCatalog();
  } catch (error) {
    console.error(
      "[admissions] Catalog unavailable:",
      error instanceof Error ? error.message : "unknown"
    );
    return null;
  }
}

const AdmisionesPage = async () => {
  const catalog = await getCatalog();

  return (
    <Wrapper>
      <main>
        <AdmissionsMain catalog={catalog} />
      </main>
    </Wrapper>
  );
};

export default AdmisionesPage;
