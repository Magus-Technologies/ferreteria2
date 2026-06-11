/**
 * API para Gestión Contable y Financiera - Mis Ganancias
 */

import { apiRequest, ApiResponse } from "../api";

export interface GananciaDetalle {
  id: string;
  fecha: string;
  hora_emision: string;
  fecha_vencimiento: string | null;
  tipo_doc: string;
  numero: string;
  f_pago: string;
  cliente: string;
  vendedor: string;
  producto: string;
  marca: string;
  cant: number;
  p_unit: number;
  subtot: number;
  costo: number;
  costo_total: number;
  ganancia: number;
  cc: string;
  created_at: string;
  updated_at: string;
  // "Lote 1/2" cuando la venta se desglosa por costos PEPS distintos; null si no.
  desglose_lote?: string | null;
}

export interface ResumenGanancias {
  ventas: number;
  costo: number;
  ganancia: number;
  gastos_u: number;
  neto: number;
  perdida: number;
  total_transacciones: number;
}

export interface FiltrosGanancias {
  almacen_id?: number;
  desde?: string;
  hasta?: string;
  cliente_id?: number;
  search?: string; // Búsqueda de cliente por texto
  user_id?: string;
  producto_servicio?: string;
  marca?: string;
  forma_pago?: string;
  tipo_doc?: string;
  serie?: string;
  numero?: number;
  sucursal?: string;
  confirmar_caja?: string;
  mostrar_hora?: string;
  incluir?: string;
  per_page?: number;
  page?: number;
}

export interface ResponseGanancias {
  data: GananciaDetalle[];
  resumen: ResumenGanancias;
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

export const gananciasApi = {
  /**
   * Obtener reporte de ganancias con filtros
   */
  async getGanancias(filtros?: FiltrosGanancias) {
    const queryString = filtros
      ? "?" + new URLSearchParams(
          Object.entries(filtros).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
              acc[key] = String(value);
            }
            return acc;
          }, {} as Record<string, string>)
        ).toString()
      : "";
    
    return apiRequest<ResponseGanancias>(
      `/ganancias${queryString}`
    );
  },

  /**
   * Obtener resumen de ganancias (para las cards)
   */
  async getResumen(filtros?: Omit<FiltrosGanancias, 'per_page' | 'page'>) {
    const queryString = filtros
      ? "?" + new URLSearchParams(
          Object.entries(filtros).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
              acc[key] = String(value);
            }
            return acc;
          }, {} as Record<string, string>)
        ).toString()
      : "";
    
    return apiRequest<{ data: ResumenGanancias }>(
      `/ganancias/resumen${queryString}`
    );
  },

  /**
   * Exportar reporte de ganancias
   */
  async exportar(filtros: Omit<FiltrosGanancias, 'per_page' | 'page'> & { formato: 'excel' | 'pdf' }) {
    return apiRequest<{ data: { url: string; nombre: string } }>(
      "/ganancias/exportar",
      {
        method: "POST",
        body: JSON.stringify(filtros),
      }
    );
  },

  /**
   * Enviar reporte por correo
   */
  async enviarCorreo(email: string, filtros?: Omit<FiltrosGanancias, 'per_page' | 'page'>) {
    return apiRequest<{ message: string }>(
      "/ganancias/enviar-correo",
      {
        method: "POST",
        body: JSON.stringify({
          email,
          ...filtros,
        }),
      }
    );
  },

  /**
   * Obtener pagos de compras detallados
   */
  getPagosCompras: async (filters?: any) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    const url = queryString ? `/ganancias/pagos-compras?${queryString}` : '/ganancias/pagos-compras';
    return apiRequest<{ data: { pagos: any[]; gastos: any[]; resumen: any } }>(url);
  },

  /**
   * Obtener detalle de pérdidas (legacy - solo ventas bajo costo y salidas)
   */
  getPerdidasDetalle: async (filters?: any) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    const url = queryString ? `/ganancias/perdidas-detalle?${queryString}` : '/ganancias/perdidas-detalle';
    return apiRequest<{ data: { detalles: any[]; resumen: any } }>(url);
  },

  /**
   * Obtener análisis completo de pérdidas (todas las categorías)
   */
  getAnalisisPerdidas: async (filters?: any) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    const url = queryString ? `/analisis-perdidas?${queryString}` : '/analisis-perdidas';
    return apiRequest<{
      data: {
        detalles: any[];
        resumen: {
          ventas_bajo_costo: number;
          descuentos_aplicados: number;
          comisiones_vendedor: number;
          salidas_almacen: number;
          notas_credito: number;
          total_perdidas: number;
        };
        por_categoria: Array<{
          categoria: string;
          monto: number;
          cantidad: number;
        }>;
      }
    }>(url);
  },

  /**
   * Obtener análisis PEPS real desde la base de datos.
   * GET /analisis-peps
   */
  getAnalisisPeps: async (filtros?: FiltrosPepsAnalisis) => {
    const params = new URLSearchParams();
    if (filtros) {
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    const url = queryString ? `/analisis-peps?${queryString}` : '/analisis-peps';
    return apiRequest<{ data: PepsAnalisisResponse }>(url);
  },

  /**
   * Calcular análisis PEPS con diferencia de tipo de cambio.
   * POST /analisis-peps/calcular
   */
  calcularPeps: async (lotes: PepsLote[], ventas: PepsVenta[]) => {
    return apiRequest<{ data: PepsResultado }>('/analisis-peps/calcular', {
      method: 'POST',
      body: JSON.stringify({ lotes, ventas }),
    });
  },
};

// ============= TIPOS PEPS =============

export interface PepsLote {
  id: number | string;
  label: string;
  costo_usd: number;
  stock: number;
  tc_compra: number;
  tc_pago: number;
}

export interface PepsVenta {
  id: number | string;
  cantidad: number;
  precio: number;
}

export interface PepsFraccion {
  lote_id: number | string;
  lote_label: string;
  cantidad: number;
  costo_usd: number;
  tc_compra: number;
  tc_pago: number;
  costo_tc_compra: number;
  costo_tc_pago: number;
}

export interface PepsResultadoVenta {
  idx: number;
  cantidad: number;
  precio: number;
  ingreso: number;
  fracciones: PepsFraccion[];
  total_costo_tc_compra: number;
  total_costo_tc_pago: number;
  ganancia_tc_compra: number;
  ganancia_tc_pago: number;
  diferencia_cambio: number;
  sin_stock: boolean;
  faltante: number;
}

export interface PepsResultado {
  ventas: PepsResultadoVenta[];
  stock_restante: Record<string, number>;
  resumen: {
    ingreso_total: number;
    ganancia_tc_compra: number;
    ganancia_tc_pago: number;
    diferencia_total: number;
    perdida_por_cambio: boolean;
  };
}

// ============= TIPOS ANÁLISIS PEPS (GET desde DB) =============

export interface FiltrosPepsAnalisis {
  almacen_id?: number;
  desde?: string;
  hasta?: string;
  producto_id?: number;
}

export interface PepsFraccionAnalisis {
  compra_id: number;
  serie_numero: string;
  lote: string | null;
  cantidad: number;
  costo_usd: number;
  tc_compra: number;
  tc_pago: number;
  tc_pago_real: boolean;
  costo_tc_compra: number;
  costo_tc_pago: number;
}

export interface PepsVentaAnalisis {
  venta_id: number;
  fecha: string;
  cantidad: number;
  precio: number;
  ingreso: number;
  fracciones: PepsFraccionAnalisis[];
  total_costo_tc_compra: number;
  total_costo_tc_pago: number;
  ganancia_tc_compra: number;
  ganancia_tc_pago: number;
  diferencia_cambio: number;
  sin_stock: boolean;
  faltante: number;
}

export interface PepsProductoAnalisis {
  producto_id: number;
  producto_nombre: string;
  marca_nombre: string | null;
  total_lotes: number;
  total_ventas: number;
  ventas: PepsVentaAnalisis[];
  resumen_producto: {
    ganancia_tc_compra: number;
    ganancia_tc_pago: number;
    diferencia_cambio: number;
  };
}

export interface PepsAnalisisResponse {
  productos: PepsProductoAnalisis[];
  resumen: {
    ingreso_total: number;
    ganancia_tc_compra: number;
    ganancia_tc_pago?: number;
    diferencia_total?: number;
    perdida_por_cambio?: boolean;
    total_productos: number;
    aviso_sin_tc_pago: boolean;
    tc_actual: number;
    compras_con_riesgo: Array<{
      compra_id: number;
      serie_numero: string;
      variacion_porcentaje: number;
      recomendacion: string;
    }>;
    impacto_si_pagas_hoy: number;
  };
  pending_payments?: Array<{
    compra_id: number;
    serie_numero: string;
    fecha: string;
    proveedor: string;
    dias_desde_compra: number;
    cantidad_total: number;
    costo_usd: number;
    costo_soles: number;
    tc_compra: number;
    tc_actual: number;
    variacion_tc: number;
    variacion_porcentaje: number;
    riesgo_alto: boolean;
    impacto_si_pagas_hoy: number;
    recomendacion: string;
  }>;
}