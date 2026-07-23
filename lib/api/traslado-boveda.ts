import { apiRequest } from "../api";

export interface TrasladoBoveda {
  id: string;
  apertura_cierre_caja_id: string;
  sub_caja_id: string;
  vendedor_id: string;
  supervisor_id: string;
  monto: string;
  justificacion: string | null;
  fecha_traslado: string;
  estado?: string;
  fecha_anulacion?: string | null;
  created_at: string;
  updated_at: string;
  vendedor?: {
    id: string;
    name: string;
  };
  supervisor?: {
    id: string;
    name: string;
  };
  sub_caja?: {
    id: string;
    nombre: string;
  };
  despliegue_pago_id: string;
  // Despliegue de pago de donde salió el efectivo (para saber "efectivo" vs "efectivo
  // negro", ya que el nombre del despliegue suele ser genérico "efectivo" y el que
  // distingue es el del método de pago real).
  despliegue_pago?: {
    id: string;
    name: string;
    metodo_de_pago?: {
      id: string;
      name: string;
      cuenta_bancaria: string | null;
    } | null;
  };
}

export interface RegistrarTrasladoData {
  apertura_cierre_caja_id: string;
  sub_caja_id: string;
  despliegue_pago_id: string;
  vendedor_id: string;
  supervisor_id?: string;
  supervisor_password?: string;
  monto: number;
  justificacion?: string;
}

export interface ValidarSupervisorData {
  supervisor_id: string;
  password: string;
}

export interface AnularTrasladoData {
  supervisor_id: string;
  supervisor_password: string;
}

export const trasladoBovedaApi = {
  /**
   * Registrar un nuevo traslado a bóveda
   */
  registrarTraslado: async (data: RegistrarTrasladoData) => {
    const response = await apiRequest("/cajas/traslados-boveda", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response;
  },

  /**
   * Obtener traslados activos de una caja (excluye anulados)
   */
  obtenerTrasladosPorCaja: async (aperturaCierreId: string) => {
    const response = await apiRequest(
      `/cajas/traslados-boveda/caja/${aperturaCierreId}`
    );
    return response.data;
  },

  /**
   * Obtener todos los traslados (incluyendo anulados) para historial
   */
  obtenerTodosLosTrasladosPorCaja: async (aperturaCierreId: string) => {
    const response = await apiRequest(
      `/cajas/traslados-boveda/caja/${aperturaCierreId}/todos`
    );
    return response.data;
  },

  /**
   * Obtener total trasladado de una caja
   */
  obtenerTotalTrasladado: async (aperturaCierreId: string) => {
    const response = await apiRequest(
      `/cajas/traslados-boveda/caja/${aperturaCierreId}/total`
    );
    return response.data;
  },

  /**
   * Validar supervisor
   */
  validarSupervisor: async (data: ValidarSupervisorData) => {
    const response = await apiRequest("/cajas/traslados-boveda/validar-supervisor", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /**
   * Anular un traslado
   */
  anularTraslado: async (trasladoId: string, data: AnularTrasladoData) => {
    const response = await apiRequest(`/cajas/traslados-boveda/${trasladoId}/anular`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  },
};
