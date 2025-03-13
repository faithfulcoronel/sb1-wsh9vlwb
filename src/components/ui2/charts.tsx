import React from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface ChartProps {
  type: 'line' | 'area' | 'bar' | 'pie' | 'donut' | 'radial';
  series: ApexAxisChartSeries | ApexNonAxisChartSeries;
  options?: ApexOptions;
  height?: number | string;
  width?: number | string;
  className?: string;
}

const defaultOptions: ApexOptions = {
  chart: {
    toolbar: {
      show: false,
    },
    zoom: {
      enabled: false,
    },
    background: 'transparent',
    foreColor: 'hsl(var(--foreground))',
  },
  colors: ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'],
  grid: {
    borderColor: 'hsl(var(--border))',
    padding: {
      top: -10,
      right: 10,
      bottom: 0,
      left: 10,
    },
  },
  stroke: {
    curve: 'smooth',
    width: 2,
  },
  theme: {
    mode: 'light',
  },
  tooltip: {
    theme: 'light',
    x: {
      show: false,
    },
  },
  xaxis: {
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
    labels: {
      style: {
        colors: 'hsl(var(--muted-foreground))',
        fontFamily: 'inherit',
      },
    },
  },
  yaxis: {
    labels: {
      style: {
        colors: 'hsl(var(--muted-foreground))',
        fontFamily: 'inherit',
      },
    },
  },
  legend: {
    position: 'top',
    horizontalAlign: 'right',
    labels: {
      colors: 'hsl(var(--foreground))',
    },
  },
  states: {
    hover: {
      filter: {
        type: 'lighten',
        value: 0.1,
      }
    },
    active: {
      filter: {
        type: 'darken',
        value: 0.1,
      }
    }
  },
  plotOptions: {
    bar: {
      borderRadius: 8,
      columnWidth: '60%',
    },
    pie: {
      donut: {
        labels: {
          show: true,
          name: {
            show: true,
            color: 'hsl(var(--foreground))',
          },
          value: {
            show: true,
            color: 'hsl(var(--foreground))',
          },
          total: {
            show: true,
            color: 'hsl(var(--foreground))',
          }
        }
      }
    }
  }
};

export function Charts({
  type,
  series,
  options = {},
  height = 350,
  width = '100%',
  className,
}: ChartProps) {
  // Deep merge default options with provided options
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    chart: {
      ...defaultOptions.chart,
      ...options.chart,
      type,
    },
    // Ensure theme-specific options are properly merged
    theme: {
      ...defaultOptions.theme,
      ...options.theme,
    },
    colors: options.colors || defaultOptions.colors,
    plotOptions: {
      ...defaultOptions.plotOptions,
      ...options.plotOptions,
    },
  };

  return (
    <div className={className}>
      <Chart
        type={type}
        series={series}
        options={mergedOptions}
        height={height}
        width={width}
      />
    </div>
  );
}