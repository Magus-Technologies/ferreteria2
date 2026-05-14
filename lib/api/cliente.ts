import { apiRequest, type ApiResponse } from '../api';

// ============= ENUMS =============

export enum TipoCliente {
  PERSONA = 'p',
  EMPRESA = 'e',
}

export enum TipoDireccion {
  D1 = 'D1',
  D2 = 'D2',
  D3 = 'D3',
  D4 = 'D4',
}

/**
 * Lista canónica de tipos de dirección — usar para iterar (tabs, radios,
 * payload, etc.) en lugar de hardcodear `['D1','D2','D3','D4']`. Si en el
 * futuro se agrega `D5`, basta con añadirlo al enum y a este array.
 */
export const TIPOS_DIRECCION_LIST: TipoDireccion[] = [
  TipoDireccion.D1,
  TipoDireccion.D2,
  TipoDireccion.D3,
  TipoDireccion.D4,
]

// ============= INTERFACES =============

export interface DireccionCliente {
  id: number;
  cliente_id: number;
  tipo: TipoDireccion;
  direccion: string;
  referencia: string | null;
  latitud: number | null;
  longitud: number | null;
  es_principal: boolean;
  created_at: string;
  updated_at: string;
}

export interface DireccionFormValues {
  direccion: string;
  referencia?: string | null;
  latitud?: number | null;
  longitud?: number | null;
}

/**
 * Crea una `DireccionCliente` vacía para un tipo dado — útil cuando el
 * cliente aún no tiene esa dirección registrada y el frontend necesita
 * mantener un slot para que el usuario la complete.
 */
export function crearDireccionVacia(tipo: TipoDireccion): DireccionCliente {
  return {
    id: 0,
    cliente_id: 0,
    tipo,
    direccion: '',
    referencia: null,
    latitud: null,
    longitud: null,
    es_principal: tipo === TipoDireccion.D1,
    created_at: '',
    updated_at: '',
  }
}

/**
 * Devuelve un array de DireccionCliente con un slot por cada tipo en
 * `TIPOS_DIRECCION_LIST`, llenando los slots vacíos con `crearDireccionVacia`.
 * El frontend siempre puede iterar sobre el resultado de longitud fija sin
 * preocuparse por direcciones ausentes.
 */
export function parseDireccionesFromCliente(
  cliente?: { direcciones?: DireccionCliente[] | null }
): DireccionCliente[] {
  const existentes = cliente?.direcciones ?? []
  return TIPOS_DIRECCION_LIST.map(
    (tipo) => existentes.find((d) => d.tipo === tipo) ?? crearDireccionVacia(tipo)
  )
}

/**
 * Convierte el array completo de direcciones (incluyendo las vacías) en el
 * payload que esperan los endpoints del backend. Filtra las direcciones sin
 * `direccion` (slots vacíos) — el backend las re-arma del lado de allá.
 */
export function buildDireccionesPayload(
  direcciones: DireccionCliente[]
): Array<DireccionFormValues & { tipo: TipoDireccion }> {
  return direcciones
    .filter((d) => d.direccion && d.direccion.trim().length > 0)
    .map((d) => ({
      tipo: d.tipo,
      direccion: d.direccion,
      referencia: d.referencia ?? null,
      latitud: d.latitud ?? null,
      longitud: d.longitud ?? null,
    }))
}

export interface Coordenadas {
  lat: number;
  lng: number;
}

export interface Cliente {
  id: number;
  tipo_cliente: TipoCliente;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  razon_social: string | null;
  telefono: string | null;
  profesion_id?: number | null;
  profesion?: {
    id: number;
    nombre: string;
  } | null;
  celular: string | null;
  horario_atencion: string | null;
  fecha_nacimiento: string | null;
  puntos: number;
  centimos: number;
  contacto_referencia: string | null;
  email: string | null;
  estado: boolean;
  created_at?: string;
  updated_at?: string;
  direcciones?: DireccionCliente[];
  ventas_count?: number;
}

// ============= REQUEST TYPES =============

export interface CreateClienteRequest {
  tipo_cliente: TipoCliente;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  razon_social?: string | null;
  telefono?: string | null;
  profesion_id?: number | null;
  celular?: string | null;
  horario_atencion?: string | null;
  fecha_nacimiento?: string | null;
  contacto_referencia?: string | null;
  email?: string | null;
  estado?: boolean;
}

export interface UpdateClienteRequest extends Partial<CreateClienteRequest> {}

export interface ClienteFilters {
  search?: string;
  profesion_id?: number;
  tipo_cliente?: TipoCliente;
  estado?: boolean;
  con_recomendaciones?: boolean;
  calificacion?: string;
  ordenar_por_frecuencia?: boolean;
  per_page?: number;
  page?: number;
}

// ============= RESPONSE TYPES =============

export interface ClienteResponse {
  data: Cliente;
  message?: string;
}

export interface ClientesListResponse {
  data: Cliente[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface ClienteEstadisticas {
  activos: number;
  inactivos: number;
  vip: number;
  frecuentes: number;
  problematicos: number;
  nuevos: number;
}

export interface ClienteEstadisticasResponse {
  data: ClienteEstadisticas;
}

// ============= API METHODS =============

export const clienteApi = {
  /**
   * Listar clientes con filtros
   */
  getAll: async (filters?: ClienteFilters): Promise<ApiResponse<ClientesListResponse>> => {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const url = queryString ? `/clientes?${queryString}` : '/clientes';

    return apiRequest<ClientesListResponse>(url);
  },

  /**
   * Obtener cliente por ID
   */
  getById: async (id: number): Promise<ApiResponse<ClienteResponse>> => {
    return apiRequest<ClienteResponse>(`/clientes/${id}`);
  },

  /**
   * Crear cliente
   */
  create: async (data: CreateClienteRequest): Promise<ApiResponse<ClienteResponse>> => {
    return apiRequest<ClienteResponse>('/clientes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualizar cliente
   */
  update: async (id: number, data: UpdateClienteRequest): Promise<ApiResponse<ClienteResponse>> => {
    return apiRequest<ClienteResponse>(`/clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Eliminar cliente
   */
  delete: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(`/clientes/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Verificar si un documento ya existe
   */
  checkDocumento: async (numero_documento: string, exclude_id?: number): Promise<ApiResponse<{ exists: boolean; message: string }>> => {
    return apiRequest<{ exists: boolean; message: string }>('/clientes/check-documento', {
      method: 'POST',
      body: JSON.stringify({
        numero_documento,
        exclude_id,
      }),
    });
  },

  /**
   * Obtener estadísticas de clientes
   */
  getEstadisticas: async (): Promise<ApiResponse<ClienteEstadisticasResponse>> => {
    return apiRequest<ClienteEstadisticasResponse>('/clientes/estadisticas');
  },

  // ============================================
  // MÉTODOS DE DIRECCIONES
  // ============================================

  /**
   * Listar todas las direcciones de un cliente
   */
  listarDirecciones: async (clienteId: number): Promise<ApiResponse<{ data: DireccionCliente[] }>> => {
    return apiRequest<{ data: DireccionCliente[] }>(`/clientes/${clienteId}/direcciones`);
  },

  /**
   * Crear una nueva dirección para un cliente
   */
  crearDireccion: async (clienteId: number, data: DireccionFormValues): Promise<ApiResponse<{ data: DireccionCliente; message: string }>> => {
    return apiRequest<{ data: DireccionCliente; message: string }>(`/clientes/${clienteId}/direcciones`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualizar una dirección existente
   */
  actualizarDireccion: async (direccionId: number, data: DireccionFormValues): Promise<ApiResponse<{ data: DireccionCliente; message: string }>> => {
    return apiRequest<{ data: DireccionCliente; message: string }>(`/direcciones/${direccionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Eliminar una dirección
   */
  eliminarDireccion: async (direccionId: number): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(`/direcciones/${direccionId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Marcar una dirección como principal
   */
  marcarDireccionPrincipal: async (direccionId: number): Promise<ApiResponse<{ data: DireccionCliente; message: string }>> => {
    return apiRequest<{ data: DireccionCliente; message: string }>(`/direcciones/${direccionId}/marcar-principal`, {
      method: 'POST',
    });
  },

  /**
   * Obtener ventas donde este cliente fue el recomendador
   */
  recomendaciones: async (clienteId: number): Promise<ApiResponse<{
    data: {
      total_ventas: number
      monto_total: number
      ganancia_total: number
      ventas: Array<{
        id: string
        serie: string
        numero: number
        fecha: string
        tipo_moneda: string
        total: number
        ganancia: number
        costo: number
        cliente: { id: number; numero_documento: string; nombres: string; apellidos: string; razon_social: string | null } | null
      }>
    }
  }>> => {
    return apiRequest(`/clientes/${clienteId}/recomendaciones`)
  },
};
