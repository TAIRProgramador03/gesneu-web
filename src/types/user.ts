export interface Perfil {
  codigo?: string;
  descripcion?: string;
}

export interface Taller {
  taller: string
}

export interface User {
  id: string;
  name?: string;
  avatar?: string;
  email?: string;
  usuario?: string;
  nombre?: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  perfiles?: Perfil[];
  talleres?: Array<Taller | string> | Taller | string;
  [key: string]: unknown;
}
