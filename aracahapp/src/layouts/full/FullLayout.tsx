import { FC } from 'react';
import { styled, Container, Box, useTheme } from '@mui/material';
import { Outlet } from 'react-router';
import Sidebar from './vertical/sidebar/Sidebar';
import Header from './vertical/header/Header';
import Footer from './shared/footer/Footer';

const MainWrapper = styled('div')(() => ({}));

const PageWrapper = styled('div')(() => ({
  display: 'flex',
  flexGrow: 1,
  flexDirection: 'column',
  zIndex: 1,
  backgroundColor: 'transparent',
}));

const FullLayout: FC = () => {
  const theme = useTheme();

  return (
    <>
      <MainWrapper>
        {/* Header */}
        <Header />
        {/* Sidebar */}
        <Sidebar />

        {/* Contenedor de página */}
        <PageWrapper
          className="page-wrapper"
          sx={{
            ...({
              [theme.breakpoints.up('lg')]: {
                ml: `256px`, // ancho del sidebar cuando está anclado
              },
            }),
            marginTop: '64px', // ⬅️ altura del header (ToolbarStyled)
          }}
        >
          <Container sx={{ maxWidth: 'lg' }}>
            <Box mt={4} sx={{ minHeight: 'calc(100vh - 260px)' }}>
              <Outlet />
            </Box>
            <Footer />
          </Container>
        </PageWrapper>
      </MainWrapper>
    </>
  );
};

export default FullLayout;
