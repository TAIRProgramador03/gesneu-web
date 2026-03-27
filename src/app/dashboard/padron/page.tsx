'use client';

import * as React from 'react';
import { ArrowClockwise as RefreshIcon } from '@phosphor-icons/react/dist/ssr/ArrowClockwise';
import { Card } from '@mui/material';
import { columnsPadron } from './columns';
import { CustomersFilters } from '@/components/dashboard/customer/customers-filters';
import { DataTableNeumaticos } from '@/components/ui/data-table/data-table';
import { Download as DownloadIcon } from '@phosphor-icons/react/dist/ssr/Download';
import { Neumaticos } from '@/api/Neumaticos';
import { useNeuStats } from '@/hooks/use-neu-stats';
import { useQuery } from '@tanstack/react-query';
import { useState } from "react";
import { useTheme } from '@mui/material/styles';
import { useUser } from '@/hooks/use-user';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Image from 'next/image';
import ModalInsertExcel from '@/components/dashboard/customer/modal-insert-excel';
import Stack from '@mui/material/Stack';
import styled from '@emotion/styled';
import useMediaQuery from '@mui/material/useMediaQuery';
import { LoadingButton2 } from '@/components/ui/loading-button2';
import { RefreshCw, TrendingUpDown } from 'lucide-react';
import { ModalReubicarNeumatico } from '@/components/dashboard/padron/modal-reubicar-neumatico';

export default function Page(): React.JSX.Element {

  const { user } = useUser();

  const [loading, setLoading] = useState(false);
  const [resultadoCarga, setResultadoCarga] = useState<any>(null);
  const [modalCargaVisible, setModalCargaVisible] = useState(false);
  const [modalErroresVisible, setModalErroresVisible] = useState(false);
  const [modalImportarVisible, setModalImportarVisible] = useState(false);
  const [modalReubicarVisible, setModalReubicarVisible] = useState(false);

  const { data: customers = [], refetch: customersRefetch, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: Neumaticos
  })

  const { allQtyNeu, avaibleQtyNeu, assignedQtyNeu, dropQtyNeu, recoverQtyNeu, avaibleQtyAuto } = useNeuStats();

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
      customersRefetch()
      allQtyNeu.refetch()
      avaibleQtyNeu.refetch()
      assignedQtyNeu.refetch()
      dropQtyNeu.refetch()
      recoverQtyNeu.refetch()
      avaibleQtyAuto.refetch()
    } catch (error) {
      console.error('Error al refrescar los datos');
    }
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));


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

      <Stack spacing={3} sx={{ width: '100%' }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'center' }}
          className='justify-end'
          spacing={2}
          sx={{ width: '100%' }}
        >
          <Box sx={{ display: 'flex', gap: 2, mt: { xs: 2, md: 0 } }}>
            <LoadingButton2
              variant={'indigo'}
              icon={<TrendingUpDown />}
              onClick={() => setModalReubicarVisible(true)}
              disabled={loading || esJefeTaller}
            >
              Reubicar Neumático
            </LoadingButton2>
            <LoadingButton2
              variant={'teal'}
              icon={<DownloadIcon />}
              onClick={() => setModalImportarVisible(true)}
              disabled={loading || esJefeTaller}
            >
              {isMobile ? null : (loading ? "Cargando..." : "Importar")}
            </LoadingButton2>
            <LoadingButton2
              variant={'life'}
              icon={<RefreshCw />}
              onClick={handleRefresh}
              disabled={loading}
            >
              Refrescar
            </LoadingButton2>
          </Box>
        </Stack>

        <CustomersFilters
          projectCount={allQtyNeu.data}
          disponiblesCount={avaibleQtyNeu.data}
          asignadosCount={assignedQtyNeu.data}
          autosDisponiblesCount={avaibleQtyAuto.data}
          bajaDefinitivaCount={dropQtyNeu.data}
          recuperadosCount={recoverQtyNeu.data}
        />

        <Card className='p-5'>
          <DataTableNeumaticos
            columns={columnsPadron}
            data={customers}
            type='pagination'
            filters={true}
            withExport={true}
            isLoading={isLoadingCustomers}
            exportConfig={{
              title: 'GESNEU: PADRÓN DE NEUMÁTICOS',
              username: user?.usuario
            }}
          />
        </Card>

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
                        <th style={{ background: '#f5f5f5', padding: '6px' }}>Fila/Código</th>
                        <th style={{ background: '#f5f5f5', padding: '6px' }}>Mensaje</th>
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

    </>
  );
}
