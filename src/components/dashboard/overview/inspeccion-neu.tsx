'use client';

import * as React from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import DownloadIcon from '@mui/icons-material/Download';
import { useTheme } from '@mui/material/styles';
import type { SxProps } from '@mui/material/styles';
import type { ApexOptions } from 'apexcharts';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { ChevronDown } from 'lucide-react';

import { Chart } from '@/components/core/chart';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { obtenerInspeccionesNeumaticosPorFechas } from '@/api/Neumaticos';
import { useUser } from '@/hooks/use-user';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { useQuery } from '@tanstack/react-query';

export interface SalesProps {
  sx?: SxProps;
}

// Separador seguro para series keys — no puede aparecer en datos normales
const SERIES_SEP = '\x00';

const EMPTY_DATA: any[] = [];

type EstadoPlaca = 'good' | 'warning' | 'critical';

const ESTADO_COLORS: Record<EstadoPlaca, string> = {
  good: '#4CAF50',
  warning: '#F59E0B',
  critical: '#E53935',
};

function getEstadoColor(estado: number): string {
  if (estado > 80) return ESTADO_COLORS.good;
  if (estado > 40) return ESTADO_COLORS.warning;
  return ESTADO_COLORS.critical;
}

// Debounce para evitar queries mientras el usuario aún elige fecha
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState<T>(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Componentes de estado ────────────────────────────────────────────────────

function ChartSkeleton() {
  const bars = [0.55, 0.8, 0.4, 0.95, 0.65, 0.75, 0.5, 0.85, 0.6, 0.7];
  const segments = 4;
  return (
    <div style={{ height: 350, display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 12px' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 10, paddingBottom: 28 }}>
        {bars.map((h, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, height: `${h * 100}%` }}>
            {Array.from({ length: segments }).map((_, j) => (
              <Skeleton key={j} variant="rectangular" animation="wave" sx={{
                flex: 1, width: '100%',
                borderRadius: j === 0 ? '0 0 3px 3px' : j === segments - 1 ? '3px 3px 0 0' : 0,
                opacity: 1 - j * 0.12,
              }} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {bars.map((_, i) => <Skeleton key={i} variant="text" animation="wave" sx={{ flex: 1, fontSize: 12 }} />)}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ height: 350, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <Typography variant="h6" color="text.secondary">Sin inspecciones</Typography>
      <Typography variant="body2" color="text.disabled">No hay datos para el rango de fechas seleccionado.</Typography>
    </div>
  );
}

function ErrorState() {
  return (
    <div style={{ height: 350, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <Typography variant="h6" color="error">Error al cargar datos</Typography>
      <Typography variant="body2" color="text.secondary">No se pudieron obtener las inspecciones. Intenta cambiar el rango de fechas.</Typography>
    </div>
  );
}

function EstadoLegend() {
  const items = [
    { color: ESTADO_COLORS.good, label: '> 80% — Bueno' },
    { color: ESTADO_COLORS.warning, label: '41–80% — Regular' },
    { color: ESTADO_COLORS.critical, label: '≤ 40% — Crítico' },
  ];
  return (
    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', paddingTop: 8 }}>
      {items.map(({ color, label }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: color, flexShrink: 0 }} />
          <Typography variant="caption" color="text.secondary">{label}</Typography>
        </div>
      ))}
    </div>
  );
}

// ─── Procesamiento de datos ───────────────────────────────────────────────────

function makeLookupKey(placa: string, fecha: string, posicion: string, codigo: string) {
  return `${placa}|${fecha}|${posicion}|${codigo}`;
}

function processInspeccionData(data: any[]) {
  if (!data.length) {
    return {
      fullXCategories: [],
      fullChartSeries: [],
      allPlacas: [],
      lookupMap: new Map<string, any>(),
      placaEstadoMap: new Map<string, EstadoPlaca>(),
      placaEstadoSummary: new Map<string, { good: number; warning: number; critical: number }>(),
    };
  }

  const lookupMap = new Map<string, any>();
  data.forEach((item) => {
    lookupMap.set(makeLookupKey(item.PLACA.trim(), item.FECHA_REGISTRO, item.POSICION_NEU, String(item.CODIGO)), item);
  });

  const groupByFecha: Record<string, any[]> = {};
  data.forEach((item) => {
    if (!groupByFecha[item.FECHA_REGISTRO]) groupByFecha[item.FECHA_REGISTRO] = [];
    groupByFecha[item.FECHA_REGISTRO].push(item);
  });

  const fechas = Object.keys(groupByFecha).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  // Fecha más reciente POR PLACA — cada vehículo puede tener distinta última inspección
  const placaLatestFecha = new Map<string, string>();
  data.forEach((item) => {
    const placa = item.PLACA.trim();
    const fecha = item.FECHA_REGISTRO;
    const current = placaLatestFecha.get(placa);
    if (!current || fecha > current) placaLatestFecha.set(placa, fecha);
  });

  // Resumen de conteos por placa (última fecha de cada una)
  const placaEstadoSummary = new Map<string, { good: number; warning: number; critical: number }>();

  data.forEach((item) => {
    const placa = item.PLACA.trim();
    if (item.FECHA_REGISTRO !== placaLatestFecha.get(placa)) return;
    const estado = Number(item.ESTADO);
    const tipo: EstadoPlaca = estado > 80 ? 'good' : estado > 40 ? 'warning' : 'critical';
    const summary = placaEstadoSummary.get(placa) ?? { good: 0, warning: 0, critical: 0 };
    summary[tipo]++;
    placaEstadoSummary.set(placa, summary);
  });

  // Color del circulito = estado dominante (el que tiene más neumáticos)
  const placaEstadoMap = new Map<string, EstadoPlaca>();
  placaEstadoSummary.forEach((summary, placa) => {
    const dominant = ([['critical', summary.critical], ['warning', summary.warning], ['good', summary.good]] as [EstadoPlaca, number][])
      .reduce((a, b) => b[1] > a[1] ? b : a)[0];
    placaEstadoMap.set(placa, dominant);
  });

  const fullXCategories: string[] = [];
  fechas.forEach((fecha) => {
    const placas = Array.from(new Set(groupByFecha[fecha].map((item) => item.PLACA.trim())));
    placas.forEach((placa) => fullXCategories.push(`${fecha}|${placa}`));
  });

  const allSeriesKeys = Array.from(
    // Separador seguro: SERIES_SEP en vez de ' - ' para evitar conflicto con datos
    new Set(data.map((item) => `${item.POSICION_NEU}${SERIES_SEP}${item.CODIGO}`))
  ) as string[];

  const fullChartSeries = allSeriesKeys.map((serieKey) => {
    const [posicion, codigo] = serieKey.split(SERIES_SEP);
    return {
      name: serieKey,
      data: fullXCategories.map((cat) => {
        const [fecha, placa] = cat.split('|');
        return lookupMap.get(makeLookupKey(placa, fecha, posicion, codigo)) ? 1 : 0;
      }),
    };
  });

  const allPlacas = Array.from(new Set(data.map((item) => item.PLACA.trim())))
    .sort((a, b) => a.localeCompare(b)) as string[];

  return { fullXCategories, fullChartSeries, allPlacas, lookupMap, placaEstadoMap, placaEstadoSummary };
}

// ─── Componente principal ─────────────────────────────────────────────────────

const CHART_ID = 'inspeccion-neu-chart';

export const Sales = React.memo(({ sx }: SalesProps): React.JSX.Element => {
  const theme = useTheme();
  const [open, setOpen] = React.useState(true);
  const { user } = useUser();
  const [startDate, setStartDate] = React.useState<dayjs.Dayjs | null>(dayjs().subtract(2, 'day'));
  const [endDate, setEndDate] = React.useState<dayjs.Dayjs | null>(dayjs());
  const [selectedSeries, setSelectedSeries] = React.useState<string[]>([]);

  // Debounce: el query no se lanza hasta 500ms después del último cambio de fecha
  const debouncedFechaInicio = useDebounce(startDate?.format('YYYY-MM-DD'), 500);
  const debouncedFechaFin = useDebounce(endDate?.format('YYYY-MM-DD'), 500);

  const { data: rawData = EMPTY_DATA, isLoading, isFetching, isError } = useQuery({
    queryKey: ['inspecciones-vehiculo', { usuario: user?.usuario, fechaInicio: debouncedFechaInicio, fechaFin: debouncedFechaFin }],
    queryFn: () => obtenerInspeccionesNeumaticosPorFechas({ usuario: user?.usuario, fechaInicio: debouncedFechaInicio, fechaFin: debouncedFechaFin }),
    enabled: !!user?.usuario && !!debouncedFechaInicio && !!debouncedFechaFin,
    staleTime: 5 * 60 * 1000,
  });

  const { fullXCategories, fullChartSeries, allPlacas, lookupMap, placaEstadoMap, placaEstadoSummary } = React.useMemo(
    () => processInspeccionData(rawData),
    [rawData]
  );

  React.useEffect(() => {
    setSelectedSeries(allPlacas.slice(0, 3));
  }, [allPlacas]);

  const selectedSet = React.useMemo(() => new Set(selectedSeries), [selectedSeries]);

  const { categories, chartSeries, filteredPlacas } = React.useMemo(() => {
    if (!fullXCategories.length || !fullChartSeries.length) {
      return { categories: [], chartSeries: [], filteredPlacas: [] };
    }
    const filteredIndices = fullXCategories
      .map((cat, i) => ({ cat, i }))
      .filter(({ cat }) => selectedSet.has(cat.split('|')[1]))
      .map(({ i }) => i);

    const categories = filteredIndices.map((i) => {
      const [fecha, placa] = fullXCategories[i].split('|');
      return `${fecha} | ${placa}`;
    });
    const filteredPlacas = filteredIndices.map((i) => fullXCategories[i].split('|')[1]);
    const chartSeries = fullChartSeries
      .map((s) => ({ ...s, data: filteredIndices.map((i) => s.data[i]) }))
      .filter((s) => s.data.some((v) => v > 0));

    return { categories, chartSeries, filteredPlacas };
  }, [selectedSet, fullChartSeries, fullXCategories]);

  // Altura dinámica
  const chartHeight = Math.max(300, Math.min(520, 220 + categories.length * 18));

  // Ancho mínimo para scroll horizontal cuando hay muchas barras
  const minChartWidth = Math.max(500, categories.length * 115);

  const lookupMapRef = React.useRef(lookupMap);
  lookupMapRef.current = lookupMap;
  const filteredPlacasRef = React.useRef(filteredPlacas);
  filteredPlacasRef.current = filteredPlacas;

  const chartOptions = useChartOptions({ categories, chartHeight, lookupMapRef, filteredPlacasRef });

  const handlePlacasChange = React.useCallback((_e: React.SyntheticEvent, v: string[]) => setSelectedSeries(v), []);
  const handleSelectAll = React.useCallback(() => setSelectedSeries(allPlacas), [allPlacas]);
  const handleSelectNone = React.useCallback(() => setSelectedSeries([]), []);

  const handleExportPng = React.useCallback(async () => {
    try {
      // window.Apex._chartInstances es el registro interno de ApexCharts
      // Es más confiable que ApexCharts.exec() en entornos con module bundling
      const instance = (window as any).Apex?._chartInstances?.find((i: any) => i.id === CHART_ID);
      if (!instance?.chart) {
        console.warn('Chart instance not found. ID:', CHART_ID);
        return;
      }
      const { imgURI } = await instance.chart.dataURI();
      const link = document.createElement('a');
      link.href = imgURI;
      link.download = `inspecciones-${debouncedFechaInicio ?? 'export'}.png`;
      link.click();
    } catch (e) {
      console.error('Export PNG failed:', e);
    }
  }, [debouncedFechaInicio]);

  const isRefreshing = isFetching && !isLoading;
  const isEmpty = !isLoading && !isFetching && !isError && categories.length === 0;

  function renderChartArea() {
    if (isLoading) return <ChartSkeleton />;
    if (isError) return <ErrorState />;
    if (isEmpty) return <EmptyState />;
    return (
      <>
        {/* Scroll horizontal cuando hay muchas barras */}
        <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
          <div style={{ minWidth: minChartWidth }}>
            <Chart id={CHART_ID} height={chartHeight} options={chartOptions} series={chartSeries} type="bar" width="100%" />
          </div>
        </div>
        <EstadoLegend />
      </>
    );
  }

  return (
    <Card sx={sx}>
      {isRefreshing && <LinearProgress sx={{ height: 2, borderRadius: '4px 4px 0 0' }} />}

      <div style={{ display: 'flex', alignItems: '', justifyContent: 'space-between', flexWrap: 'wrap' }} className='m-8 gap-6'>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => setOpen(v => !v)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: 4, display: 'flex', alignItems: 'center',
                color: theme.palette.text.secondary as string,
              }}
            >
              <ChevronDown
                size={16}
                style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.28s ease' }}
              />
            </button>
            <h3 className='font-semibold text-xl'>
              Inspecciónes por Vehículo
            </h3>
          </div>
        </div>

        {/* Botón exportar PNG */}
        {/* {!isLoading && !isError && !isEmpty && (
              <Tooltip title="Exportar como PNG">
                <IconButton size="small" onClick={handleExportPng}>
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )} */}
        {/* <div>
              <h4>
                Inspecciones por Vehículo
              </h4>
            </div> */}

        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }} className='gap-6'>
            <DatePicker
              label="Inicio"
              value={startDate}
              onChange={setStartDate}
              disabled={isFetching}
              slotProps={{ textField: { size: 'small', variant: 'outlined' } }}
              className='min-w-[190px] w-[200px]'
            />
            <DatePicker
              label="Fin"
              value={endDate}
              onChange={setEndDate}
              disabled={isFetching}
              minDate={startDate ?? undefined}
              slotProps={{ textField: { size: 'small', variant: 'outlined' } }}
              className='min-w-[190px] w-[200px]'
            />
          </div>
        </LocalizationProvider>
      </div>

      <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows 0.3s ease' }}>
      <div style={{ overflow: 'hidden' }}>
      <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }} className='mx-8 mt-8 gap-6'>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary">
            {selectedSeries.length} de {allPlacas.length} seleccionadas
          </Typography>
          <div style={{ display: 'flex', gap: 4 }}>
            <Button size="small" variant="text" sx={{ minWidth: 0, px: 1, fontSize: 11 }} onClick={handleSelectAll}>
              Todas
            </Button>
            <Button size="small" variant="text" sx={{ minWidth: 0, px: 1, fontSize: 11 }} onClick={handleSelectNone}>
              Ninguna
            </Button>
          </div>
        </div>

        <Autocomplete
          multiple
          limitTags={10}
          options={allPlacas}
          value={selectedSeries}
          onChange={handlePlacasChange}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const estado = placaEstadoMap.get(option) ?? 'good';
              return (
                <Chip
                  {...getTagProps({ index })}
                  key={option}
                  label={option}
                  size="small"
                  sx={{ borderLeft: `3px solid ${ESTADO_COLORS[estado]}`, fontWeight: 600 }}
                />
              );
            })
          }
          renderOption={(props, option) => {
            const estado = placaEstadoMap.get(option) ?? 'good';
            const summary = placaEstadoSummary.get(option);
            return (
              <li {...props} key={option} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                {/* Punto de peor estado */}
                <span style={{
                  width: 10, height: 10, borderRadius: '50%',
                  backgroundColor: ESTADO_COLORS[estado],
                  flexShrink: 0, display: 'inline-block',
                }} />
                {/* Nombre de placa */}
                <span style={{ flex: 1, fontSize: 13 }}>{option}</span>
                {/* Resumen de neumáticos: ■3 ■1 ■1 */}
                {summary && (
                  <span style={{ display: 'flex', gap: 5, alignItems: 'center', fontSize: 11 }}>
                    {summary.good > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 2, color: ESTADO_COLORS.good }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: ESTADO_COLORS.good, display: 'inline-block' }} />
                        {summary.good}
                      </span>
                    )}
                    {summary.warning > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 2, color: ESTADO_COLORS.warning }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: ESTADO_COLORS.warning, display: 'inline-block' }} />
                        {summary.warning}
                      </span>
                    )}
                    {summary.critical > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 2, color: ESTADO_COLORS.critical }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: ESTADO_COLORS.critical, display: 'inline-block' }} />
                        {summary.critical}
                      </span>
                    )}
                  </span>
                )}
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField {...params} variant="outlined" label="Placas" placeholder="Buscar..." />
          )}
        />
      </div>

      {/* ----------------------------- */}

      {/* <CardHeader
        action={
          <div style={{ display: 'flex', alignItems: '', justifyContent: 'space-around', gap: 8 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <DatePicker
                  label="Inicio"
                  value={startDate}
                  onChange={setStartDate}
                  disabled={isFetching}
                  slotProps={{ textField: { size: 'small', variant: 'outlined' } }}
                  className='w-[160px]'
                />
                <DatePicker
                  label="Fin"
                  value={endDate}
                  onChange={setEndDate}
                  disabled={isFetching}
                  minDate={startDate ?? undefined}
                  slotProps={{ textField: { size: 'small', variant: 'outlined' } }}
                  className='w-[160px]'
                />
              </div>
            </LocalizationProvider>
          </div>
        }
      /> */}
      <CardContent sx={{ display: 'flex', flexDirection: 'row', gap: 2, flexWrap: 'wrap' }}>
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          {renderChartArea()}
        </div>

        {/* Panel lateral */}

      </CardContent>
      <Divider />
      </div>
      </div>
    </Card >
  );
});

// ─── Chart options ────────────────────────────────────────────────────────────

interface ChartOptionsParams {
  categories: string[];
  chartHeight: number;
  lookupMapRef: React.MutableRefObject<Map<string, any>>;
  filteredPlacasRef: React.MutableRefObject<string[]>;
}

function useChartOptions({ categories, chartHeight, lookupMapRef, filteredPlacasRef }: ChartOptionsParams): ApexOptions {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return React.useMemo<ApexOptions>(() => ({
    chart: {
      id: CHART_ID,
      background: 'transparent',
      stacked: true,
      toolbar: { show: false },
      height: chartHeight,
    },
    dataLabels: {
      enabled: true,
      style: { colors: ['#fff'], fontWeight: 700, fontSize: '13px' },
      dropShadow: { enabled: true, top: 1, left: 1, blur: 1, color: '#222', opacity: 0.5 },
      formatter: (val, opts) => {
        if (!val) return '';
        const filteredPlacas = filteredPlacasRef.current;
        const label = opts.w.globals.labels[opts.dataPointIndex];
        const fecha = String(label).split(' | ')[0];
        const serieKey = opts.w.globals.seriesNames[opts.seriesIndex];
        const [posicion, codigo] = serieKey.split(SERIES_SEP);
        const placa = filteredPlacas[opts.dataPointIndex] || '';
        const found = lookupMapRef.current.get(makeLookupKey(placa, fecha, posicion, codigo));
        if (!found) return '';
        const rem = found.REMANENTE;
        return typeof rem === 'number'
          ? rem % 1 === 0 ? String(rem) : rem.toFixed(2).replace('.00', '')
          : String(rem);
      },
      offsetY: 0,
    },
    fill: {
      opacity: 1,
      type: 'solid',
      colors: [({ value, seriesIndex, dataPointIndex, w }: { value: number; seriesIndex: number; dataPointIndex: number; w: any }) => {
        if (value === 0) return 'transparent';
        const filteredPlacas = filteredPlacasRef.current;
        const label = w.globals.labels[dataPointIndex];
        const fecha = String(label).split(' | ')[0];
        const serieKey = w.globals.seriesNames[seriesIndex];
        const [posicion, codigo] = serieKey.split(SERIES_SEP);
        const placa = filteredPlacas[dataPointIndex] || '';
        const found = lookupMapRef.current.get(makeLookupKey(placa, fecha, posicion, codigo));
        const estado = found ? Number(found.ESTADO) : null;
        return estado !== null ? getEstadoColor(estado) : '#BDBDBD';
      }],
    },
    grid: {
      borderColor: theme.palette.divider,
      strokeDashArray: 2,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    legend: { show: false },
    plotOptions: {
      bar: { columnWidth: '90px', borderRadius: 2, dataLabels: { position: 'top' } },
    },
    stroke: { colors: ['#fff'], show: true, width: 2 },
    theme: { mode: theme.palette.mode },
    xaxis: {
      categories,
      axisBorder: { color: theme.palette.divider, show: true },
      axisTicks: { color: theme.palette.divider, show: true },
      labels: {
        offsetY: 5,
        style: { colors: theme.palette.text.secondary, fontWeight: 600, fontSize: '12px' },
        rotate: 0,
        rotateAlways: false,
        trim: false,
        maxHeight: 80,
        // Placa en línea superior, fecha en línea inferior
        formatter: (val) => {
          const parts = String(val).split(' | ');
          return parts.length === 2 ? ([parts[1], parts[0]] as any) : String(val);
        },
      },
      tooltip: { enabled: false },
    },
    yaxis: { labels: { formatter: () => '' } },
    // Tooltip HTML personalizado — muestra todos los segmentos del vehículo
    tooltip: {
      shared: false,
      intersect: true,
      custom: ({ series, seriesIndex, dataPointIndex, w }) => {
        const filteredPlacas = filteredPlacasRef.current;
        const placa = filteredPlacas[dataPointIndex] || '';
        const label = w.globals.labels[dataPointIndex];
        const fecha = String(label).split(' | ')[0];

        // Todos los segmentos con valor > 0 para esta barra
        const segmentos: { posicion: string; codigo: string; item: any; isHovered: boolean }[] = [];
        (w.globals.seriesNames as string[]).forEach((name, si) => {
          if (!series[si][dataPointIndex]) return;
          const [posicion, codigo] = name.split(SERIES_SEP);
          const item = lookupMapRef.current.get(makeLookupKey(placa, fecha, posicion, codigo));
          if (item) segmentos.push({ posicion, codigo, item, isHovered: si === seriesIndex });
        });

        if (!segmentos.length) return '<div></div>';

        const kilometrajeMayor = Math.max(...segmentos.map((seg) => seg.item.KILOMETRO))
        const km = Number(kilometrajeMayor).toLocaleString('es');
        const bg = isDark ? '#1e293b' : '#fff';
        const border = isDark ? '#334155' : '#e2e8f0';
        const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
        const textSecondary = isDark ? '#94a3b8' : '#64748b';

        const rows = segmentos.map(({ posicion, item, isHovered }) => {
          const estado = Number(item.ESTADO);
          const color = getEstadoColor(estado);
          const rowBg = isHovered ? (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)') : 'transparent';
          return `
            <div style="display:flex;align-items:center;gap:8px;padding:4px 6px;border-radius:5px;background:${rowBg}">
              <div style="width:8px;height:8px;border-radius:2px;background:${color};flex-shrink:0"></div>
              <span style="flex:1;font-size:12px;color:${textPrimary}">${posicion}</span>
              <span style="font-size:12px;font-weight:600;color:${textPrimary}">${item.REMANENTE}mm</span>
              <span style="font-size:11px;font-weight:700;color:${color};min-width:36px;text-align:right">${item.ESTADO}%</span>
            </div>`;
        }).join('');

        return `
          <div style="background:${bg};border:1px solid ${border};border-radius:10px;padding:12px 14px;min-width:220px;box-shadow:0 4px 20px rgba(0,0,0,0.15);font-family:inherit">
            <div style="font-weight:700;font-size:14px;color:${textPrimary};margin-bottom:2px">${placa}</div>
            <div style="font-size:11px;color:${textSecondary};margin-bottom:10px">${fecha} &nbsp;·&nbsp; ${km} km</div>
            <div style="display:flex;flex-direction:column;gap:2px">${rows}</div>
          </div>`;
      },
    },
  }), [categories, chartHeight, theme, isDark, lookupMapRef, filteredPlacasRef]);
}
