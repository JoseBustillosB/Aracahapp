
import { Link } from 'react-router';
import { styled } from '@mui/material';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// import { ReactComponent as LogoDark } from 'src/assets/images/logos/dark-logo.svg';
//import LogoDark from 'src/assets/images/logos/dark-logo.svg';

//Si queremos que el logo se adapte automáticamente a pantallas más pequeñas:
//style={{ maxHeight: 60, maxWidth: '80%', objectFit: 'contain' }}


import AracahLogo from 'src/assets/images/logos/Aracah_logo.png';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import LogoDarkRTL from 'src/assets/images/logos/logo-icon.svg';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import LogoLight from 'src/assets/images/logos/light-logo.svg';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import LogoLightRTL from 'src/assets/images/logos/light-rtl-logo.svg';

const AuthLogo = () => {


  const LinkStyled = styled(Link)(() => ({
    height: '64px',
    width:  '180px',
    overflow: 'hidden',
    display: 'block',
    
  }));

  return (
    <LinkStyled
      to="/"
      style={{
        display: 'flex',
        alignItems: 'center',
      }}
    >
    <img src={AracahLogo} alt="logo" style={{ width: '174px', height: '64px', borderRadius: 6 }} />  
    
    </LinkStyled>
  );
};

export default AuthLogo;



