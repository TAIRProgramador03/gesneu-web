'use client';

import * as React from 'react';
import { AtSign, BadgeCheck, IdCard, Mail, UserRound } from 'lucide-react';

import { useUser } from '@/hooks/use-user';
import { Tarjeta } from '@/components/ui/Tarjeta';

import { datosDeCuenta } from './account-utils';

function Fila({ icono, etiqueta, valor }: { icono: React.ReactNode; etiqueta: string; valor: string }): React.JSX.Element {
  return (
    <li className="flex items-center gap-3 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-superficie-2 text-muted-foreground">
        {icono}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{etiqueta}</p>
        <p className="wrap-break-word text-sm font-medium">{valor || '—'}</p>
      </div>
    </li>
  );
}

export function AccountDatos(): React.JSX.Element {
  const { user } = useUser();
  const c = datosDeCuenta(user);

  return (
    <Tarjeta acento="#167bd9" esquina className="animate-in fade-in slide-in-from-bottom-2 delay-100 duration-500 motion-reduce:animate-none">
      <h2 className="text-lg font-bold">Datos de la cuenta</h2>
      <ul className="mt-3 divide-y">
        <Fila icono={<UserRound className="size-4" />} etiqueta="Nombre" valor={c.nombre} />
        <Fila icono={<IdCard className="size-4" />} etiqueta="Apellidos" valor={c.apellidos} />
        <Fila icono={<AtSign className="size-4" />} etiqueta="Usuario" valor={c.usuario} />
        {c.correo && <Fila icono={<Mail className="size-4" />} etiqueta="Correo" valor={c.correo} />}
        <Fila icono={<BadgeCheck className="size-4" />} etiqueta="Cuenta" valor={c.rolPrincipal} />
      </ul>
    </Tarjeta>
  );
}
