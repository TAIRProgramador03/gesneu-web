import type { NavItemConfig } from '@/types/nav';

/** ¿La ruta actual cuelga de este item? Compara por segmentos: /mapa no activa /mapas. */
export function isNavItemActive({
  disabled,
  external,
  href,
  matcher,
  pathname,
}: Pick<NavItemConfig, 'disabled' | 'external' | 'href' | 'matcher'> & { pathname: string }): boolean {
  if (disabled || !href || external) {
    return false;
  }

  if (matcher?.type === 'equals') {
    return pathname === matcher.href;
  }

  const base = matcher?.href ?? href;
  return pathname === base || pathname.startsWith(base.endsWith('/') ? base : `${base}/`);
}

/**
 * Devuelve la `key` del único item activo del menú. Si varios coinciden
 * (p. ej. /padron y un sub-item /padron/placa), gana el de href más largo,
 * para que nunca se iluminen dos a la vez.
 */
export function encontrarClaveActiva(items: NavItemConfig[], pathname: string): string | null {
  let mejor: { key: string; largo: number } | null = null;

  const recorrer = (lista: NavItemConfig[]): void => {
    for (const item of lista) {
      if (item.items?.length) {
        recorrer(item.items);
        continue;
      }
      if (isNavItemActive({ ...item, pathname })) {
        const largo = (item.matcher?.href ?? item.href ?? '').length;
        if (!mejor || largo > mejor.largo) mejor = { key: item.key, largo };
      }
    }
  };

  recorrer(items);
  return mejor ? (mejor as { key: string }).key : null;
}
