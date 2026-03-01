import React from "react";
import { Breadcrumbs, Typography } from "@mui/material";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";
import { breadcrumbsClasses } from "@mui/material/Breadcrumbs";
import { styled } from "@mui/system";

// Custom values for spacing and colors
const customSpacing = (topBottom, leftRight) => `${topBottom * 8}px ${leftRight * 8}px`; // Example: 8px is a base unit
const customColors = {
  separatorColor: '#A0A0A0', // Example color for separator
  disabledColor: '#E0E0E0',  // Example color for disabled items
};

const StyledBreadcrumbs = styled(Breadcrumbs)({
  margin: customSpacing(1, 0), // Replacing theme.spacing(1, 0)
  [`& .${breadcrumbsClasses.separator}`]: {
    color: customColors.separatorColor, // Replacing theme.palette.action.disabled
    margin: 1,
  },
  [`& .${breadcrumbsClasses.ol}`]: {
    alignItems: 'center',
  },
});

export default function NavbarBreadcrumbs() {
  return (
    <StyledBreadcrumbs
      aria-label="breadcrumb"
      separator={<NavigateNextRoundedIcon fontSize="small" />}
    >
      <Typography variant="body1">Dashboard</Typography>
      <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 600 }}>
        Home
      </Typography>
    </StyledBreadcrumbs>
  );
}
