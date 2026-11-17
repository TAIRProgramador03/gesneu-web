'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Building2, LogOut, ShieldCheck } from 'lucide-react';

import { logoutApi } from '@/lib/auth/auth-api';
import { logger } from '@/lib/default-logger';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import { Tarjeta } from '@/components/ui/Tarjeta';

import { datosDeCuenta } from './account-utils';

/** Llanta dibujada con círculos: aro, banda de rodadura punteada y rin. */
function Llanta({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg viewBox="0 0 200 200" fill="none" className={className} aria-hidden="true">
      <circle cx="100" cy="100" r="92" stroke="currentColor" strokeWidth="10" />
      <circle cx="100" cy="100" r="76" stroke="currentColor" strokeWidth="22" strokeDasharray="7 6" />
      <circle cx="100" cy="100" r="58" stroke="currentColor" strokeWidth="3" />
      <circle cx="100" cy="100" r="30" stroke="currentColor" strokeWidth="6" />
      <circle cx="100" cy="100" r="8" fill="currentColor" />
    </svg>
  );
}

function Dato({ icono, valor, etiqueta }: { icono: React.ReactNode; valor: number; etiqueta: string }): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-superficie-1 px-4 py-3">
      <span className="grid size-10 place-items-center rounded-lg bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300">
        {icono}
      </span>
      <div className="leading-tight">
        <p className="text-2xl font-bold tabular-nums">{valor}</p>
        <p className="text-xs text-muted-foreground">{etiqueta}</p>
      </div>
    </div>
  );
}

export function AccountHero(): React.JSX.Element {
  const { user } = useUser();
  const cuenta = datosDeCuenta(user);
  const cerrarSesion = async (): Promise<void> => {
    try {
      await logoutApi();
      window.location.href = '/auth/sign-in';
    } catch (err) {
      logger.error('Sign out error', err);
      toast.error('No se pudo cerrar la sesión. Intenta de nuevo.');
    }
  };

  return (
    <Tarjeta sinRelleno className="overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none">
      {/* Portada */}
      <div className="relative h-36 overflow-hidden bg-linear-to-br from-[#001a33] via-[#0a3a6a] to-[#167bd9] sm:h-44">
        <Llanta className="absolute -right-10 -top-16 size-72 text-white/15 sm:size-96" />
        <Llanta className="absolute -bottom-20 left-1/3 size-48 text-white/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_45%)]" />
        <div className="absolute right-4 top-4">
          <Button
            variant="ghost"
            onClick={cerrarSesion}
            className="border border-white/25 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white"
          >
            <LogOut />
            Cerrar sesión
          </Button>
        </div>
      </div>

      {/* Identidad */}
      <div className="flex flex-col gap-5 px-5 pb-6 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="relative z-10 -mt-12 flex min-w-0 flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-start">
          <div className="grid size-24 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-[#167bd9] to-[#0a3a6a] text-3xl font-bold text-white shadow-lg ring-4 ring-card sm:size-28 sm:text-4xl">
            {cuenta.iniciales}
          </div>
          <div className="min-w-0 sm:pt-[4.25rem]">
            {cuenta.nombre && cuenta.apellidos ? (
              <>
                <h1 className="wrap-break-word text-2xl font-bold leading-tight sm:text-3xl">{cuenta.nombre}</h1>
                <p className="wrap-break-word text-base font-medium uppercase tracking-wide text-muted-foreground sm:text-lg">
                  {cuenta.apellidos}
                </p>
              </>
            ) : (
              <h1 className="wrap-break-word text-2xl font-bold leading-tight sm:text-3xl">{cuenta.nombreCompleto}</h1>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {cuenta.rolPrincipal && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-900 dark:bg-sky-500/15 dark:text-sky-200">
                  <ShieldCheck className="size-3.5" />
                  {cuenta.rolPrincipal}
                </span>
              )}
              {cuenta.usuario && (
                <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
                  @{cuenta.usuario}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:min-w-80 lg:mt-5">
          <Dato icono={<Building2 className="size-5" />} valor={cuenta.talleres.length} etiqueta="Talleres" />
          <Dato icono={<ShieldCheck className="size-5" />} valor={cuenta.perfiles.length} etiqueta="Perfiles" />
        </div>
      </div>
    </Tarjeta>
  );
}
