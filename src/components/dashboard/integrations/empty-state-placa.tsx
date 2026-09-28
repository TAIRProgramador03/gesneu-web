'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';

interface PasoGuia {
    numero: number;
    texto: React.ReactNode;
    from: string;
    to: string;
    color: string;
}

const PASOS: PasoGuia[] = [
    {
        numero: 1,
        texto: <>Escribe la placa completa, por ejemplo <strong>TAIR-000</strong>.</>,
        from: '#dbeafe',
        to: '#bfdbfe',
        color: '#1d4ed8',
    },
    {
        numero: 2,
        texto: <>Activa <strong>Tránsito</strong> si la unidad no pertenece a tu operación.</>,
        from: '#bfdbfe',
        to: '#93c5fd',
        color: '#1e40af',
    },
    {
        numero: 3,
        texto: <>Desde el resultado puedes asignar, inspeccionar o dar mantenimiento.</>,
        from: '#93c5fd',
        to: '#60a5fa',
        color: '#1e3a8a',
    },
];

interface EmptyStatePlacaProps {
    error?: string | null;
}

export function EmptyStatePlaca({ error }: EmptyStatePlacaProps): React.JSX.Element {
    return (
        <Card
            sx={{
                p: { xs: 3, md: 6 },
                textAlign: 'center',
                borderRadius: 3,
                background: 'linear-gradient(180deg, #eff6ff 0%, #ffffff 55%)',
                boxShadow: '0 8px 30px rgba(37, 99, 235, 0.10)',
                border: '1px solid #dbeafe',
            }}
        >
            <Stack spacing={1.25} alignItems="center" sx={{ maxWidth: 560, mx: 'auto' }}>
                <Box
                    sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #60a5fa, #2563eb)',
                        color: '#ffffff',
                        boxShadow: '0 6px 16px rgba(37, 99, 235, 0.35)',
                        mb: 1,
                    }}
                >
                    <MagnifyingGlass size={28} weight="bold" />
                </Box>

                {error ? (
                    <Typography
                        variant="body2"
                        sx={{
                            color: '#b91c1c',
                            fontWeight: 600,
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: 2,
                            px: 2,
                            py: 0.75,
                        }}
                    >
                        {error}
                    </Typography>
                ) : null}

                <Typography variant="h5" fontWeight="bold" sx={{ color: '#0f172a' }}>
                    Consulta una placa para ver sus neumáticos
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Al buscar verás el diagrama del vehículo con cada posición ocupada, su presión y su
                    remanente, junto al detalle de los neumáticos instalados.
                </Typography>
            </Stack>

            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ mt: 4, maxWidth: 900, mx: 'auto' }}
            >
                {PASOS.map((paso) => (
                    <Card
                        key={paso.numero}
                        variant="outlined"
                        sx={{
                            flex: 1,
                            p: 2.5,
                            textAlign: 'left',
                            borderRadius: 2.5,
                            borderColor: '#e2e8f0',
                            background: '#fff',
                            transition: 'transform 0.15s, box-shadow 0.15s',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
                            },
                        }}
                    >
                        <Box
                            sx={{
                                width: 30,
                                height: 30,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: `linear-gradient(135deg, ${paso.from}, ${paso.to})`,
                                color: paso.color,
                                fontWeight: 800,
                                fontSize: 13,
                                mb: 1.5,
                            }}
                        >
                            {paso.numero}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            {paso.texto}
                        </Typography>
                    </Card>
                ))}
            </Stack>
        </Card>
    );
}

export default EmptyStatePlaca;
