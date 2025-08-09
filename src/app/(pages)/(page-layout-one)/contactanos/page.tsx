import ContactUsMain from '@/components/pages/page-layout-one/contact-us/ContactUsMain';
import Wrapper from '@/layout/DefaultWrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contáctanos',
};

const ContactanosPage = () => {
  return (
    <>
      <Wrapper>
        <main>
          <ContactUsMain />
        </main>
      </Wrapper>
    </>
  );
};

export default ContactanosPage;

