/**
 * Cliente API para comunicarse con el backend de Laravel
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ;

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    message: string;
    errors?: Record<string, string[]>;
  };
}

export interface Empresa {
  id: number;
  ruc: string;
  razon_social: string;
  direccion: string;
  telefono: string;
  email: string;
  serie_ingreso: number;
  serie_salida: number;
  serie_recepcion_almacen: number;
  almacen_id: number;
  marca_id: number;
  logo: string | null;
}

export interface LoginResponse {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    efectivo: number;
    empresa: Empresa | null;
    all_permissions: string[];
  };
  token: string;
}

export interface ProductoData {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  stock?: number;
  categoria_id?: number;
  marca_id?: number;
  estado?: boolean;
  [key: string]: unknown;
}

/**
 * Obtener el token de autenticación del localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

/**
 * Guardar el token de autenticación en localStorage
 */
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_token', token);
}

/**
 * Eliminar el token de autenticación del localStorage
 */
export function removeAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
}

/**
 * Realizar una petición HTTP a la API
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      // Manejar errores de validación de Laravel
      if (response.status === 422) {
        // Obtener el primer mensaje de error
        const firstError = data.errors 
          ? Object.values(data.errors as Record<string, string[]>)[0]?.[0] 
          : data.message;
        
        return {
          error: {
            message: firstError || data.message || 'Error de validación',
            errors: data.errors,
          },
        };
      }

      // Manejar error de autenticación
      if (response.status === 401) {
        removeAuthToken();
        return {
          error: {
            message: data.message || 'No autenticado',
          },
        };
      }

      return {
        error: {
          message: data.error?.message || data.message || 'Error en la petición',
        },
      };
    }

    return { data };
  } catch (error) {
    console.error('API Request Error:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Error de conexión con el servidor',
      },
    };
  }
}

/**
 * API de Autenticación
 */
export const authApi = {
  /**
   * Login con email y password
   */
  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    const response = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Si el login fue exitoso, guardar el token
    if (response.data?.token) {
      setAuthToken(response.data.token);
    }

    return response;
  },

  /**
   * Obtener el usuario actual autenticado
   */
  async getUser(): Promise<ApiResponse<LoginResponse['user']>> {
    return apiRequest<LoginResponse['user']>('/auth/user');
  },

  /**
   * Logout (cerrar sesión)
   */
  async logout(): Promise<ApiResponse> {
    const response = await apiRequest('/auth/logout', {
      method: 'POST',
    });

    // Eliminar el token del localStorage
    removeAuthToken();

    return response;
  },

  /**
   * Cerrar sesión en todos los dispositivos
   */
  async logoutAll(): Promise<ApiResponse> {
    const response = await apiRequest('/auth/logout-all', {
      method: 'POST',
    });

    // Eliminar el token del localStorage
    removeAuthToken();

    return response;
  },
};

/**
 * API de Productos
 */
export const productosApi = {
  /**
   * Obtener lista de productos
   */
  async getAll(params?: {
    search?: string;
    estado?: boolean;
    categoria_id?: number;
    marca_id?: number;
    per_page?: number;
    page?: number;
  }): Promise<ApiResponse> {
    const queryString = params
      ? '?' + new URLSearchParams(
          Object.entries(params).reduce((acc, [key, value]) => {
            if (value !== undefined) {
              acc[key] = String(value);
            }
            return acc;
          }, {} as Record<string, string>)
        ).toString()
      : '';
    return apiRequest(`/productos${queryString}`);
  },

  /**
   * Obtener un producto por ID
   */
  async getById(id: number): Promise<ApiResponse> {
    return apiRequest(`/productos/${id}`);
  },

  /**
   * Crear un nuevo producto
   */
  async create(data: ProductoData): Promise<ApiResponse> {
    return apiRequest('/productos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualizar un producto
   */
  async update(id: number, data: ProductoData): Promise<ApiResponse> {
    return apiRequest(`/productos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Desactivar un producto
   */
  async delete(id: number): Promise<ApiResponse> {
    return apiRequest(`/productos/${id}`, {
      method: 'DELETE',
    });
  },
};

// Exportar módulos nuevos de API
export { almacenesApi } from './api/almacen';
export { productosApiV2 } from './api/producto';
export { clienteApi } from './api/cliente';

// Exportar por defecto (mantener compatibilidad)
const api = {
  auth: authApi,
  productos: productosApi,
};

export default api;
