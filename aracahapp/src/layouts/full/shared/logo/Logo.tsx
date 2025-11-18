import { Link } from 'react-router-dom';
import { Typography, Box, styled } from '@mui/material';

const LinkStyled = styled(Link)(() => ({
  height: '64px',
  width: '180px',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
}));

const Logo = () => {
  return (
    <LinkStyled to="/dashboard">
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{
            background: 'linear-gradient(90deg, #ffffff, #d8e3ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: 1.8,
            textTransform: 'uppercase',
            fontSize: '1.4rem',
          }}
        >
        ARACAH
        </Typography>
      </Box>
    </LinkStyled>
  );
};

export default Logo;
