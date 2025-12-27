import { apiRequest, type ApiResponse } from '../api';

// ============= INTERFACES =============

export interface Empresa {
  id: number;
  ruc: string;
  razon_social: string;
  nombre_comercial?: string;
  direccion: string;
  telefono: string;
  celular?: string;
  email: string;
  tipo_identificacion?: string;
  ubigeo_id?: number;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  regimen?: string;
  actividad_economica?: string;
  // Logo
  logo?: string;
  logo_url?: string; // URL completa generada por el backend
  // Gerente o Administrador
  gerente_nombre?: string;
  gerente_email?: string;
  gerente_celular?: string;
  // Facturación
  facturacion_nombre?: string;
  facturacion_email?: string;
  facturacion_celular?: string;
  // Contabilidad
  contabilidad_nombre?: string;
  contabilidad_email?: string;
  contabilidad_celular?: string;
  // Términos de impresión
  terminos_comprobantes_ventas?: string;
  terminos_letras_cambio?: string;
  terminos_guias_remision?: string;
  terminos_cotizaciones?: string;
  terminos_ordenes_compras?: string;
  imprimir_impuestos_boleta?: boolean;
  // Campos de configuración (NO se editan en Información Básica)
  almacen_id: number;
  marca_id: number;
  serie_ingreso: number;
  serie_salida: number;
  serie_recepcion_almacen: number;
}

export interface EmpresaResponse {
  data: Empresa;
}

export interface UpdateEmpresaResponse {
  data: Empresa;
  message: string;
}

export interface UpdateEmpresaRequest {
  ruc?: string;
  razon_social?: string;
  nombre_comercial?: string;
  direccion?: string;
  telefono?: string;
  celular?: string;
  email?: string;
  tipo_identificacion?: string;
  ubigeo_id?: number;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  regimen?: string;
  actividad_economica?: string;
  // Logo
  logo?: string;
  // Gerente o Administrador
  gerente_nombre?: string;
  gerente_email?: string;
  gerente_celular?: string;
  // Facturación
  facturacion_nombre?: string;
  facturacion_email?: string;
  facturacion_celular?: string;
  // Contabilidad
  contabilidad_nombre?: string;
  contabilidad_email?: string;
  contabilidad_celular?: string;
  // Términos de impresión
  terminos_comprobantes_ventas?: string;
  terminos_letras_cambio?: string;
  terminos_guias_remision?: string;
  terminos_cotizaciones?: string;
  terminos_ordenes_compras?: string;
  imprimir_impuestos_boleta?: boolean;
}

// ============= API METHODS =============

export const empresaApi = {
  // Obtener empresa por ID
  getById: async (id: number): Promise<ApiResponse<EmpresaResponse>> => {
    return apiRequest<EmpresaResponse>(`/empresas/${id}`);
  },

  // Actualizar empresa
  update: async (id: number, data: UpdateEmpresaRequest): Promise<ApiResponse<UpdateEmpresaResponse>> => {
    return apiRequest<UpdateEmpresaResponse>(`/empresas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Subir logo (multipart/form-data)
  uploadLogo: async (id: number, formData: FormData): Promise<ApiResponse<UpdateEmpresaResponse>> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    // Laravel requiere _method=PUT para simular PUT con FormData
    formData.append('_method', 'PUT');

    try {
      const response = await fetch(`${API_URL}/empresas/${id}`, {
        method: 'POST', // Usar POST con _method=PUT
        headers: {
          'Accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: {
            message: data.message || 'Error al subir logo',
          },
        };
      }

      return { data };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Error de conexión',
        },
      };
    }
  },
};
