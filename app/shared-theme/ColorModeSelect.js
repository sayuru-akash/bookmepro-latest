import * as React from 'react';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

export default function ColorModeSelect(props) {
  // Remove mode and setMode as they're unnecessary
  return (
    <Select
      value="light" // Default to "light" mode
      SelectDisplayProps={{
        'data-screenshot': 'toggle-mode',
      }}
      disabled // Disable the select dropdown as light mode is fixed
      {...props}
    >
      <MenuItem value="light">Light</MenuItem>
    </Select>
  );
}
