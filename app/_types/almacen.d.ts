/**
 * Tipos para Almacén y sus relaciones
 */

export interface Almacen {
  id: number;
  name: string;
  direccion?: string;
  created_at: string;
  updated_at: string;
}

export interface AlmacenesResponse {
  data: Almacen[];
}

export interface AlmacenResponse {
  data: Almacen;
}

export interface CreateAlmacenInput {
  name: string;
  direccion?: string;
}

export interface UpdateAlmacenInput {
  name: string;
  direccion?: string;
}
