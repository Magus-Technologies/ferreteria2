/**
 * Tipos para Almacén y sus relaciones
 */

export interface Almacen {
  id: number;
  name: string;
  direccion?: string;
  /** Slot de dirección de empresa que corresponde a este almacén: D1 / D2 / D3 / D4 */
  empresa_dir_slot?: 'D1' | 'D2' | 'D3' | 'D4' | null;
  activo: boolean;
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
  empresa_dir_slot?: 'D1' | 'D2' | 'D3' | 'D4' | null;
}

export interface UpdateAlmacenInput {
  name: string;
  direccion?: string;
  empresa_dir_slot?: 'D1' | 'D2' | 'D3' | 'D4' | null;
}
