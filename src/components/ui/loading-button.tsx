'use client';

import * as React from 'react';
import MuiButton, { ButtonProps as MuiButtonProps } from '@mui/material/Button';
import { Spinner } from '@/components/ui/spinner';

interface LoadingButtonProps extends Omit<MuiButtonProps, 'onClick'> {
  onClick?: () => Promise<void> | void;
}

export function LoadingButton({ onClick, disabled, startIcon, children, ...props }: LoadingButtonProps) {
  const [loading, setLoading] = React.useState(false);

  const handleClick = async () => {
    if (!onClick) return;
    setLoading(true);
    try {
      await onClick();
    } finally {
      setLoading(false);
    }
  };

  return (
    <MuiButton
      {...props}
      onClick={handleClick}
      disabled={loading || disabled}
      startIcon={loading ? <Spinner /> : startIcon}
    >
      {children}
    </MuiButton>
  );
}
