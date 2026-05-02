import { apiRequest, type ApiResponse } from '../api';

// ============= INTERFACES =============

export interface ContactoEmpresa {
  id?: number;
  empresa_id?: number;
  cargo: 'gerente' | 'facturacion' | 'contabilidad';
  nombre?: string;
  email?: string;
  celular?: string;
}

export interface DireccionEmpresa {
  id?: number;
  empresa_id?: number;
  es_principal?: boolean;
  alias?: string;
  direccion: string;
  ubigeo_id?: number;
  departamento?: string;
  provincia?: string;
  distrito?: string;
}

export interface TerminoEmpresa {
  id?: number;
  empresa_id?: number;
  tipo: 'comprobantes_ventas' | 'letras_cambio' | 'guias_remision' | 'cotizaciones' | 'ordenes_compras';
  contenido?: string;
}

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
  logo: string | null;
  logo_url?: string;
  imprimir_impuestos_boleta?: boolean;
  // SUNAT credentials
  sol_user?: string;
  sol_pass?: string;
  sunat_client_id?: string;
  sunat_secret_client?: string;
  sunat_modo?: 'beta' | 'produccion';
  // Campos de configuración
  almacen_id: number;
  marca_id: number;
  serie_ingreso: number;
  serie_salida: number;
  serie_recepcion_almacen: number;
  // Relaciones
  contactos?: ContactoEmpresa[];
  terminos?: TerminoEmpresa[];
  direcciones?: DireccionEmpresa[];
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
  logo?: string;
  imprimir_impuestos_boleta?: boolean;
  // SUNAT credentials
  sol_user?: string;
  sol_pass?: string;
  sunat_client_id?: string;
  sunat_secret_client?: string;
  sunat_modo?: 'beta' | 'produccion';
  // Contactos y términos (nested)
  contactos?: ContactoEmpresa[];
  terminos?: TerminoEmpresa[];
  direcciones?: DireccionEmpresa[];
}

// ============= API METHODS =============

export const empresaApi = {
  getById: async (id: number): Promise<ApiResponse<EmpresaResponse>> => {
    return apiRequest<EmpresaResponse>(`/empresas/${id}`);
  },

  update: async (id: number, data: UpdateEmpresaRequest): Promise<ApiResponse<UpdateEmpresaResponse>> => {
    return apiRequest<UpdateEmpresaResponse>(`/empresas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  uploadLogo: async (id: number, formData: FormData): Promise<ApiResponse<UpdateEmpresaResponse>> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    formData.append('_method', 'PUT');

    try {
      const response = await fetch(`${API_URL}/empresas/${id}`, {
        method: 'POST',
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
