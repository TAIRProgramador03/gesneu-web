'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import type { SxProps } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import CountUp from 'react-countup';

export interface KpiCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  format?: 'number' | 'currency';
  description?: string;
  loading?: boolean;
  sx?: SxProps;
}

const colorClasses: Record<string, { bg: string, border: string, text: string }> = {
  green: {
    bg: 'bg-green-50',
    border: 'border-green-600',
    text: 'text-green-600'
  },
  sky: {
    bg: 'bg-sky-50',
    border: 'border-sky-600',
    text: 'text-sky-600'
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-600',
    text: 'text-amber-600'
  },
  yellow: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-600',
    text: 'text-yellow-600'
  },
  lime: {
    bg: 'bg-lime-50',
    border: 'border-lime-600',
    text: 'text-lime-600'
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-600',
    text: 'text-red-600'
  },
  stone: {
    bg: 'bg-stone-50',
    border: 'border-stone-500',
    text: 'text-stone-600'
  },
};

export const KpiCard = ({
  label, value, icon, color,
  format = 'number', description, loading = false, sx,
}: KpiCardProps): React.JSX.Element => {
  const theme = useTheme();

  const colors = colorClasses[color] || colorClasses.green;

  return (
    <Card
      className={`border-t-4 ${colors.border}`}
      sx={{
        ...sx,
        overflow: 'hidden',
        position: 'relative',
      }}>
      <div style={{
        position: 'absolute', top: -30, right: -30,
        width: 110, height: 110, borderRadius: '50%',
        pointerEvents: 'none',
      }}
        className={colors.bg}
      />

      <CardContent sx={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="overline"
              sx={{ color: 'text.secondary', lineHeight: 1.4, display: 'block', mb: 0.75, fontSize: '0.7rem' }}
            >
              {label}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.1 }}>
              {loading ? (
                <Skeleton variant="text" width={72} sx={{ fontSize: '2rem' }} />
              ) : (
                <>
                  {format === 'currency' && (
                    <span style={{ fontSize: '0.68em', fontWeight: 600, color: theme.palette.text.secondary as string, marginRight: 3 }}>
                      $
                    </span>
                  )}
                  <CountUp end={value} duration={0.9} separator="," />
                </>
              )}
            </Typography>
            {description && (
              <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.75, display: 'block', lineHeight: 1.3 }}>
                {loading ? <Skeleton width={100} /> : description}
              </Typography>
            )}
          </div>

          {loading ? (
            <Skeleton variant="rounded" width={48} height={48} sx={{ borderRadius: '12px', flexShrink: 0 }} />
          ) : (
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
              className={`border-2 ${colors.border} ${colors.text}`}
            >
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
