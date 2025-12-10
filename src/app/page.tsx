//@refresh
import UniversityMain from "@/components/university/UniversityMain";
import Wrapper from "@/layout/DefaultWrapper";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Instituto San Jose del Carmen - Tegucigalpa Honduras",
};

const Home = () => {
  return (
    <>
        <Wrapper>
          <main className="main-area">
            <UniversityMain />
          </main>
        </Wrapper>
    </>
  );
}

export default Home