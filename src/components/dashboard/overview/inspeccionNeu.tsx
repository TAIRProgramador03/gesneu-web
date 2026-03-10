'use client';

import * as React from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import { alpha, useTheme } from '@mui/material/styles';
import type { SxProps } from '@mui/material/styles';
import { ArrowClockwise as ArrowClockwiseIcon } from '@phosphor-icons/react/dist/ssr/ArrowClockwise';
import { ArrowRight as ArrowRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import type { ApexOptions } from 'apexcharts';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

import { Chart } from '@/components/core/chart';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { obtenerInspeccionesNeumaticosPorFechas } from '@/api/Neumaticos';
import { useUser } from '@/hooks/use-user';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

// Agregar declaración global para window.placasPorBarra
declare global {
  interface Window {
    placasPorBarra?: string[];
    kilometrosPorBarra?: string[];
    posicionesPorBarra?: string[];
    rawInspeccionData?: any[];
  }
}

export interface SalesProps {
  chartSeries?: { name: string; data: number[] }[];
  sx?: SxProps;
}

export function Sales({ chartSeries: _chartSeries, sx }: SalesProps): React.JSX.Element {
  const chartOptions = useChartOptions();
  const { user } = useUser();
  const [startDate, setStartDate] = React.useState<dayjs.Dayjs | null>(dayjs().subtract(4, 'day'));
  const [endDate, setEndDate] = React.useState<dayjs.Dayjs | null>(dayjs());
  const [chartSeries, setChartSeries] = React.useState<{ name: string; data: number[] }[]>([]);
  const [categories, setCategories] = React.useState<string[]>([]);
  const [plotlyData, setPlotlyData] = React.useState<any[]>([]);
  const [allSeriesOptions, setAllSeriesOptions] = React.useState<string[]>([]);
  const [selectedSeries, setSelectedSeries] = React.useState<string[]>([]);
  const [fullChartSeries, setFullChartSeries] = React.useState<{ name: string; data: number[] }[]>([]);
  const [fullXCategories, setFullXCategories] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (startDate && endDate && user?.usuario) {
      const fetchData = async () => {
        try {
          const data = await obtenerInspeccionesNeumaticosPorFechas({
            usuario: user.usuario,
            fechaInicio: startDate.format('YYYY-MM-DD'),
            fechaFin: endDate.format('YYYY-MM-DD'),
          });

          // Agrupar por FECHA_REGISTRO
          const groupByFecha: Record<string, any[]> = {};
          data.forEach((item: any) => {
            if (!groupByFecha[item.FECHA_REGISTRO]) groupByFecha[item.FECHA_REGISTRO] = [];
            groupByFecha[item.FECHA_REGISTRO].push(item);
          });

          // Ordenar fechas
          const fechas = Object.keys(groupByFecha).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

          // Placas únicas por fecha
          const placasPorFecha: Record<string, string[]> = {};
          fechas.forEach(fecha => {
            placasPorFecha[fecha] = Array.from(new Set(groupByFecha[fecha].map((item: any) => item.PLACA.trim())));
          });

          // Una barra por cada (fecha, placa)
          const xCategories: string[] = [];
          fechas.forEach(fecha => {
            placasPorFecha[fecha].forEach(placa => {
              xCategories.push(`${fecha}|${placa}`);
            });
          });

          // Series = POSICION_NEU - CODIGO (5 posiciones apiladas)
          const allSeriesKeys = Array.from(
            new Set(data.map((item: any) => `${item.POSICION_NEU} - ${item.CODIGO}`))
          ) as string[];

          const series = allSeriesKeys.map((serieKey) => ({
            name: serieKey,
            data: xCategories.map((cat) => {
              const [fecha, placa] = cat.split('|');
              const found = groupByFecha[fecha]?.find(
                (item: any) => item.PLACA.trim() === placa && `${item.POSICION_NEU} - ${item.CODIGO}` === serieKey
              );
              return found ? found.REMANENTE : 0;
            }),
          }));

          // Placas únicas para el Autocomplete
          const allPlacas = Array.from(new Set(data.map((item: any) => item.PLACA.trim()))) as string[];

          if (xCategories.length === 0) {
            setFullXCategories([]);
            setFullChartSeries([]);
            setCategories([]);
            setChartSeries([]);
            setAllSeriesOptions([]);
            setSelectedSeries([]);
            return;
          }
          setFullXCategories(xCategories);
          setFullChartSeries(series);
          setAllSeriesOptions(allPlacas);
          setSelectedSeries(allPlacas);
          (window as any).rawInspeccionData = data;
        } catch (e) {
          setFullXCategories([]);
          setFullChartSeries([]);
          setCategories([]);
          setChartSeries([]);
        }
      };
      fetchData();
    }
  }, [startDate, endDate, user]);

  // Filtrar barras por placas seleccionadas
  React.useEffect(() => {
    if (fullXCategories.length === 0 || fullChartSeries.length === 0) {
      setCategories([]);
      setChartSeries([]);
      return;
    }

    const filteredIndices = fullXCategories
      .map((cat, i) => ({ cat, i }))
      .filter(({ cat }) => selectedSeries.includes(cat.split('|')[1]))
      .map(({ i }) => i);

    const filteredCategories = filteredIndices.map(i => {
      const [fecha, placa] = fullXCategories[i].split('|');
      return `${fecha} | ${placa}`;
    });
    const filteredPlacas = filteredIndices.map(i => fullXCategories[i].split('|')[1]);

    const filteredSeries = fullChartSeries
      .map(s => ({ ...s, data: filteredIndices.map(i => s.data[i]) }))
      .filter(s => s.data.some(v => v > 0));

    setCategories(filteredCategories);
    setChartSeries(filteredSeries);
    (window as any).placasPorBarra = filteredPlacas;
  }, [selectedSeries, fullChartSeries, fullXCategories]);

  return (
    <Card sx={sx}>
      <CardHeader
        action={
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
            <div style={{ display: 'flex', gap: 8 }}>
              <DatePicker
                label="Inicio"
                value={startDate}
                onChange={setStartDate}
                slotProps={{ textField: { size: 'small', variant: 'outlined' } }}
              />
              <span style={{ alignSelf: 'center' }}>-</span>
              <DatePicker
                label="Fin"
                value={endDate}
                onChange={setEndDate}
                slotProps={{ textField: { size: 'small', variant: 'outlined' } }}
                minDate={startDate ?? undefined}
              />
            </div>
          </LocalizationProvider>
        }
        title="Inspecciones por Vehiculo"
      />
      <CardContent sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
        <div style={{ flexGrow: 1, position: 'relative' }}>
          {/* Gráfico 2D actual */}
          <div style={{ position: 'relative', width: '100%' }}>
            {/* Overlay de placas arriba de cada barra */}
            {/* <BarPlatesOverlay categories={categories} /> */}
            <Chart height={350} options={{ ...chartOptions, xaxis: { ...chartOptions.xaxis, categories } }} series={chartSeries} type="bar" width="100%" />
          </div>
        </div>
        <Autocomplete
          multiple
          limitTags={10}
          options={allSeriesOptions}
          value={selectedSeries}
          onChange={(event, newValue) => {
            setSelectedSeries(newValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              label="Seleccionar Placas"
              placeholder="Placa"
            />
          )}
          sx={{ width: 300 }}
        />
      </CardContent>
      <Divider />
    </Card>
  );
}

function useChartOptions(): ApexOptions {
  const theme = useTheme();

  return {
    chart: { background: 'transparent', stacked: true, toolbar: { show: false } },
    dataLabels: {
      enabled: true,
      style: {
        colors: ['#fff'],
        fontWeight: 700,
        fontSize: '14px',
      },
      dropShadow: {
        enabled: true,
        top: 1,
        left: 1,
        blur: 1,
        color: '#222',
        opacity: 0.5
      },
      formatter: function (val, opts) {
        if (typeof val === 'number' && val > 0) {
          return val % 1 === 0 ? val.toString() : val.toFixed(2).replace('.00', '');
        }
        return '';
      },
      offsetY: 0,
    },
    fill: {
      opacity: 1,
      type: 'solid',
      colors: [function ({ value, seriesIndex, dataPointIndex, w }: { value: number; seriesIndex: number; dataPointIndex: number; w: any; }) {
        if (value === 0) return 'transparent';
        const rawData = (window && (window).rawInspeccionData) || [];
        const placasPorBarra = (window && (window).placasPorBarra) || [];
        const label = w.globals.labels[dataPointIndex];
        const fecha = String(label).split(' | ')[0];
        const serieKey = w.globals.seriesNames[seriesIndex];
        const [posicion, codigo] = serieKey.split(' - ');
        const placa = placasPorBarra[dataPointIndex] || '';
        const found = rawData.find(
          (item: any) => item.PLACA.trim() === placa && item.FECHA_REGISTRO === fecha && item.POSICION_NEU === posicion && String(item.CODIGO) === codigo
        );
        const estado = found ? Number(found.ESTADO) : null;
        if (estado !== null) {
          if (estado > 80) return '#4CAF50'; // Verde
          if (estado > 40) return '#FFEB3B'; // Amarillo
          return '#E53935'; // Rojo
        }
        return '#BDBDBD'; // Gris si no hay dato
      }]
    },
    grid: {
      borderColor: theme.palette.divider,
      strokeDashArray: 2,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    legend: {
      show: false,
      position: 'right',
      fontSize: '14px',
      labels: { colors: theme.palette.text.secondary },
      itemMargin: { vertical: 8 },
    },
    plotOptions: {
      bar: {
        columnWidth: '55%',
        borderRadius: 2,
        dataLabels: {
          position: 'top', // Placa arriba de la barra
        },
      },
    },
    stroke: { colors: ['#fff'], show: true, width: 2 },
    theme: { mode: theme.palette.mode },
    xaxis: {
      axisBorder: { color: theme.palette.divider, show: true },
      axisTicks: { color: theme.palette.divider, show: true },
      labels: {
        offsetY: 5,
        style: { colors: theme.palette.text.secondary, fontWeight: 600, fontSize: '13px' },
        rotate: 0,
        rotateAlways: false,
        trim: false,
        maxHeight: 60,
        formatter: (val) => {
          // Ahora solo se muestra la fecha, así que no es necesario invertir nada
          return String(val);
        },
      },
      tooltip: { enabled: true },
    },
    yaxis: {
      labels: {
        formatter: (value) => `${value}`,
        offsetX: -10,
        style: { colors: theme.palette.text.secondary, fontWeight: 600, fontSize: '13px' },
      },
    },
    tooltip: {
      y: {
        formatter: function (val, opts) {
          const placasPorBarra = (window && (window).placasPorBarra) || [];
          // const kilometrosPorBarra = (window && (window).kilometrosPorBarra) || [];
          const rawData = (window && (window).rawInspeccionData) || [];
          const placa = placasPorBarra[opts.dataPointIndex] || '';
          // const km = kilometrosPorBarra[opts.dataPointIndex] || '';
          let km = 0;
          let pos = '';
          let estado = '';
          let codigoNeu = '';
          let estadoNum: number | null = null;
          if (rawData && rawData.length) {
            const label = opts.w.globals.labels[opts.dataPointIndex];
            const fecha = String(label).split(' | ')[0];
            const serieKey = opts.w.globals.seriesNames[opts.seriesIndex];
            const [posicion, codigo] = serieKey.split(' - ');
            const found = rawData.find(
              (item: any) => item.PLACA.trim() === placa && item.FECHA_REGISTRO === fecha && item.POSICION_NEU === posicion && String(item.CODIGO) === codigo
            );
            if (found) {
              pos = found.POSICION_NEU;
              estado = found.ESTADO;
              estadoNum = Number(found.ESTADO);
              km = Number(found.KILOMETRO);
              codigoNeu = found.CODIGO;
            }
          }
          let result = placa;
          result += ` | ${km}km`;
          if (pos) result += ` | ${pos}`;
          if (estado !== '') result += ` | Estado: ${estado}%`;
          result += ` | ${codigoNeu}`;

          return result;
        },
        title: {
          formatter: () => '',
        },
      },
      x: {
        show: true,
        formatter: (val, opts) => {
          return String(val);
        },
      },
      shared: false,
      intersect: true,
    },
  };
}

// Overlay de placas arriba de cada barra
function BarPlatesOverlay({ categories }: { categories: string[] }) {
  // Obtener placas y kilometrajes en el mismo orden que las barras
  const placasPorBarra = (typeof window !== 'undefined' && window.placasPorBarra) || [];
  // const kilometrosPorBarra = (typeof window !== 'undefined' && window.kilometrosPorBarra) || [];
  // console.log('Overlay placasPorBarra:', placasPorBarra);
  // console.log('Overlay kilometrosPorBarra:', kilometrosPorBarra);
  // Renderizar un label por cada barra
  return (
    <div style={{
      position: 'absolute',
      top: 10,
      left: 0,
      width: '100%',
      height: 0,
      pointerEvents: 'none',
      zIndex: 10,
      display: 'grid',
      gridTemplateColumns: `repeat(${placasPorBarra.length}, 1fr)`,
      padding: '0 30px',
      fontWeight: 700,
      fontSize: 13,
      color: '#223A57',
      textShadow: '0 1px 2px #fff, 0 0 2px #fff',
    }}>
      <h1>hi</h1>
      {/* {kilometrosPorBarra.map((km, idx) => (
        <span key={idx} style={{
          minWidth: 0,
          maxWidth: 80,
          textAlign: 'center',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          margin: '0 auto',
        }}>
          <span style={{ fontWeight: 700 }}>{`Km: ${km}`}</span>
        </span>
      ))} */}
    </div>
  );
}
