import type { Perfil, User } from '@/types/user';

export interface DatosCuenta {
  nombre: string;
  apellidos: string;
  nombreCompleto: string;
  iniciales: string;
  usuario: string;
  correo: string;
  perfiles: Perfil[];
  rolPrincipal: string;
  talleres: string[];
}

/** Ordena lo que llega del contexto de usuario en campos listos para pintar. */
export function datosDeCuenta(user: User | null): DatosCuenta {
  const nombre = String(user?.nombre ?? '').trim();
  const apellidos = `${String(user?.apellido_paterno ?? '')} ${String(user?.apellido_materno ?? '')}`.trim();
  const nombreCompleto = `${nombre} ${apellidos}`.trim() || String(user?.name ?? '').trim() || 'Usuario';
  const usuario = String(user?.usuario ?? '').trim();

  const iniciales =
    nombreCompleto
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join('') || 'U';

  const perfiles = Array.isArray(user?.perfiles) ? user.perfiles : [];

  const bruto = user?.talleres;
  const lista = Array.isArray(bruto) ? bruto : bruto !== null && bruto !== undefined ? [bruto] : [];
  const talleres = lista
    .map((t) => (typeof t === 'string' ? t : t?.taller ?? ''))
    .map((t) => t.trim())
    .filter(Boolean);

  return {
    nombre,
    apellidos,
    nombreCompleto,
    iniciales,
    usuario,
    correo: String(user?.email ?? '').trim(),
    perfiles,
    rolPrincipal: String(perfiles[0]?.descripcion ?? '').trim(),
    talleres,
  };
}
