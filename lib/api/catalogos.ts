import { apiRequest } from "../api";
import type { ApiResponse } from "~/app/_types/api";

// ============= INTERFACES =============

export interface Marca {
  id: number;
  name: string;
  estado: boolean;
}

export interface Categoria {
  id: number;
  name: string;
  estado: boolean;
}

export interface Ubicacion {
  id: number;
  name: string;
  almacen_id: number;
  estado: boolean;
}

export interface UnidadMedida {
  id: number;
  name: string;
  estado: boolean;
}

export interface UnidadDerivada {
  id: number;
  name: string;
  estado: boolean;
}

interface GetCatalogParams {
  search?: string;
  estado?: boolean;
  almacen_id?: number; // Solo para ubicaciones
}

// ============= RESPONSES =============

interface CatalogResponse<T> {
  data: T[];
}

// ============= MARCAS API =============

export const marcasApi = {
  async getAll(
    params?: GetCatalogParams,
  ): Promise<ApiResponse<CatalogResponse<Marca>>> {
    const queryString = params
      ? "?" +
        new URLSearchParams(
          Object.entries(params).reduce(
            (acc, [key, value]) => {
              if (value !== undefined) {
                acc[key] = String(value);
              }
              return acc;
            },
            {} as Record<string, string>,
          ),
        ).toString()
      : "";
    return apiRequest<CatalogResponse<Marca>>(`/marcas${queryString}`);
  },

  async getById(id: number): Promise<ApiResponse<Marca>> {
    return apiRequest<Marca>(`/marcas/${id}`);
  },

  async create(data: {
    name: string;
    estado?: boolean;
  }): Promise<ApiResponse<Marca>> {
    return apiRequest<Marca>("/marcas", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(
    id: number,
    data: { name: string; estado?: boolean },
  ): Promise<ApiResponse<Marca>> {
    return apiRequest<Marca>(`/marcas/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/marcas/${id}`, {
      method: "DELETE",
    });
  },
};

// ============= CATEGORIAS API =============

export const categoriasApi = {
  async getAll(
    params?: GetCatalogParams,
  ): Promise<ApiResponse<CatalogResponse<Categoria>>> {
    const queryString = params
      ? "?" +
        new URLSearchParams(
          Object.entries(params).reduce(
            (acc, [key, value]) => {
              if (value !== undefined) {
                acc[key] = String(value);
              }
              return acc;
            },
            {} as Record<string, string>,
          ),
        ).toString()
      : "";
    return apiRequest<CatalogResponse<Categoria>>(`/categorias${queryString}`);
  },

  async getById(id: number): Promise<ApiResponse<Categoria>> {
    return apiRequest<Categoria>(`/categorias/${id}`);
  },

  async create(data: {
    name: string;
    estado?: boolean;
  }): Promise<ApiResponse<Categoria>> {
    return apiRequest<Categoria>("/categorias", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(
    id: number,
    data: { name: string; estado?: boolean },
  ): Promise<ApiResponse<Categoria>> {
    return apiRequest<Categoria>(`/categorias/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/categorias/${id}`, {
      method: "DELETE",
    });
  },
};

// ============= UBICACIONES API =============

export const ubicacionesApi = {
  async getAll(
    params?: GetCatalogParams,
  ): Promise<ApiResponse<CatalogResponse<Ubicacion>>> {
    const queryString = params
      ? "?" +
        new URLSearchParams(
          Object.entries(params).reduce(
            (acc, [key, value]) => {
              if (value !== undefined) {
                acc[key] = String(value);
              }
              return acc;
            },
            {} as Record<string, string>,
          ),
        ).toString()
      : "";
    return apiRequest<CatalogResponse<Ubicacion>>(`/ubicaciones${queryString}`);
  },

  async getById(id: number): Promise<ApiResponse<Ubicacion>> {
    return apiRequest<Ubicacion>(`/ubicaciones/${id}`);
  },

  async create(data: {
    name: string;
    almacen_id: number;
    estado?: boolean;
  }): Promise<ApiResponse<Ubicacion>> {
    return apiRequest<Ubicacion>("/ubicaciones", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(
    id: number,
    data: { name: string; almacen_id: number; estado?: boolean },
  ): Promise<ApiResponse<Ubicacion>> {
    return apiRequest<Ubicacion>(`/ubicaciones/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/ubicaciones/${id}`, {
      method: "DELETE",
    });
  },

  /**
   * Importar múltiples ubicaciones (crear si no existen)
   */
  async importMany(
    ubicaciones: { name: string; almacen_id: number }[],
  ): Promise<ApiResponse<Ubicacion[]>> {
    const results: Ubicacion[] = [];
    const errors: string[] = [];

    for (const ubicacion of ubicaciones) {
      try {
        // Primero intentar obtener si ya existe
        const existing = await this.getAll({
          almacen_id: ubicacion.almacen_id,
          search: ubicacion.name,
        });

        if (existing.data?.data && existing.data.data.length > 0) {
          const match = existing.data.data.find(
            (u) => u.name.trim().toUpperCase() === ubicacion.name.trim().toUpperCase()
          );
          if (match) {
            results.push(match);
            continue;
          }
        }

        // Si no existe, crear
        const created = await this.create(ubicacion);
        
        if (created.data) {
          // El backend devuelve { data: Ubicacion, message: string }
          // y apiRequest lo envuelve en otro { data: ... }, causando doble wrapping
          const ubicacionData = (created.data as any).data ?? created.data;
          results.push(ubicacionData);
        } else if (created.error) {
          // Si falla por duplicado, intentar obtener de nuevo
          const retry = await this.getAll({
            almacen_id: ubicacion.almacen_id,
            search: ubicacion.name,
          });
          
          const match = retry.data?.data.find(
            (u) => u.name.trim().toUpperCase() === ubicacion.name.trim().toUpperCase()
          );
          if (match) {
            results.push(match);
          } else {
            errors.push(`No se pudo crear ni encontrar la ubicación "${ubicacion.name}"`);
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        errors.push(`Error en "${ubicacion.name}": ${errorMsg}`);
      }
    }

    return { data: results };
  },
};

// ============= UNIDADES DE MEDIDA API =============

export const unidadesMedidaApi = {
  async getAll(
    params?: GetCatalogParams,
  ): Promise<ApiResponse<CatalogResponse<UnidadMedida>>> {
    const queryString = params
      ? "?" +
        new URLSearchParams(
          Object.entries(params).reduce(
            (acc, [key, value]) => {
              if (value !== undefined) {
                acc[key] = String(value);
              }
              return acc;
            },
            {} as Record<string, string>,
          ),
        ).toString()
      : "";
    return apiRequest<CatalogResponse<UnidadMedida>>(
      `/unidades-medida${queryString}`,
    );
  },

  async getById(id: number): Promise<ApiResponse<UnidadMedida>> {
    return apiRequest<UnidadMedida>(`/unidades-medida/${id}`);
  },

  async create(data: {
    name: string;
    estado?: boolean;
  }): Promise<ApiResponse<UnidadMedida>> {
    return apiRequest<UnidadMedida>("/unidades-medida", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(
    id: number,
    data: { name: string; estado?: boolean },
  ): Promise<ApiResponse<UnidadMedida>> {
    return apiRequest<UnidadMedida>(`/unidades-medida/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/unidades-medida/${id}`, {
      method: "DELETE",
    });
  },
};

// ============= UNIDADES DERIVADAS API =============

export const unidadesDerivadas = {
  async getAll(
    params?: GetCatalogParams,
  ): Promise<ApiResponse<CatalogResponse<UnidadDerivada>>> {
    const queryString = params
      ? "?" +
        new URLSearchParams(
          Object.entries(params).reduce(
            (acc, [key, value]) => {
              if (value !== undefined) {
                acc[key] = String(value);
              }
              return acc;
            },
            {} as Record<string, string>,
          ),
        ).toString()
      : "";
    return apiRequest<CatalogResponse<UnidadDerivada>>(
      `/unidades-derivadas${queryString}`,
    );
  },

  async getById(id: number): Promise<ApiResponse<UnidadDerivada>> {
    return apiRequest<UnidadDerivada>(`/unidades-derivadas/${id}`);
  },

  async create(data: {
    name: string;
    estado?: boolean;
  }): Promise<ApiResponse<UnidadDerivada>> {
    return apiRequest<UnidadDerivada>("/unidades-derivadas", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(
    id: number,
    data: { name: string; estado?: boolean },
  ): Promise<ApiResponse<UnidadDerivada>> {
    return apiRequest<UnidadDerivada>(`/unidades-derivadas/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/unidades-derivadas/${id}`, {
      method: "DELETE",
    });
  },
};
