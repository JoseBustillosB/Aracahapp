'use client';
import { Box, Typography } from "@mui/material";

const Footer = () => {
  return (
    <Box sx={{ pt: 6, pb: 3, textAlign: "center" }}>
      <Typography
        sx={{ color: "text.secondary", fontSize: "0.9rem" }}
      >
        © {new Date().getFullYear()} All rights reserved by Aracah
      </Typography>
    </Box>
  );
};

export default Footer;
