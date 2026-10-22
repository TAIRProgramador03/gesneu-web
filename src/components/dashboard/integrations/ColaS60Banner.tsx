'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import Collapse from '@mui/material/Collapse';
import { ArrowRight, ChevronDown, CircleCheckBig, Clock3, ListChecks, Loader2, TriangleAlert } from 'lucide-react';
import { Button as ButtonCustom } from '@/components/ui/button';
import type { ColaS60Cabeza } from '@/api/Neumaticos';

/**
 * Aviso de la cola obligatoria de S60.
 *
 * Mientras haya una S60 sin regularizar, solo se puede trabajar la placa de la
 * más antigua. Esto se lo dice al técnico ANTES de que empiece: el backend
 * bloquea igual, pero enterarse recién al guardar significa haber llenado todo
 * un modal para nada.
 *
 * Muestra la cola completa, no solo la cabeza, para que se vea qué viene
 * después. Pero el botón "Ir a" existe únicamente en la cabeza: las demás están
 * bloqueadas y mandar al técnico a una de ellas sería mandarlo a perder tiempo.
 *
 * No se muestra cuando no hay pendientes — ahí no hay nada que avisar.
 */

/** `20261021` → `21/10/2026`. Es un entero AAAAMMDD, no una fecha. */
function formatearFecha(fecha: number): string {
  const texto = String(fecha ?? '');
  if (!/^\d{8}$/.test(texto)) return texto;
  return `${texto.slice(6, 8)}/${texto.slice(4, 6)}/${texto.slice(0, 4)}`;
}

/**
 * `94226` → `09:42`.
 *
 * Es HHMMSS numérico, así que las horas menores a 10 pierden el cero de
 * adelante. Sin rellenar a 6, "94226" se leería como "94:22".
 */
function formatearHora(hora: number): string {
  const texto = String(hora ?? '').padStart(6, '0');
  if (!/^\d{6}$/.test(texto)) return '';
  return `${texto.slice(0, 2)}:${texto.slice(2, 4)}`;
}

function contarCambios(cantidad: number): string {
  return `${cantidad} ${cantidad === 1 ? 'cambio' : 'cambios'}`;
}

interface ColaS60BannerProps {
  /** Toda la cola agrupada por S60, de la más antigua a la más nueva. */
  grupos: ColaS60Cabeza[];
  /** Placa que el usuario está viendo ahora. */
  placaActual?: string | null;
  /** Carga la placa de la cabeza en la pantalla. */
  onIrAPlaca?: (placa: string) => void;
  /** Todavía no se sabe si hay pendientes. */
  cargando?: boolean;
}

export function ColaS60Banner({ grupos, placaActual, onIrAPlaca, cargando = false }: ColaS60BannerProps) {
  const [abierto, setAbierto] = React.useState(false);

  const cabeza = grupos[0];

  /**
   * Mientras se averigua la cola hay que decirlo.
   *
   * Si no, el aviso simplemente no está y el técnico asume que puede trabajar
   * cualquier placa — se entera de lo contrario cuando el banner aparece de
   * golpe, a veces ya con el modal abierto.
   */
  if (cargando && !cabeza) {
    return (
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 6px 20px rgba(15, 23, 42, 0.06)',
          border: 'none',
        }}
      >
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-linear-to-r from-slate-50 to-slate-100 p-4 md:p-5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-600">
            <Loader2 size={22} className="animate-spin" />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="font-bold text-slate-800">Revisando S60 pendientes…</span>
            <span className="text-sm text-slate-600">
              Un momento: puede que haya una placa que atender primero.
            </span>
          </div>
        </div>
      </Card>
    );
  }

  if (!cabeza) return null;

  const siguientes = grupos.slice(1);
  const enLaPlacaCorrecta =
    Boolean(placaActual) &&
    placaActual!.trim().toUpperCase() === cabeza.placa.trim().toUpperCase();

  const cambios = `${contarCambios(cabeza.lineas.length)} ${cabeza.lineas.length === 1 ? 'pendiente' : 'pendientes'}`;
  const cuando = `${formatearFecha(cabeza.fecha)} · ${formatearHora(cabeza.hora)}`;

  // Dos tonos: ámbar cuando bloquea, teal cuando el técnico ya está donde debe.
  const tono = enLaPlacaCorrecta
    ? {
        card: 'border-teal-200 bg-linear-to-r from-teal-50 to-emerald-50',
        icono: 'bg-teal-100 text-teal-700',
        titulo: 'text-teal-900',
        texto: 'text-teal-800',
        chip: 'bg-teal-600 text-white',
        meta: 'bg-white/70 text-teal-800 border-teal-200',
        separador: 'border-teal-200',
        apagado: 'text-teal-700/70',
      }
    : {
        card: 'border-amber-200 bg-linear-to-r from-amber-50 to-orange-50',
        icono: 'bg-amber-100 text-amber-700',
        titulo: 'text-amber-900',
        texto: 'text-amber-800',
        chip: 'bg-amber-600 text-white',
        meta: 'bg-white/70 text-amber-800 border-amber-200',
        separador: 'border-amber-200',
        apagado: 'text-amber-700/70',
      };

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: '0 6px 20px rgba(15, 23, 42, 0.06)',
        border: 'none',
      }}
    >
      <div className={`rounded-2xl border p-4 md:p-5 ${tono.card}`}>
        {/* --- La que toca ahora ------------------------------------------ */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${tono.icono}`}>
            {enLaPlacaCorrecta ? <CircleCheckBig size={22} /> : <TriangleAlert size={22} />}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`font-bold ${tono.titulo}`}>
                {enLaPlacaCorrecta ? 'Esta es la placa que toca regularizar' : 'Hay una S60 pendiente'}
              </span>
              <span className={`rounded-lg px-2.5 py-1 text-sm font-bold shadow-sm ${tono.chip}`}>
                {cabeza.placa}
              </span>
            </div>

            <p className={`text-sm ${tono.texto}`}>
              {enLaPlacaCorrecta
                ? 'Completa estos cambios para que la cola avance a la siguiente S60.'
                : `Primero hay que regularizar la S60 más antigua, de la placa ${cabeza.placa}. Hasta completarla no se puede trabajar en otra placa.`}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${tono.meta}`}>
                <Clock3 size={14} />
                {cuando}
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${tono.meta}`}>
                <ListChecks size={14} />
                {cambios}
              </span>
              {cabeza.taller && (
                <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${tono.meta}`}>
                  {cabeza.taller}
                </span>
              )}
            </div>
          </div>

          {!enLaPlacaCorrecta && onIrAPlaca && (
            <ButtonCustom
              variant="warning"
              className="w-full shrink-0 md:w-auto"
              onClick={() => onIrAPlaca(cabeza.placa)}
            >
              Ir a {cabeza.placa}
              <ArrowRight />
            </ButtonCustom>
          )}
        </div>

        {/* --- Lo que viene después --------------------------------------- */}
        {siguientes.length > 0 && (
          <div className={`mt-4 border-t pt-3 ${tono.separador}`}>
            <button
              type="button"
              onClick={() => setAbierto((v) => !v)}
              className={`flex w-full items-center justify-between gap-2 text-sm font-semibold ${tono.texto}`}
            >
              <span>
                Después siguen {siguientes.length}{' '}
                {siguientes.length === 1 ? 'S60 más' : 'S60 más'}
              </span>
              <ChevronDown
                size={18}
                className={`transition-transform ${abierto ? 'rotate-180' : ''}`}
              />
            </button>

            <Collapse in={abierto} timeout="auto" unmountOnExit>
              <ul className="mt-3 flex flex-col gap-2">
                {siguientes.map((grupo, i) => (
                  <li
                    key={`${grupo.almacen}-${grupo.comprobante}`}
                    className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-white/80 bg-white/60 px-3 py-2"
                  >
                    <span className={`text-xs font-bold tabular-nums ${tono.apagado}`}>
                      #{i + 2}
                    </span>
                    <span className={`text-sm font-bold ${tono.titulo}`}>{grupo.placa}</span>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${tono.apagado}`}>
                      <Clock3 size={13} />
                      {formatearFecha(grupo.fecha)} · {formatearHora(grupo.hora)}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${tono.apagado}`}>
                      <ListChecks size={13} />
                      {contarCambios(grupo.lineas.length)}
                    </span>
                    {grupo.taller && (
                      <span className={`text-xs font-medium ${tono.apagado}`}>{grupo.taller}</span>
                    )}
                  </li>
                ))}
              </ul>
              <p className={`mt-2 text-xs ${tono.apagado}`}>
                Estas quedan bloqueadas hasta completar la de arriba.
              </p>
            </Collapse>
          </div>
        )}
      </div>
    </Card>
  );
}

export default ColaS60Banner;
