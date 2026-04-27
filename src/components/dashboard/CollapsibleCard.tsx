'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import type { SxProps } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import { ChevronDown } from 'lucide-react';

interface CollapsibleCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconColor?: string;
  headerRight?: React.ReactNode;
  defaultOpen?: boolean;
  loading?: boolean;
  sx?: SxProps;
  children: React.ReactNode;
}

export function CollapsibleCard({
  title,
  subtitle,
  icon,
  iconColor = '#3B82F6',
  headerRight,
  defaultOpen = true,
  loading = false,
  sx,
  children,
}: CollapsibleCardProps): React.JSX.Element {
  const theme = useTheme();
  const [open, setOpen] = React.useState(defaultOpen);
  const isDark = theme.palette.mode === 'dark';

  return (
    <Card sx={{ ...sx, ...(open ? { display: 'flex', flexDirection: 'column' } : { height: 'auto' }) }}>
      {/* ── Header ── */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '13px 20px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          borderBottom: open ? `1px solid ${theme.palette.divider}` : 'none',
          transition: 'background 0.15s',
          borderRadius: open ? '12px 12px 0 0' : '12px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {icon && (
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: `${iconColor}18`,
              border: `1px solid ${iconColor}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: iconColor, flexShrink: 0,
            }}>
              {icon}
            </div>
          )}
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: theme.palette.text.primary as string, lineHeight: 1.3 }}>
              {title}
            </div>
            {subtitle && (
              <div style={{ fontSize: 11, color: theme.palette.text.secondary as string, marginTop: 2 }}>
                {subtitle}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {headerRight}
          <ChevronDown
            size={16}
            style={{
              color: theme.palette.text.secondary as string,
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.28s ease',
              flexShrink: 0,
            }}
          />
        </div>
      </button>

      {/* ── Collapsible body (grid-template-rows trick) ── */}
      <div style={{
        display: 'grid',
        gridTemplateRows: open ? '1fr' : '0fr',
        transition: 'grid-template-rows 0.3s ease',
        flexGrow: 1,
      }}>
        <div style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Skeleton variant="rounded" height={16} width="55%" />
              <Skeleton variant="rounded" height={16} width="80%" />
              <Skeleton variant="rounded" height={140} sx={{ mt: 1 }} />
            </div>
          ) : children}
        </div>
      </div>
    </Card>
  );
}
