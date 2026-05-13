'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import { Car, ChevronRight, ClipboardList } from 'lucide-react';
import CountUp from 'react-countup';
import { useQuery } from '@tanstack/react-query';
import { obtenerPlacasConNeumaticos } from '@/api/Neumaticos';
import { DataTableNeumaticos } from '@/components/ui/data-table/data-table';
import { columnsPlacasNeumaticos } from '@/app/dashboard/columns-placas-neumaticos';
import { Box } from '@mui/system';
import { Button as ButtonCustom } from '@/components/ui/button';
import { useUser } from '@/hooks/use-user';

interface PlacasSinNeumaticosCardProps {
  sx?: object;
}

export function PlacasSinNeumaticosCard({ sx }: PlacasSinNeumaticosCardProps) {
  const [open, setOpen] = React.useState(false);
  const { user } = useUser();

  const { data: placasConCantidadNeumaticos = [], isLoading } = useQuery({
    queryKey: ['placas-con-cantidad-neumaticos'],
    queryFn: obtenerPlacasConNeumaticos
  })

  const sinNeu = placasConCantidadNeumaticos.reduce((a, v) => v.CANTIDAD_NEUMATICOS_INSTALADOS === 0 ? a + 1 : a + 0, 0);
  const total = placasConCantidadNeumaticos.length;
  const porcentaje = total > 0 ? Math.round((sinNeu / total) * 100) : 0;

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Card
        className="border-t-4 border-orange-500"
        sx={{ ...sx, overflow: 'hidden', position: 'relative' }}
      >
        <div
          className="bg-orange-50"
          style={{
            position: 'absolute', top: -30, right: -30,
            width: 110, height: 110, borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
        <CardContent sx={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="overline"
                sx={{ color: 'text.secondary', lineHeight: 1.4, display: 'block', mb: 0.75, fontSize: '0.7rem' }}
              >
                Placas sin neumáticos
              </Typography>

              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.1 }}>
                {isLoading
                  ? <Skeleton variant="text" width={72} sx={{ fontSize: '2rem' }} />
                  : <CountUp end={sinNeu} duration={0.9} separator="," />
                }
              </Typography>

              {isLoading ? (
                <Skeleton width={120} sx={{ mt: 0.75 }} />
              ) : (
                <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.75, display: 'block', lineHeight: 1.3 }}>
                  de {total} placas en el taller ({porcentaje}%)
                </Typography>
              )}

              <LinearProgress
                variant={isLoading ? 'indeterminate' : 'determinate'}
                value={isLoading ? undefined : porcentaje}
                sx={{
                  mt: 1.5,
                  height: 5,
                  borderRadius: 3,
                  bgcolor: 'orange.100',
                  '& .MuiLinearProgress-bar': { bgcolor: '#f97316' },
                }}
              />

              <Button
                size="small"
                onClick={handleOpen}
                endIcon={<ChevronRight size={14} />}
                sx={{
                  mt: 1.25,
                  px: 0,
                  fontSize: '0.7rem',
                  color: '#ea580c',
                  textTransform: 'none',
                  fontWeight: 600,
                  minWidth: 0,
                  '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                }}
              >
                Ver detalle
              </Button>
            </div>

            {isLoading ? (
              <Skeleton variant="rounded" width={48} height={48} sx={{ borderRadius: '12px', flexShrink: 0 }} />
            ) : (
              <div
                className="border-2 border-orange-500 text-orange-500"
                style={{
                  width: 48, height: 48, borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Car size={22} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>


      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth
        PaperProps={{
          sx: { borderRadius: 3, overflow: 'hidden' }
        }}
      >

        <Box sx={{ height: 4, background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)' }} />

        <DialogTitle sx={{ pb: 1.5, pt: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 40, height: 40, borderRadius: 2,
            background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
            flexShrink: 0,
          }}>
            <ClipboardList size={20} className="text-blue-600" />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
              Placas con la cantidad de neumáticos montados
            </Typography>
          </Box>
        </DialogTitle>


        <DialogContent>

          <DataTableNeumaticos
            columns={columnsPlacasNeumaticos}
            type='pagination'
            data={placasConCantidadNeumaticos}
            filters={true}
            withExport={true}
            isLoading={isLoading}
            exportConfig={{
              title: 'GESNEU: PLACAS Y CANTIDAD DE NEUMÁTICOS',
              fileName: 'GESNEU_PLACAS_Y_CANTIDAD_DE_NEUMATICOS',
              username: user?.usuario
            }}
          />

        </DialogContent>

        <DialogActions>
          <ButtonCustom
            onClick={handleClose}
          >
            Cerrar
          </ButtonCustom>
        </DialogActions>
      </Dialog>
    </>
  );
}
