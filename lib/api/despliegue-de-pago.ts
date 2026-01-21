import { apiRequest, type ApiResponse } from '../api';

// ============= INTERFACES =============

export interface DespliegueDePago {
  id: string;
  name: string;
  adicional: number;
  mostrar: boolean;
  metodo_de_pago_id: string;
  requiere_numero_serie: boolean;
  sobrecargo_porcentaje: number;
  tipo_sobrecargo: 'porcentaje' | 'monto_fijo' | 'ninguno';
}

export interface NumeroOperacionPago {
  id: string;
  venta_id?: string;
  compra_id?: string;
  despliegue_pago_id: string;
  numero_operacion: string;
  monto: number;
  sobrecargo_aplicado: number;
  monto_total: number;
  fecha_operacion: string;
  user_id: string;
  observaciones?: string;
}

export interface GetDesplieguesDePagoParams {
  mostrar?: boolean;
}

// Laravel wraps responses in { data: ... }
interface LaravelResponse<T> {
  data: T;
}

// ============= API FUNCTIONS =============

/**
 * Calcular sobrecargo basado en el método de pago
 */
export function calcularSobrecargo(metodoPago: DespliegueDePago, monto: number): number {
  if (metodoPago.tipo_sobrecargo === 'porcentaje') {
    return Number((monto * (metodoPago.sobrecargo_porcentaje / 100)).toFixed(2));
  } else if (metodoPago.tipo_sobrecargo === 'monto_fijo') {
    return metodoPago.adicional;
  }
  return 0;
}

/**
 * Calcular monto total con sobrecargo
 */
export function calcularMontoTotal(metodoPago: DespliegueDePago, monto: number): number {
  const sobrecargo = calcularSobrecargo(metodoPago, monto);
  return Number((monto + sobrecargo).toFixed(2));
}

class DespliegueDePagoApi {
  /**
   * Get all despliegues de pago
   */
  async getAll(params?: GetDesplieguesDePagoParams): Promise<ApiResponse<LaravelResponse<DespliegueDePago[]>>> {
    const queryParams = new URLSearchParams();

    if (params?.mostrar !== undefined) {
      queryParams.append('mostrar', params.mostrar ? '1' : '0');
    }

    const queryString = queryParams.toString();
    const url = `/despliegues-de-pago${queryString ? `?${queryString}` : ''}`;

    return apiRequest<LaravelResponse<DespliegueDePago[]>>(url, {
      method: 'GET',
    });
  }

  /**
   * Get a single despliegue de pago by ID
   */
  async getById(id: string): Promise<ApiResponse<LaravelResponse<DespliegueDePago>>> {
    return apiRequest<LaravelResponse<DespliegueDePago>>(`/despliegues-de-pago/${id}`, {
      method: 'GET',
    });
  }
}

export const despliegueDePagoApi = new DespliegueDePagoApi();
