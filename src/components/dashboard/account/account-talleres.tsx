'use client';

import * as React from 'react';
import { Building2, Search, SearchX } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { useUser } from '@/hooks/use-user';
import { Tarjeta } from '@/components/ui/Tarjeta';

import { datosDeCuenta } from './account-utils';

const VISIBLES_INICIAL = 12;

export function AccountTalleres(): React.JSX.Element {
  const { user } = useUser();
  const { talleres, perfiles } = datosDeCuenta(user);
  const [busqueda, setBusqueda] = React.useState('');
  const [verTodos, setVerTodos] = React.useState(false);

  const filtrados = React.useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return q ? talleres.filter((t) => t.toLowerCase().includes(q)) : talleres;
  }, [talleres, busqueda]);

  // Al buscar se muestran todas las coincidencias; sin búsqueda, solo las primeras.
  const mostrarTodos = verTodos || busqueda.trim() !== '';
  const visibles = mostrarTodos ? filtrados : filtrados.slice(0, VISIBLES_INICIAL);
  const ocultos = filtrados.length - visibles.length;

  return (
    <div className="flex flex-col gap-6">
      <Tarjeta acento="#167bd9" esquina className="sm:p-6 animate-in fade-in slide-in-from-bottom-2 delay-150 duration-500 motion-reduce:animate-none">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Talleres asignados</h2>
            <p className="text-sm text-muted-foreground">
              Los talleres cuyos neumáticos y vehículos puedes consultar.
            </p>
          </div>
          {talleres.length > VISIBLES_INICIAL && (
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar taller…"
                className="pl-9"
                aria-label="Buscar taller"
              />
            </div>
          )}
        </div>

        {talleres.length === 0 ? (
          <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
            <Building2 className="size-8" />
            Tu usuario no tiene talleres asignados.
          </div>
        ) : filtrados.length === 0 ? (
          <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
            <SearchX className="size-8" />
            Ningún taller coincide con «{busqueda}».
          </div>
        ) : (
          <>
            <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {visibles.map((t) => (
                <li
                  key={t}
                  className="flex min-w-0 items-center gap-2.5 rounded-xl border bg-superficie-1 px-3 py-2.5 transition-colors hover:border-sky-300 hover:bg-sky-50 dark:hover:border-sky-500/40 dark:hover:bg-sky-500/10"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300">
                    <Building2 className="size-4" />
                  </span>
                  <span className="min-w-0 truncate text-sm font-medium" title={t}>
                    {t}
                  </span>
                </li>
              ))}
            </ul>
            {ocultos > 0 && (
              <button
                type="button"
                onClick={() => setVerTodos(true)}
                className="mt-3 text-sm font-semibold text-sky-800 hover:underline dark:text-sky-300"
              >
                Ver los {ocultos} talleres restantes
              </button>
            )}
            {verTodos && talleres.length > VISIBLES_INICIAL && busqueda.trim() === '' && (
              <button
                type="button"
                onClick={() => setVerTodos(false)}
                className="mt-3 text-sm font-semibold text-sky-800 hover:underline dark:text-sky-300"
              >
                Mostrar menos
              </button>
            )}
          </>
        )}
      </Tarjeta>

      <Tarjeta acento="#0c87da" esquina className="sm:p-6 animate-in fade-in slide-in-from-bottom-2 delay-200 duration-500 motion-reduce:animate-none">
        <h2 className="text-lg font-bold">Perfiles</h2>
        <p className="text-sm text-muted-foreground">Definen qué acciones puedes hacer en el sistema.</p>
        {perfiles.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Sin perfiles asignados.</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {perfiles.map((p, i) => (
              <li
                key={`${p.codigo ?? 'perfil'}-${i}`}
                className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1.5 text-sm font-semibold text-sky-900 dark:bg-sky-500/15 dark:text-sky-200"
              >
                {p.descripcion || 'Sin descripción'}
                {p.codigo && (
                  <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-bold tabular-nums dark:bg-white/10">
                    {p.codigo}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
    </div>
  );
}
