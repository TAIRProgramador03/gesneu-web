'use client';

import * as React from 'react';
import { Spinner } from '@/components/ui/spinner';
import { Button, ButtonProps } from './button';
import { cn } from '@/lib/utils';

interface LoadingButtonProps extends Omit<ButtonProps, 'onClick'> {
  onClick?: () => Promise<void> | void;
  icon?: JSX.Element
}

export function LoadingButton2({ icon, onClick, disabled, children, ...props }: LoadingButtonProps) {
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
    <Button
      {...props}
      onClick={handleClick}
      disabled={loading || disabled}
      className={cn('cursor-pointer', props.className)}
    >
      {
        loading ? <Spinner /> : icon
      }
      {children}
    </Button>
  );
}
