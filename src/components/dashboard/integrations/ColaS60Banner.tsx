'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import Collapse from '@mui/material/Collapse';
import { ArrowRight, ChevronDown, CircleCheckBig, Clock3, Info, ListChecks, Loader2, MapPinned, TriangleAlert, Wrench } from 'lucide-react';
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
  /**
   * El usuario no está sujeto a la cola (GESNEU / EGAMBOA).
   *
   * Se sigue mostrando —saber qué hay pendiente es útil igual— pero sin decirle
   * que algo está bloqueado, porque para él no lo está.
   */
  soloInformativo?: boolean;
}

export function ColaS60Banner({
  grupos,
  placaActual,
  onIrAPlaca,
  cargando = false,
  soloInformativo = false,
}: ColaS60BannerProps) {
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
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-linear-to-r from-slate-50 dark:from-superficie-1 to-slate-100 dark:to-superficie-2 p-4 md:p-5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-200 dark:bg-superficie-3 text-slate-600 dark:text-slate-300">
            <Loader2 size={22} className="animate-spin" />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="font-bold text-slate-800 dark:text-slate-100">Revisando S60 pendientes…</span>
            <span className="text-sm text-slate-600 dark:text-slate-300">
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

  // Tres tonos: azul cuando solo informa, teal cuando el técnico ya está donde
  // debe, ámbar cuando bloquea.
  const tono = soloInformativo
    ? {
        card: 'border-sky-200 dark:border-sky-500/30 bg-linear-to-r from-sky-50 dark:from-sky-500/10 to-blue-50 dark:to-blue-500/10',
        icono: 'bg-sky-100 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300',
        titulo: 'text-sky-900 dark:text-sky-200',
        texto: 'text-sky-800 dark:text-sky-200',
        chip: 'bg-sky-600 text-white',
        meta: 'bg-white dark:bg-card/70 text-sky-800 dark:text-sky-200 border-sky-200 dark:border-sky-500/30',
        separador: 'border-sky-200 dark:border-sky-500/30',
        apagado: 'text-sky-700 dark:text-sky-300/70',
      }
    : enLaPlacaCorrecta
    ? {
        card: 'border-teal-200 dark:border-teal-500/30 bg-linear-to-r from-teal-50 dark:from-teal-500/10 to-emerald-50 dark:to-emerald-500/10',
        icono: 'bg-teal-100 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300',
        titulo: 'text-teal-900 dark:text-teal-200',
        texto: 'text-teal-800 dark:text-teal-200',
        chip: 'bg-teal-600 text-white',
        meta: 'bg-white dark:bg-card/70 dark:bg-card/70 text-teal-800 dark:text-teal-200 border-teal-200 dark:border-teal-500/30',
        separador: 'border-teal-200 dark:border-teal-500/30',
        apagado: 'text-teal-700 dark:text-teal-300/70 dark:text-teal-300/70',
      }
    : {
        card: 'border-amber-200 dark:border-amber-500/30 bg-linear-to-r from-amber-50 dark:from-amber-500/10 to-orange-50 dark:to-orange-500/10',
        icono: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300',
        titulo: 'text-amber-900 dark:text-amber-200',
        texto: 'text-amber-800 dark:text-amber-200',
        chip: 'bg-amber-600 text-white',
        meta: 'bg-white dark:bg-card/70 dark:bg-card/70 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-500/30',
        separador: 'border-amber-200 dark:border-amber-500/30',
        apagado: 'text-amber-700 dark:text-amber-300/70 dark:text-amber-300/70',
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
            {soloInformativo ? <Info size={22} /> : enLaPlacaCorrecta ? <CircleCheckBig size={22} /> : <TriangleAlert size={22} />}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`font-bold ${tono.titulo}`}>
                {soloInformativo
                  ? 'S60 pendiente más antigua'
                  : enLaPlacaCorrecta
                    ? 'Esta es la placa que toca regularizar'
                    : 'Hay una S60 pendiente'}
              </span>
              <span className={`rounded-lg px-2.5 py-1 text-sm font-bold shadow-sm ${tono.chip}`}>
                {cabeza.placa}
              </span>
            </div>

            <p className={`text-sm ${tono.texto}`}>
              {soloInformativo
                ? `La más antigua sin regularizar es la de la placa ${cabeza.placa}. A ti la cola no te bloquea: puedes trabajar cualquier placa en el orden que necesites.`
                : enLaPlacaCorrecta
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
              {cabeza.operacion && (
                <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${tono.meta}`}>
                  <MapPinned size={14} />
                  {cabeza.operacion}
                </span>
              )}
              {cabeza.taller && (
                <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${tono.meta}`}>
                  <Wrench size={14} />
                  {cabeza.taller}
                </span>
              )}
            </div>
          </div>

          {!enLaPlacaCorrecta && onIrAPlaca && (
            <ButtonCustom
              variant={soloInformativo ? 'default' : 'warning'}
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
                    className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-white dark:border-white/10/80 dark:border-white/10 bg-white dark:bg-card/60 dark:bg-card/60 px-3 py-2"
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
                    {grupo.operacion && (
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${tono.apagado}`}>
                        <MapPinned size={13} />
                        {grupo.operacion}
                      </span>
                    )}
                    {grupo.taller && (
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${tono.apagado}`}>
                        <Wrench size={13} />
                        {grupo.taller}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <p className={`mt-2 text-xs ${tono.apagado}`}>
                {soloInformativo
                  ? 'Para el resto de usuarios estas quedan bloqueadas hasta completar la de arriba.'
                  : 'Estas quedan bloqueadas hasta completar la de arriba.'}
              </p>
            </Collapse>
          </div>
        )}
      </div>
    </Card>
  );
}

export default ColaS60Banner;
