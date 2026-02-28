import { apiRequest } from '../api';

export interface DeudaPersonal {
  id: number;
  user_id: number;
  arqueo_diario_id: number;
  monto: number;
  monto_original: number;
  monto_abonado: number;
  saldo_pendiente: number;
  estado: 'pendiente' | 'parcialmente_pagada' | 'pagada';
  observaciones?: string;
  created_at: string;
  updated_at: string;
  porcentaje_pagado: number;
  esta_pagada: boolean;
  user?: {
    id: number;
    name: string;
  };
  arqueo_diario?: {
    id: number;
    apertura_cierre_caja?: {
      id: number;
      fecha_cierre: string;
      caja_principal?: {
        id: number;
        nombre: string;
      };
    };
  };
  abonos?: AbonoDeudaPersonal[];
}

export interface AbonoDeudaPersonal {
  id: number;
  deuda_personal_id: number;
  monto: number;
  metodo_pago_id?: number;
  numero_operacion?: string;
  observaciones?: string;
  saldo_anterior: number;
  saldo_despues: number;
  registrado_por_user_id: number;
  fecha_abono: string;
  created_at: string;
  updated_at: string;
  metodo_pago?: {
    id: number;
    nombre: string;
  };
  registrado_por?: {
    id: number;
    name: string;
  };
}

export interface RegistrarAbonoData {
  deuda_personal_id: number;
  monto: number;
  metodo_pago_id?: number;
  numero_operacion?: string;
  observaciones?: string;
}

export const deudaPersonalApi = {
  /**
   * Obtener resumen de deudas de un usuario
   */
  getResumen: async (userId?: string) => {
    const url = userId 
      ? `/cajas/deudas-personal/resumen?user_id=${userId}`
      : '/cajas/deudas-personal/resumen';
    const response = await apiRequest(url);
    // El backend retorna { success: true, data: {...} }
    // apiRequest retorna { data: { success: true, data: {...} } }
    // Necesitamos extraer response.data.data
    return response.data?.data || response.data;
  },
  
  /**
   * Registrar un abono a una deuda
   */
  registrarAbono: async (data: RegistrarAbonoData) => {
    const response = await apiRequest('/cajas/deudas-personal/abono', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data?.data || response.data;
  },
  
  /**
   * Obtener historial de abonos de una deuda
   */
  getHistorialAbonos: async (deudaId: number) => {
    const response = await apiRequest(`/cajas/deudas-personal/${deudaId}/historial`);
    return response.data?.data || response.data;
  },
  
  /**
   * Listar deudas con filtros
   */
  getDeudas: async (params?: {
    user_id?: string;
    estado?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    per_page?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    const url = `/cajas/deudas-personal${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiRequest(url);
  },
};
