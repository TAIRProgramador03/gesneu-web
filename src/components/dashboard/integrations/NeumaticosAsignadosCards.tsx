'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronDown, Disc3, Sparkles } from 'lucide-react';
import { EsRecuperadoBadge } from '@/components/ui/EsRecuperadoBadge';
import { convertToDateHuman } from '@/lib/utils';
import type { NeuAsignadoTable } from '@/types/neumatico';

type NeumaticoAsignadoCard = NeuAsignadoTable & {
  DISEÑO?: string;
  DISENO?: string;
  MEDIDA?: string;
  PRESION_AIRE?: number;
  TORQUE_APLICADO?: number;
};

/**
 * Un solo acento cromático por tarjeta (el estado de vida del neumático); el resto
 * son neutros. Las clases van completas para que Tailwind las detecte al compilar.
 */
const ACENTOS = {
  critico: {
    franja: 'from-rose-300 to-rose-500',
    fondo: 'from-rose-50 dark:from-rose-500/10/70 dark:from-rose-500/10',
    chip: 'border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300',
    texto: 'text-rose-600 dark:text-rose-300',
    barra: 'bg-rose-500',
    hover: 'hover:border-rose-200 dark:hover:border-rose-500/30',
  },
  medio: {
    franja: 'from-amber-300 to-amber-500',
    fondo: 'from-amber-50 dark:from-amber-500/10/70 dark:from-amber-500/10',
    chip: 'border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300',
    texto: 'text-amber-600 dark:text-amber-300',
    barra: 'bg-amber-500',
    hover: 'hover:border-amber-200 dark:hover:border-amber-500/30',
  },
  optimo: {
    franja: 'from-emerald-300 to-emerald-500',
    fondo: 'from-emerald-50 dark:from-emerald-500/10/70 dark:from-emerald-500/10',
    chip: 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    texto: 'text-emerald-600 dark:text-emerald-300',
    barra: 'bg-emerald-500',
    hover: 'hover:border-emerald-200 dark:hover:border-emerald-500/30',
  },
} as const;

function acentoPorVida(pct: number) {
  if (pct < 39) return ACENTOS.critico;
  if (pct < 79) return ACENTOS.medio;
  return ACENTOS.optimo;
}

function DetalleItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 dark:border-slate-700/70 dark:border-slate-700/70 bg-white dark:bg-card px-3 py-2">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-0.5 truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{value}</div>
    </div>
  );
}

export function NeumaticosAsignadosCards({ data }: { data: NeumaticoAsignadoCard[] }) {
  const [expandido, setExpandido] = React.useState<string | null>(null);

  if (data.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-blue-100 dark:border-blue-500/20 bg-linear-to-b from-blue-50 dark:from-blue-500/10 via-white dark:via-card to-white dark:to-card px-6 py-9 text-center shadow-[0_6px_20px_rgba(37,99,235,0.07)]">
        {/* halo decorativo */}
        <span className="pointer-events-none absolute -top-10 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-blue-200/30 blur-2xl" />

        <div className="relative flex flex-col items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-blue-400 to-blue-600 text-white shadow-lg shadow-blue-200">
            <Disc3 className="h-7 w-7" />
          </span>

          <div>
            <p className="text-base font-bold text-slate-800 dark:text-slate-100">Aún no hay neumáticos instalados</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              Esta unidad no tiene neumáticos montados. Usa <strong className="font-semibold text-slate-700 dark:text-slate-200">Asignar Neumático</strong> para instalarlos.
            </p>
          </div>

          <p className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-blue-100 dark:border-blue-500/20 bg-white dark:bg-card/80 dark:bg-card/80 px-3 py-1 text-xs text-slate-500 dark:text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            Al instalarlos verás aquí cada posición con su remanente y presión
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {data.map((n) => {
        const codigo = n.CODIGO;
        const diseno = n.DISEÑO ?? n.DISENO;
        const remanente = Number(n.REMANENTE ?? 0);
        const vida = Number(n.ESTADO ?? 0);
        const acento = acentoPorVida(vida);
        const abierto = expandido === codigo;

        return (
          <div
            key={codigo}
            className={`relative overflow-hidden rounded-xl border bg-linear-to-r ${acento.fondo} via-white dark:via-card to-slate-100 dark:to-superficie-2/70 dark:to-superficie-2/70 transition-all duration-150 ${abierto
              ? 'border-slate-300 dark:border-slate-600 shadow-md'
              : `border-slate-200 dark:border-slate-700/80 dark:border-slate-700/80 shadow-sm hover:-translate-y-px hover:shadow-md ${acento.hover}`
              }`}
          >
            {/* Franja de estado */}
            <span className={`absolute inset-y-0 left-0 w-1.5 bg-linear-to-b ${acento.franja}`} />

            <button
              type="button"
              onClick={() => setExpandido(abierto ? null : codigo)}
              className={`flex w-full items-center gap-3 py-2.5 pl-5 pr-3 text-left transition-colors ${abierto ? 'bg-slate-50 dark:bg-superficie-1/80 dark:bg-superficie-1/80' : 'hover:bg-slate-50 dark:hover:bg-superficie-1/50 dark:hover:bg-superficie-1/50'
                }`}
            >
              {/* Posición */}
              <span className={`shrink-0 rounded-lg border px-2.5 py-1 font-mono text-xs font-extrabold tracking-wide ${acento.chip}`}>
                {n.POSICION_NEU || '—'}
              </span>

              {/* Código + ficha */}
              <span className="min-w-0 flex-1">
                <Link
                  href={`/padron/neumatico/${codigo}`}
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm font-bold text-[#167bd9] underline underline-offset-2 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  {codigo}
                </Link>
                <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
                  {[n.MARCA, diseno, n.MEDIDA].filter(Boolean).join(' · ') || '—'}
                </span>
              </span>

              {/* Fecha de asignación — sólo en pantallas anchas, para equilibrar el header */}
              <span className="hidden shrink-0 text-right lg:block">
                <span className="block text-xs uppercase tracking-wide text-slate-400">asignado</span>
                <span className="mt-0.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {n.FECHA_ASIGNACION ? convertToDateHuman(n.FECHA_ASIGNACION) : '—'}
                </span>
              </span>

              {/* Separador */}
              <span className="hidden h-8 w-px shrink-0 bg-slate-200 dark:bg-superficie-3/90 dark:bg-superficie-3/90 sm:block" />

              {/* Remanente */}
              <span className="shrink-0 text-center">
                <span className={`block text-base font-extrabold leading-none ${acento.texto}`}>
                  {remanente}
                  <span className="ml-0.5 text-xs font-bold">mm</span>
                </span>
                <span className="mt-0.5 block text-xs uppercase tracking-wide text-slate-400">remanente</span>
              </span>

              {/* Vida útil */}
              <span className="hidden w-20 shrink-0 sm:block">
                <span className="block h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-superficie-3">
                  <span
                    className={`block h-full rounded-full ${acento.barra}`}
                    style={{ width: `${Math.min(100, Math.max(0, vida))}%` }}
                  />
                </span>
                <span className={`mt-1 block text-xs font-bold ${acento.texto}`}>{vida}% vida</span>
              </span>

              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-card text-slate-400 transition-transform duration-200 ${abierto ? 'rotate-180' : ''
                  }`}
              >
                <ChevronDown size={15} />
              </span>
            </button>

            {/* Detalle desplegable */}
            <div
              className={`grid transition-all duration-200 ease-out ${abierto ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
            >
              <div className="overflow-hidden">
                <div className="grid grid-cols-2 gap-2 border-t border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-superficie-2/80 dark:bg-superficie-2/80 px-4 py-3 pl-5 sm:grid-cols-3 lg:grid-cols-5">
                  <DetalleItem label="Recuperado" value={<EsRecuperadoBadge esRecuperado={n.RECUPERADO ?? false} />} />
                  <DetalleItem label="Fecha de asignación" value={n.FECHA_ASIGNACION ? convertToDateHuman(n.FECHA_ASIGNACION) : '—'} />
                  <DetalleItem label="Fecha de registro" value={n.FECHA_ULTIMO_SUCESO ? convertToDateHuman(n.FECHA_ULTIMO_SUCESO) : '—'} />
                  <DetalleItem label="Presión de aire" value={n.PRESION_AIRE !== null && n.PRESION_AIRE !== undefined ? `${n.PRESION_AIRE} psi` : '—'} />
                  <DetalleItem label="Torque aplicado" value={n.TORQUE_APLICADO !== null && n.TORQUE_APLICADO !== undefined ? `${n.TORQUE_APLICADO} N·m` : '—'} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
