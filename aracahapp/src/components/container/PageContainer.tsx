import React from 'react';
import { Helmet } from 'react-helmet';

/**
 * Componente contenedor para establecer el título de la página
 * y un meta description opcional.
 *
 * Uso:
 * <PageContainer title="Login" description="Inicio de sesión en Sistema Aracah">
 *   <LoginForm />
 * </PageContainer>
 */

type Props = {
  title?: string;
  description?: string;
  children: React.ReactNode;
};

const PageContainer: React.FC<Props> = ({ title, description, children }) => {
  const pageTitle = title ? `${title} | Sistema Aracah` : 'Sistema Aracah';

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        {description && <meta name="description" content={description} />}
      </Helmet>
      {children}
    </>
  );
};

export default PageContainer;
