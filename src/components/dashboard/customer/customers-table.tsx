'use client';

import * as React from 'react';
import { memo } from 'react';
import {
  Card, Table, TableBody, TableCell, TableHead, TablePagination,
  TableRow, Box, Divider, Typography, Checkbox, Stack, LinearProgress
} from '@mui/material';
import { TipoMovimientoBadge } from '@/components/ui/TipoMovimientoBadge';
import { EsRecuperadoBadge } from '@/components/ui/EsRecuperadoBadge';

export interface Customer {
  CODIGO: number;
  MARCA: string;
  MEDIDA: string;
  DISEÑO: string;
  REMANENTE: number;
  PR: number;
  CARGA: number;
  VELOCIDAD: string;
  RQ: number;
  OC: number;
  PROYECTO: string;
  COSTO: number;
  PROVEEDOR: string;
  FECHA_FABRICACION_COD: string;
  USUARIO_SUPER: string;
  TIPO_MOVIMIENTO: string;
  ESTADO: string;
  PLACA?: string; // Añadido para poder agrupar por placa
  RECUPERADO?: boolean
}

interface CustomersTableProps {
  count?: number;
  page?: number;
  rows?: Customer[];
  rowsPerPage?: number;
  onPageChange?: (event: React.MouseEvent<HTMLButtonElement> | null, page: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CustomersTable = memo(({ count = 0, rows = [], page = 0, rowsPerPage = 0, onPageChange = () => { }, onRowsPerPageChange }: CustomersTableProps) => {

  return (
    <Card sx={{ width: '100%' }}>
      <Box sx={{ width: '100%', overflowX: 'auto' }}>
        <Table sx={{ width: '100%' }}>
          <TableHead>
            <TableRow>
              {/* <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedAll}
                  indeterminate={selectedSome}
                  onChange={(event) => {
                    if (event.target.checked) {
                      selectAll();
                    } else {
                      deselectAll();
                    }
                  }}
                /> */}
              {/* </TableCell> */}
              <TableCell><Typography fontWeight="bold">Código</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Marca</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Medida</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Diseño</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Remanente</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">PR</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Carga</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">RQ</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">OC</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Proyecto</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Proveedor</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Fecha Fabricación</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Situación</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Recuperado</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Estado</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {

              rows.length === 0 ? (
                <TableRow hover key="not-found"
                >
                  <TableCell colSpan={15} align='center'>Sin resultados encontrados.</TableCell>
                </TableRow>
              ) :
                rows.map((row) => {
                  return (
                    <TableRow hover key={row.CODIGO}
                    >
                      <TableCell>{row.CODIGO}</TableCell>
                      <TableCell>{row.MARCA}</TableCell>
                      <TableCell>{row.MEDIDA}</TableCell>
                      <TableCell>{row.DISEÑO}</TableCell>
                      <TableCell>{row.REMANENTE}</TableCell>
                      <TableCell>{row.PR}</TableCell>
                      <TableCell>{row.CARGA}</TableCell>
                      <TableCell>{row.RQ}</TableCell>
                      <TableCell>{row.OC}</TableCell>
                      <TableCell>{row.PROYECTO}</TableCell>
                      <TableCell>{row.PROVEEDOR}</TableCell>
                      <TableCell>{row.FECHA_FABRICACION_COD}</TableCell>
                      <TableCell align='center'>
                        <TipoMovimientoBadge tipoMovimiento={row.TIPO_MOVIMIENTO} />
                      </TableCell>
                      <TableCell align='center'>
                        <EsRecuperadoBadge esRecuperado={row.RECUPERADO ?? false} />
                      </TableCell>
                      <TableCell align="center">
                        {typeof row.ESTADO === 'number' ? (
                          <Box sx={{ width: '120px', position: 'relative' }}>
                            <LinearProgress
                              variant="determinate"
                              value={row.ESTADO}
                              sx={{
                                height: 20,
                                color: "#ffffff",
                                borderRadius: 5,
                                border: `.5px solid #2a2a2a`,
                                padding: "10px",
                                backgroundColor: '#eee',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor:
                                    row.ESTADO < 39 ? '#d32f2f' : row.ESTADO < 79 ? '#FFEB3B' : '#2e7d32',
                                  borderRadius: 5,
                                },
                              }}
                            />
                            <Typography
                              variant="caption"
                              fontWeight="bold"
                              sx={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                top: 0,
                                bottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: `${row.ESTADO < 79 && row.ESTADO > 39 ? '#000' : (row.ESTADO <= 39) ? '#000' : '#fff'}`,
                                fontWeight: 'bold',
                                fontSize: 13,
                                letterSpacing: 0.5,
                                textShadow: '0 1px 2px rgba(255,255,255,0.15)'
                              }}
                            >
                              {row.ESTADO}%
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })

            }
          </TableBody>
        </Table>
      </Box>
      <Divider />
      <Box sx={{ px: 2 }}>
        <TablePagination
          component="div"
          count={count}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          rowsPerPageOptions={[8, 10, 20, 30]}
        />
      </Box>
    </Card>
  );
})
