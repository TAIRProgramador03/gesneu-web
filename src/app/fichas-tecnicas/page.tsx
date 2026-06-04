'use client';

import React, { useMemo, useState } from 'react';
import { ArrowUpRight, FileText, FileX2, Search } from 'lucide-react';

type TipoRodadura = 'A/T' | 'H/T' | 'M/T' | 'MIXTA';
type Marca = 'Hankook' | 'Marshall' | 'Pirelli';

interface FichaTecnica {
  id: string;
  marca: Marca;
  modelo: string;
  medida: string;
  tipo: TipoRodadura;
  pdfUrl: string;
}

const MARCA_COLOR: Record<Marca, string> = {
  Hankook: '#F97316',
  Marshall: '#22C55E',
  Pirelli: '#06B6D4',
};

const TIPO_BADGE: Record<TipoRodadura, { bg: string; text: string }> = {
  'A/T': { bg: '#BFDBFE', text: '#1D4ED8' },
  'H/T': { bg: '#BBF7D0', text: '#15803D' },
  'M/T': { bg: '#FED7AA', text: '#C2410C' },
  'MIXTA': { bg: '#E9D5FF', text: '#7C3AED' },
};

const MARCAS: ('Todos' | Marca)[] = ['Todos', 'Hankook', 'Marshall', 'Pirelli'];

// Data de ejemplo (luego vendrá de API)
const FICHAS: FichaTecnica[] = [
  { id: '1', marca: 'Hankook', modelo: 'Dynapro MT2 - RT05', medida: '265/65 R17', tipo: 'M/T', pdfUrl: '/fichas/LTR-0032 LT265 65R17 RT05.pdf' },
  { id: '2', marca: 'Hankook', modelo: 'Dynapro MT2 - RT05', medida: '265/65 R17', tipo: 'MIXTA', pdfUrl: '/fichas/LTR-0032 LT265 65R17 RT05.pdf' },
  { id: '3', marca: 'Marshall', modelo: 'Road Venture MT51', medida: '265/60 R18', tipo: 'M/T', pdfUrl: '/fichas/MARSHALL MT.pdf' },
  { id: '4', marca: 'Marshall', modelo: 'Road Venture MT51', medida: '265/65 R17', tipo: 'A/T', pdfUrl: '/fichas/MARSHALL MT.pdf' },
  { id: '5', marca: 'Marshall', modelo: 'Road Venture MT51', medida: '265/65 R17', tipo: 'M/T', pdfUrl: '/fichas/MARSHALL MT.pdf' },
  { id: '6', marca: 'Marshall', modelo: 'Road Venture MT51', medida: '265/75 R17', tipo: 'M/T', pdfUrl: '/fichas/MARSHALL MT.pdf' },
  { id: '7', marca: 'Marshall', modelo: 'Road Venture MT51', medida: '225/75 R16', tipo: 'M/T', pdfUrl: '/fichas/MARSHALL MT.pdf' },
  { id: '8', marca: 'Pirelli', modelo: 'Scorpion ATR', medida: '215/75 R15', tipo: 'M/T', pdfUrl: '/fichas/PIRELLI AT + MT.pdf' },
  { id: '9', marca: 'Pirelli', modelo: 'Scorpion ATR', medida: '215/75 R17.5', tipo: 'MIXTA', pdfUrl: '/fichas/PIRELLI AT + MT.pdf' },
  { id: '10', marca: 'Pirelli', modelo: 'Scorpion ATR', medida: '225/75 R16', tipo: 'A/T', pdfUrl: '/fichas/PIRELLI AT + MT.pdf' },
  { id: '11', marca: 'Pirelli', modelo: 'Scorpion ATR', medida: '255/70 R16', tipo: 'A/T', pdfUrl: '/fichas/PIRELLI AT + MT.pdf' },
  { id: '12', marca: 'Pirelli', modelo: 'Scorpion ATR', medida: '265/60 R18', tipo: 'A/T', pdfUrl: '/fichas/PIRELLI AT + MT.pdf' },
  { id: '13', marca: 'Pirelli', modelo: 'Scorpion ATR', medida: '265/65 R17', tipo: 'M/T', pdfUrl: '/fichas/PIRELLI AT + MT.pdf' },
  { id: '14', marca: 'Pirelli', modelo: 'Scorpion ATR', medida: '265/65 R17', tipo: 'A/T', pdfUrl: '/fichas/PIRELLI AT + MT.pdf' },
  { id: '15', marca: 'Pirelli', modelo: 'Scorpion ATR', medida: '265/75 R17', tipo: 'M/T', pdfUrl: '/fichas/PIRELLI AT + MT.pdf' },
];

export default function Page(): React.JSX.Element {
  const [busqueda, setBusqueda] = useState('');
  const [marcaActiva, setMarcaActiva] = useState<'Todos' | Marca>('Todos');

  const fichasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return FICHAS.filter((f) => {
      const coincideMarca = marcaActiva === 'Todos' || f.marca === marcaActiva;
      const coincideTexto =
        q === '' ||
        f.modelo.toLowerCase().includes(q) ||
        f.medida.toLowerCase().includes(q) ||
        f.marca.toLowerCase().includes(q);
      return coincideMarca && coincideTexto;
    });
  }, [busqueda, marcaActiva]);

  const abrirPdf = (url: string) => {
    if (url && url !== '#') window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#002141]">Fichas Técnicas</h1>
          <p className="text-sm text-gray-500">Consulta las fichas técnicas de neumáticos en PDF.</p>
        </div>
        <span className="rounded-full bg-[#002141]/5 px-3 py-1 text-xs font-semibold text-[#002141]">
          {fichasFiltradas.length} {fichasFiltradas.length === 1 ? 'ficha' : 'fichas'}
        </span>
      </div>

      {/* Controles: búsqueda + filtros */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        {/* Barra de búsqueda */}
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por modelo, medida o marca…"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-11 pr-4 text-sm text-gray-800 outline-none transition focus:border-[#185FA5] focus:bg-white focus:ring-4 focus:ring-[#185FA5]/10"
          />
        </div>

        {/* Filtros de marca */}
        <div className="flex flex-wrap gap-2">
          {MARCAS.map((m) => {
            const activo = m === marcaActiva;
            const color = m !== 'Todos' ? MARCA_COLOR[m] : undefined;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMarcaActiva(m)}
                className={[
                  'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition',
                  activo
                    ? 'bg-[#185FA5] text-white shadow-sm'
                    : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50',
                ].join(' ')}
              >
                {color ? (
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: activo ? '#fff' : color }}
                  />
                ) : null}
                {m}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid de tarjetas */}
      {fichasFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-gray-400">
          <FileX2 size={48} strokeWidth={1.5} />
          <p className="text-sm font-medium">No se encontraron fichas</p>
          <p className="text-xs text-gray-400">Prueba con otra búsqueda o marca.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {fichasFiltradas.map((f) => {
            const badge = TIPO_BADGE[f.tipo];
            const color = MARCA_COLOR[f.marca];
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => abrirPdf(f.pdfUrl)}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
              >
                {/* Franja de color de marca */}
                <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: color }} />

                <div className="flex flex-1 flex-col gap-3 p-4 pt-5">
                  {/* Marca + tipo */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {f.marca}
                      </span>
                    </div>
                    <span
                      className="rounded-md px-2 py-0.5 text-xs font-bold"
                      style={{ backgroundColor: badge.bg, color: badge.text }}
                    >
                      {f.tipo}
                    </span>
                  </div>

                  {/* Modelo */}
                  <h3 className="text-base font-semibold leading-snug text-[#002141]">{f.modelo}</h3>

                  {/* Medida */}
                  <span className="w-fit rounded-md bg-gray-100 px-2 py-1 font-mono text-sm text-gray-700">
                    {f.medida}
                  </span>

                  {/* Botón Ver PDF */}
                  <div className="mt-auto flex items-center justify-between gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-red-600 transition group-hover:bg-red-600 group-hover:text-white">
                    <span className="flex items-center gap-1.5 text-xs font-semibold">
                      <FileText size={16} />
                      Ver PDF
                    </span>
                    <ArrowUpRight size={16} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
