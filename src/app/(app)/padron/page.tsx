'use client';

import * as React from 'react';
import Drawer from '@mui/material/Drawer';
import { TarjetaNeumatico } from './TarjetaNeumatico';
import { EncabezadoPagina } from '@/components/ui/EncabezadoPagina';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { columnsPadron } from './columns';
import { DataTableNeumaticos } from '@/components/ui/data-table/data-table';
import { Download as DownloadIcon } from '@phosphor-icons/react/dist/ssr/Download';
import { Neumaticos } from '@/api/Neumaticos';
import { useQuery } from '@tanstack/react-query';
import { useState } from "react";
import { useTheme } from '@mui/material/styles';
import { useUser } from '@/hooks/use-user';
import Box from '@mui/material/Box';
import Image from 'next/image';
import ModalInsertExcel from '@/components/dashboard/customer/modal-insert-excel';
import Stack from '@mui/material/Stack';
import styled from '@emotion/styled';
import useMediaQuery from '@mui/material/useMediaQuery';
import { LoadingButton2 } from '@/components/ui/loading-button2';
import { BanknoteArrowUp, Layers3, ListRestart, MoreHorizontal, RefreshCw, Sheet, SlidersHorizontal, TrendingUpDown, X } from 'lucide-react';
import { ModalReubicarNeumatico } from '@/components/dashboard/padron/modal-reubicar-neumatico';
import { useSelectPadron } from '@/hooks/use-select-padron';
import { MultiSearchSelect } from '@/components/ui/multiple-select';
import { SearchSelect } from '@/components/ui/search-select';
import { ModalAsignacionMasivaNeumatico } from '@/components/dashboard/padron/modal-asignacion-masiva-neumatico';
import { ModalVentaNeumatico } from '@/components/dashboard/padron/modal-venta-neumatico';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button as ButtonCustom } from '@/components/ui/button';
import { ClipboardText } from '@phosphor-icons/react';

/** Columnas que arrancan ocultas; se activan desde el selector "Columnas". */
const COLUMNAS_OCULTAS_PADRON = [
  'CARGA', 'VELOCIDAD', 'RQ', 'OC', 'LEASING', 'COSTO', 'PROVEEDOR',
  'FECHA_FABRICACION_COD', 'PRIMER_ODOMETRO', 'TORQUE_ACTUAL', 'PRESION_AIRE', 'FECHA_BAJA',
];

export default function Page(): React.JSX.Element {

  const { user } = useUser();

  const [loading, setLoading] = useState(false);
  const [resultadoCarga, setResultadoCarga] = useState<any>(null);
  const [modalCargaVisible, setModalCargaVisible] = useState(false);
  const [modalErroresVisible, setModalErroresVisible] = useState(false);
  const [modalImportarVisible, setModalImportarVisible] = useState(false);
  const [modalReubicarVisible, setModalReubicarVisible] = useState(false);
  const [modalAsignacionMasivaVisible, setModalAsignacionMasivaVisible] = useState(false);
  const [modalVenta, setModalVenta] = useState(false);

  const [talleresSelected, setTalleresSelected] = useState<string[]>([]);
  const [marcasSelected, setMarcasSelected] = useState<string[]>([]);
  const [disenosSelected, setDisenosSelected] = useState<string[]>([]);
  const [medidasSelected, setMedidasSelected] = useState<string[]>([]);
  const [situacionesSelected, setSituacionesSelected] = useState<string[]>([]);
  const [recuperadoSelected, setRecuperadoSelected] = useState<string>('all');

  const { data: customers = [], refetch: customersRefetch, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['padron-de-neumaticos', {
      talleresSelected,
      marcasSelected,
      disenosSelected,
      medidasSelected,
      situacionesSelected,
      recuperadoSelected
    }],
    queryFn: () => Neumaticos(talleresSelected, marcasSelected, disenosSelected, medidasSelected, situacionesSelected, recuperadoSelected),
  })

  const RECUPERADO_OPTIONS = [
    {
      value: "all",
      label: "Todos",
    },
    {
      value: "0",
      label: "Nuevos",
    },
    {
      value: "1",
      label: "Recuperados",
    }
  ]

  const {
    DISEÑO_OPTIONS,
    MARCA_OPTIONS,
    MEDIDA_OPTIONS,
    TALLER_OPTIONS,
    SITUACION_OPTIONS,
    isLoadingSelectDiseno,
    isLoadingSelectMarca,
    isLoadingSelectMedida,
    isLoadingSelectTaller,
    isLoadingSelectSituacion
  } = useSelectPadron()

  const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

  const Modal = styled.div`
  background: white;
  padding: 24px;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  text-align: center;
  width: fit-content;
  max-width: 90vw;

  h2 {
    margin-bottom: 16px;
  }

  button {
    margin-top: 20px;
    padding: 10px 18px;
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
`;

  const LoaderOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;

  .loader-tire {
    display: flex;
    flex-direction: column;
    align-items: center;

    img {
      width: 100px;
      animation: spin 1.5s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  }
  `;

  const handleRefresh = () => {
    try {
      customersRefetch();
    } catch (error) {
      console.error('Error al refrescar los datos');
    }
  };

  const handleClearFilters = () => {
    setTalleresSelected([])
    setMarcasSelected([])
    setDisenosSelected([])
    setMedidasSelected([])
    setSituacionesSelected([])
    setRecuperadoSelected('all')
  }

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));


  const [hojaFiltros, setHojaFiltros] = useState(false);

  const cantidadFiltros =
    (talleresSelected.length > 0 ? 1 : 0) +
    (marcasSelected.length > 0 ? 1 : 0) +
    (disenosSelected.length > 0 ? 1 : 0) +
    (medidasSelected.length > 0 ? 1 : 0) +
    (situacionesSelected.length > 0 ? 1 : 0) +
    (recuperadoSelected !== 'all' ? 1 : 0);
  const hayFiltros = cantidadFiltros > 0;

  const etiquetaDe = (opciones: { value: string; label: string }[], valor: string) =>
    opciones.find((o) => o.value === valor)?.label ?? valor;

  // Un chip por valor seleccionado, para quitarlo con un toque sin abrir la hoja.
  const chipsActivos: { clave: string; texto: string; quitar: () => void }[] = [
    ...talleresSelected.map((v) => ({
      clave: `taller-${v}`, texto: etiquetaDe(TALLER_OPTIONS, v),
      quitar: () => setTalleresSelected((a) => a.filter((x) => x !== v)),
    })),
    ...marcasSelected.map((v) => ({
      clave: `marca-${v}`, texto: etiquetaDe(MARCA_OPTIONS, v),
      quitar: () => setMarcasSelected((a) => a.filter((x) => x !== v)),
    })),
    ...disenosSelected.map((v) => ({
      clave: `diseno-${v}`, texto: etiquetaDe(DISEÑO_OPTIONS, v),
      quitar: () => setDisenosSelected((a) => a.filter((x) => x !== v)),
    })),
    ...medidasSelected.map((v) => ({
      clave: `medida-${v}`, texto: etiquetaDe(MEDIDA_OPTIONS, v),
      quitar: () => setMedidasSelected((a) => a.filter((x) => x !== v)),
    })),
    ...situacionesSelected.map((v) => ({
      clave: `situacion-${v}`, texto: etiquetaDe(SITUACION_OPTIONS, v),
      quitar: () => setSituacionesSelected((a) => a.filter((x) => x !== v)),
    })),
    ...(recuperadoSelected !== 'all'
      ? [{
        clave: 'recuperado', texto: etiquetaDe(RECUPERADO_OPTIONS, recuperadoSelected),
        quitar: () => setRecuperadoSelected('all'),
      }]
      : []),
  ];

  /** Los seis filtros. En escritorio van en fila; en la hoja móvil, apilados a todo el ancho. */
  const renderFiltros = (enHoja: boolean) => {
    const campo = (etiqueta: string, control: React.ReactNode) => (
      <div className={enHoja ? 'w-full' : 'min-w-50 max-w-70 flex-1'}>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {etiqueta}
        </p>
        {control}
      </div>
    );
    return (
      <>
        {campo('Taller(es)',
          <MultiSearchSelect
            options={TALLER_OPTIONS}
            value={talleresSelected}
            onChange={(value) => setTalleresSelected(value)}
            placeholder="Seleccionar taller(es)"
            disabled={isLoadingCustomers || isLoadingSelectTaller}
          />)}
        {campo('Marca(s)',
          <MultiSearchSelect
            options={MARCA_OPTIONS}
            value={marcasSelected}
            onChange={(value) => setMarcasSelected(value)}
            placeholder="Seleccionar marca(s)"
            disabled={isLoadingCustomers || isLoadingSelectMarca}
          />)}
        {campo('Diseño(s)',
          <MultiSearchSelect
            options={DISEÑO_OPTIONS}
            value={disenosSelected}
            onChange={(value) => setDisenosSelected(value)}
            placeholder="Seleccionar diseño(s)"
            disabled={isLoadingCustomers || isLoadingSelectDiseno}
          />)}
        {campo('Medida(s)',
          <MultiSearchSelect
            options={MEDIDA_OPTIONS}
            value={medidasSelected}
            onChange={(value) => setMedidasSelected(value)}
            placeholder="Seleccionar medida(s)"
            disabled={isLoadingCustomers || isLoadingSelectMedida}
          />)}
        {campo('Situación(es)',
          <MultiSearchSelect
            options={SITUACION_OPTIONS}
            value={situacionesSelected}
            onChange={(value) => setSituacionesSelected(value)}
            placeholder="Seleccionar situación(es)"
            disabled={isLoadingCustomers || isLoadingSelectSituacion}
          />)}
        {campo('Recuperado',
          <SearchSelect
            options={RECUPERADO_OPTIONS}
            value={recuperadoSelected}
            onChange={(value) => setRecuperadoSelected(value)}
            placeholder="Seleccionar si es recuperado"
            disabled={isLoadingCustomers}
            withButtonClear={false}
          />)}
      </>
    );
  };

  const esJefeTaller = Array.isArray(user?.perfiles) && user.perfiles.some((p: any) => p.codigo === '002');

  return (
    <>
      {loading && (
        <LoaderOverlay>
          <div className="loader-tire">
            <Image src={`/assets/tire.png`} alt='Cargando...' width={100} height={100} />
            <p style={{ marginTop: "10px", fontWeight: "bold" }}>Procesando Excel...</p>
          </div>
        </LoaderOverlay>
      )}

      <Stack spacing={{ xs: 2, md: 3 }} sx={{ width: '100%' }}>

        <EncabezadoPagina
          icono={<Layers3 className="size-5" />}
          degradado="from-sky-500 to-sky-800"
          titulo="Padrón de neumáticos"
          descripcion="Catálogo con la situación, ubicación y vida útil de cada neumático."
          contador={isLoadingCustomers ? 'Cargando…' : `${customers.length.toLocaleString('es-PE')} neumáticos`}
        />

        {/* ── Escritorio: botones de acción en una fila ── */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <LoadingButton2
            variant={'amber'}
            icon={<Sheet />}
            onClick={() => setModalAsignacionMasivaVisible(true)}
            disabled={loading || esJefeTaller || isLoadingCustomers}
          >
            Asignación Masiva
          </LoadingButton2>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ButtonCustom variant="lime">
                <ClipboardText />
                Acciones para Neumáticos
              </ButtonCustom>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40" align="start">
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => setModalVenta(true)}
                  disabled={loading || isLoadingCustomers}
                >
                  <BanknoteArrowUp />
                  Vender Neumáticos
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setModalReubicarVisible(true)}
                  disabled={loading || esJefeTaller || isLoadingCustomers}
                >
                  <TrendingUpDown />
                  Reubicar Neumáticos
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <LoadingButton2
            variant={'teal'}
            icon={<DownloadIcon />}
            onClick={() => setModalImportarVisible(true)}
            disabled={loading || esJefeTaller || isLoadingCustomers}
          >
            {loading ? "Cargando..." : "Importar"}
          </LoadingButton2>
          <LoadingButton2
            variant={'life'}
            icon={<RefreshCw />}
            onClick={handleRefresh}
            disabled={loading || isLoadingCustomers}
          >
            Refrescar
          </LoadingButton2>
          {hayFiltros && (
            <LoadingButton2
              variant={'destructive'}
              icon={<ListRestart />}
              onClick={handleClearFilters}
              disabled={isLoadingCustomers}
            >
              Limpiar filtros
            </LoadingButton2>
          )}
        </Box>

        {/* ── Móvil: filtros en hoja + menú de acciones ── */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1, alignItems: 'center' }}>
          <ButtonCustom
            variant="primary"
            className="h-10 flex-1 justify-center gap-2"
            onClick={() => setHojaFiltros(true)}
          >
            <SlidersHorizontal />
            Filtros
            {cantidadFiltros > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1.5 text-xs font-bold text-sky-900">
                {cantidadFiltros}
              </span>
            )}
          </ButtonCustom>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ButtonCustom variant="life" className="size-10 p-0" aria-label="Más acciones">
                <MoreHorizontal />
              </ButtonCustom>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="gap-3 py-2.5 text-sm font-medium"
                  onClick={() => setModalAsignacionMasivaVisible(true)}
                  disabled={loading || esJefeTaller || isLoadingCustomers}
                >
                  <Sheet className="text-amber-600" />
                  Asignación masiva
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-3 py-2.5 text-sm font-medium"
                  onClick={() => setModalImportarVisible(true)}
                  disabled={loading || esJefeTaller || isLoadingCustomers}
                >
                  <DownloadIcon className="text-teal-600" />
                  Importar Excel
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-3 py-2.5 text-sm font-medium" onClick={handleRefresh} disabled={loading || isLoadingCustomers}>
                  <RefreshCw className="text-cyan-600" />
                  Refrescar
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="gap-3 py-2.5 text-sm font-medium"
                  onClick={() => setModalVenta(true)}
                  disabled={loading || isLoadingCustomers}
                >
                  <BanknoteArrowUp className="text-fuchsia-600" />
                  Vender neumáticos
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-3 py-2.5 text-sm font-medium"
                  onClick={() => setModalReubicarVisible(true)}
                  disabled={loading || esJefeTaller || isLoadingCustomers}
                >
                  <TrendingUpDown className="text-lime-600" />
                  Reubicar neumáticos
                </DropdownMenuItem>
              </DropdownMenuGroup>
              {esJefeTaller && (
                <p className="px-2 pb-1.5 pt-2 text-xs text-muted-foreground">
                  Tu perfil (jefe de taller) no puede asignar, importar ni reubicar.
                </p>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </Box>

        {/* Filtros activos como chips (solo móvil) */}
        {chipsActivos.length > 0 && (
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:hidden [scrollbar-width:none]">
            {chipsActivos.map((chip) => (
              <button
                key={chip.clave}
                type="button"
                onClick={chip.quitar}
                className="flex shrink-0 items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-900 dark:bg-sky-500/15 dark:text-sky-200"
              >
                {chip.texto}
                <X className="size-3" />
              </button>
            ))}
            <button
              type="button"
              onClick={handleClearFilters}
              className="shrink-0 px-2 py-1 text-xs font-semibold text-red-700 dark:text-red-300"
            >
              Limpiar
            </button>
          </div>
        )}

        {/* ── Escritorio: filtros visibles ── */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, flexWrap: 'wrap' }}>
          {renderFiltros(false)}
        </Box>

        <Tarjeta className="p-3 md:p-5">
          <DataTableNeumaticos
            columns={columnsPadron}
            data={customers}
            type='pagination'
            filters={true}
            withExport={true}
            selectorColumnas
            columnasOcultasPorDefecto={COLUMNAS_OCULTAS_PADRON}
            renderCard={(neu, { seleccionado, alternar }) => (
              <TarjetaNeumatico neu={neu} seleccionado={seleccionado} onToggle={alternar} />
            )}
            isLoading={isLoadingCustomers}
            exportConfig={{
              title: 'GESNEU: PADRÓN DE NEUMÁTICOS',
              username: user?.usuario
            }}
          />
        </Tarjeta>

      </Stack >

      {modalCargaVisible && resultadoCarga && (
        <ModalOverlay>
          <Modal>
            <h2>Carga finalizada</h2>
            <p><strong>Total:</strong> {resultadoCarga.total}</p>
            <p><strong>Insertados:</strong> {resultadoCarga.insertados}</p>
            {resultadoCarga.mensaje && (
              <p style={{
                marginTop: '12px',
                padding: '10px',
                borderRadius: '6px',
                backgroundColor:
                  resultadoCarga.mensaje.includes("correctamente") ? "#e0f7e9"
                    : resultadoCarga.mensaje.includes("no realizada") ? "#ffebee"
                      : resultadoCarga.mensaje.toLowerCase().includes("error") ? "#ffebee"
                        : "#fff8e1",
                color:
                  resultadoCarga.mensaje.includes("correctamente") ? "#2e7d32"
                    : resultadoCarga.mensaje.includes("no realizada") ? "#c62828"
                      : resultadoCarga.mensaje.toLowerCase().includes("error") ? "#c62828"
                        : "#f9a825",
                fontWeight: "bold"
              }}>
                {resultadoCarga.mensaje}
              </p>
            )}
            {resultadoCarga.errores && resultadoCarga.errores.length > 0 && (
              <>
                <p style={{ marginTop: 18, fontWeight: 600, color: '#c62828' }}>Errores detectados:</p>
                <div style={{ maxHeight: '300px', overflowY: 'auto', margin: '0 auto', marginBottom: 10, minWidth: 'min(90vw, 400px)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.98rem' }}>
                    <thead>
                      <tr>
                        <th style={{ background: 'var(--superficie-2)', padding: '6px' }}>Fila/Código</th>
                        <th style={{ background: 'var(--superficie-2)', padding: '6px' }}>Mensaje</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultadoCarga.errores.map((err: { fila: string; mensaje: string }, idx: number) => (
                        <tr key={idx}>
                          <td style={{ padding: '6px', border: '1px solid #eee' }}>{err.fila}</td>
                          <td style={{ color: '#c62828', fontWeight: 'bold', padding: '6px', border: '1px solid #eee' }}>
                            {err.mensaje || "Error desconocido"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            <button onClick={() => {
              setModalCargaVisible(false);
              if (resultadoCarga.errores && resultadoCarga.errores.length > 0) {
                setModalErroresVisible(true);
              }
            }}>Aceptar</button>
          </Modal>
        </ModalOverlay>
      )
      }

      {
        modalErroresVisible && resultadoCarga?.errores?.length > 0 && (
          <ModalOverlay>
            <Modal>
              <h2>Errores de carga</h2>
              <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '10px', minWidth: 'min(90vw, 600px)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th>Fila/Código</th>
                      <th>Mensaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultadoCarga.errores.map((err: { fila: string; mensaje: string }, idx: number) => (
                      <tr key={idx}>
                        <td>{err.fila}</td>
                        <td style={{ color: 'red', fontWeight: 'bold' }}>
                          {err.mensaje || "Error desconocido"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={() => setModalErroresVisible(false)}>Cerrar</button>
            </Modal>
          </ModalOverlay>
        )
      }

      {/* Hoja de filtros (móvil): sube desde abajo y muestra cuántos resultados quedan */}
      <Drawer
        anchor="bottom"
        open={hojaFiltros}
        onClose={() => setHojaFiltros(false)}
        disableEnforceFocus
        PaperProps={{
          sx: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '88dvh',
            backgroundImage: 'none',
          },
        }}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-border" />
          <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-3">
            <h3 className="text-lg font-bold">Filtros</h3>
            <div className="flex items-center gap-1">
              {hayFiltros && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-2 py-1 text-sm font-semibold text-red-700 dark:text-red-300"
                >
                  Limpiar
                </button>
              )}
              <button
                type="button"
                onClick={() => setHojaFiltros(false)}
                aria-label="Cerrar filtros"
                className="grid size-9 place-items-center rounded-lg hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
            {renderFiltros(true)}
          </div>
          <div
            className="shrink-0 border-t px-4 pt-3"
            style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 0px))' }}
          >
            <ButtonCustom className="h-11 w-full" onClick={() => setHojaFiltros(false)}>
              {isLoadingCustomers ? 'Cargando…' : `Ver ${customers.length} resultado${customers.length === 1 ? '' : 's'}`}
            </ButtonCustom>
          </div>
        </div>
      </Drawer>

      <ModalInsertExcel
        open={modalImportarVisible}
        onClose={() => setModalImportarVisible(false)}
        onSuccess={() => {
          handleRefresh()
          customersRefetch()
        }}
        isLoading={loading}
        onHandleSetLoading={(value: boolean) => setLoading(value)}
      />

      {
        modalReubicarVisible && (
          <ModalReubicarNeumatico
            open={modalReubicarVisible}
            onClose={() => setModalReubicarVisible(false)}
            onSuccess={() => customersRefetch()}
          />
        )
      }

      {
        modalAsignacionMasivaVisible && (
          <ModalAsignacionMasivaNeumatico
            open={modalAsignacionMasivaVisible}
            onClose={() => setModalAsignacionMasivaVisible(false)}
            onSuccess={() => customersRefetch()}
          />
        )
      }

      {
        modalVenta && (
          <ModalVentaNeumatico
            open={modalVenta}
            onClose={() => setModalVenta(false)}
            onSuccess={() => customersRefetch()}
          />
        )
      }

    </>
  );
}
