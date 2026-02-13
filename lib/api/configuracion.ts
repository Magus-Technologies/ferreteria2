import { apiRequest, type ApiResponse } from "../api";

export const configuracionApi = {
  /**
   * Obtener el estado del envío automático a SUNAT
   */
  getAutoSendStatus: async (): Promise<ApiResponse<{ enabled: boolean }>> => {
    return apiRequest<{ enabled: boolean }>(
      "/facturacion-electronica/configuracion/auto-send-status"
    );
  },

  /**
   * Actualizar el estado del envío automático a SUNAT
   */
  updateAutoSendStatus: async (data: { enabled: boolean }): Promise<ApiResponse<{ message: string; enabled: boolean }>> => {
    return apiRequest<{ message: string; enabled: boolean }>(
      "/facturacion-electronica/configuracion/auto-send-status",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },
};
