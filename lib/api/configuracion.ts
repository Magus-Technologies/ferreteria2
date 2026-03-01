import { apiRequest, type ApiResponse } from "../api";

export interface AutoSendConfig {
  enabled: boolean;
  after_days: number;
}

export interface AutoSendStatus {
  factura: AutoSendConfig;
  boleta: AutoSendConfig;
}

export const configuracionApi = {
  /**
   * Obtener el estado del envío automático a SUNAT
   */
  getAutoSendStatus: async (): Promise<ApiResponse<AutoSendStatus>> => {
    return apiRequest<AutoSendStatus>(
      "/facturacion-electronica/configuracion/auto-send-status"
    );
  },

  /**
   * Actualizar el estado del envío automático a SUNAT
   */
  updateAutoSendStatus: async (data: {
    type: 'factura' | 'boleta' | 'guia' | 'all';
    config?: AutoSendConfig;
    configs?: AutoSendStatus;
  }): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(
      "/facturacion-electronica/configuracion/auto-send-status",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },
};
