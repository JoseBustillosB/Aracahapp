import { Link } from 'react-router-dom';
import { styled } from '@mui/material';
import AracahLogo from 'src/assets/images/logos/Aracah_logo.png';

const LinkStyled = styled(Link)(() => ({
  height: '64px',
  width: '180px',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textDecoration: 'none',
}));

const AuthLogo = () => {
  return (
    <LinkStyled to="/auth/login">
      <img
        src={AracahLogo}
        alt="Tapicería Aracah"
        style={{
          maxHeight: 64,
          maxWidth: '100%',
          objectFit: 'contain',
          borderRadius: 6,
        }}
      />
    </LinkStyled>
  );
};

export default AuthLogo;
