import { apiRequest } from '../api';
import type { ApiResponse } from '~/app/_types/api';

export interface ProductoAlmacenByCodProductoParams {
  cod_producto: string;
  almacen_id: number;
}

export interface ProductoAlmacenByCodProductoResponse {
  cod_producto: string;
  producto_almacen_id: number;
}

export interface ProductoAlmacenByCodProductoFullResponse {
  data: ProductoAlmacenByCodProductoResponse[];
  advertencias?: string[];
}

export interface UnidadDerivadaParams {
  name: string;
}

export interface UnidadDerivadaResponse {
  id: number;
  name: string;
}

export interface UnidadDerivadaFullResponse {
  data: UnidadDerivadaResponse[];
}

export interface ImportDetallePreciosItem {
  producto_almacen: {
    connect: {
      id: number;
    };
  };
  unidad_derivada: {
    connect: {
      id: number;
    };
  };
  factor: number;
  precio_publico: number;
  comision_publico?: number;
  precio_especial?: number;
  comision_especial?: number;
  activador_especial?: number;
  precio_minimo?: number;
  comision_minimo?: number;
  activador_minimo?: number;
  precio_ultimo?: number;
  comision_ultimo?: number;
  activador_ultimo?: number;
}

export interface ImportDetallePreciosResponse {
  data: ImportDetallePreciosItem[];
  message: string;
}

export const detallePreciosApi = {
  /**
   * Importar detalles de precios (unidades derivadas)
   */
  async import(data: { data: ImportDetallePreciosItem[] }): Promise<ApiResponse<ImportDetallePreciosResponse>> {
    return apiRequest<ImportDetallePreciosResponse>('/detalle-precios/import', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Obtener ProductoAlmacen por código de producto y almacén
   */
  async getProductoAlmacenByCodProducto(
    data: ProductoAlmacenByCodProductoParams[]
  ): Promise<ApiResponse<ProductoAlmacenByCodProductoFullResponse>> {
    return apiRequest<ProductoAlmacenByCodProductoFullResponse>('/detalle-precios/get-producto-almacen', {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  },

  /**
   * Importar/crear unidades derivadas
   */
  async importarUnidadesDerivadas(
    data: UnidadDerivadaParams[]
  ): Promise<ApiResponse<UnidadDerivadaFullResponse>> {
    return apiRequest<UnidadDerivadaFullResponse>('/detalle-precios/importar-unidades-derivadas', {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  },
};
