import { axisClasses, legendClasses, chartsGridClasses } from '@mui/x-charts';
import { gray } from '../../../shared-theme/themePrimitives';

export const chartsCustomizations = {
  MuiChartsAxis: {
    styleOverrides: {
      root: {
        [`& .${axisClasses.line}`]: {
          stroke: gray[300],
        },
        [`& .${axisClasses.tick}`]: { 
          stroke: gray[300],
        },
        [`& .${axisClasses.tickLabel}`]: {
          fill: gray[500],
          fontWeight: 500,
        },
      },
    },
  },
  MuiChartsTooltip: {
    styleOverrides: {
      mark: {
        ry: 6,
        boxShadow: 'none',
        //border: `1px solid ${gray[300]}`,
      },
      table: {
        //border: `1px solid ${gray[300]}`,
        borderRadius: 4,
        background: 'hsl(0, 0%, 100%)',
      },
    },
  },
  MuiChartsLegend: {
    styleOverrides: {
      root: {
        [`& .${legendClasses.mark}`]: {
          ry: 6,
        },
      },
    },
  },
  MuiChartsGrid: {
    styleOverrides: {
      root: {
        [`& .${chartsGridClasses.line}`]: {
          stroke: gray[200],
          strokeDasharray: '4 2',
          strokeWidth: 0.8,
        },
      },
    },
  },
};
