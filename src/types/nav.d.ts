export interface NavItemConfig {
  key: string;
  title?: string;
  disabled?: boolean;
  external?: boolean;
  label?: string;
  icon?: string;
  href?: string;
  /**
   * Sub-items. Con `items` el elemento pasa a ser un grupo desplegable y su
   * `href` se ignora: solo abre y cierra la lista. Sin `items` es un enlace.
   */
  items?: NavItemConfig[];
  /** Por defecto un item está activo en su `href` y en todo lo que cuelgue de él. */
  matcher?: { type: 'startsWith' | 'equals'; href: string };
  blockedUsers?: string[];
  allowedUsers?: string[];
}

/** Bloque del menú: un título opcional y sus items (enlaces o grupos). */
export interface NavSeccion {
  key: string;
  /** Rótulo sobre el bloque. Sin título, el bloque se separa solo con espacio. */
  titulo?: string;
  items: NavItemConfig[];
}
