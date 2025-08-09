import TermsConditionsMain from '@/components/pages/page-layout-one/terms-conditions/TermsConditionsMain';
import Wrapper from '@/layout/DefaultWrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Matrícula',
};

const MatriculaPage = () => {
  return (
    <>
      <Wrapper>
        <main>
          <TermsConditionsMain />
        </main>
      </Wrapper>
    </>
  );
};

export default MatriculaPage;

