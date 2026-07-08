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

export interface Vehiculo {
  id: number;
  name: string;
  tipo: string;
  marca_modelo: string | null;
  placa: string | null;
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

  // Marcas que tienen al menos un producto en las categorías dadas.
  async getByCategorias(
    categoriaIds: number[],
  ): Promise<ApiResponse<CatalogResponse<Marca>>> {
    const qs = categoriaIds.map((id) => `categoria_ids[]=${id}`).join("&");
    return apiRequest<CatalogResponse<Marca>>(`/marcas?${qs}`);
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
    const norm = (s: string) => s.trim().toUpperCase();

    // OPTIMIZACIÓN: antes se hacía getAll + create EN SERIE por cada ubicación
    // (hasta 2 pedidos HTTP secuenciales por ubicación → waterfall lento).
    // Ahora: 1 solo getAll por almacén para traer las existentes, y las
    // faltantes se crean EN PARALELO.
    const porAlmacen = new Map<number, Set<string>>();
    for (const u of ubicaciones) {
      if (!porAlmacen.has(u.almacen_id)) porAlmacen.set(u.almacen_id, new Set());
      porAlmacen.get(u.almacen_id)!.add(u.name.trim());
    }

    for (const [almacen_id, nombresSet] of porAlmacen) {
      // 1) Traer TODAS las ubicaciones existentes del almacén en UN pedido.
      const existentes = await this.getAll({ almacen_id });
      const mapa = new Map<string, Ubicacion>();
      for (const e of existentes.data?.data ?? []) mapa.set(norm(e.name), e);

      // 2) Separar las que ya existen de las que faltan crear.
      const faltantes: string[] = [];
      for (const nombre of nombresSet) {
        const match = mapa.get(norm(nombre));
        if (match) results.push(match);
        else faltantes.push(nombre);
      }

      // 3) Crear las faltantes EN PARALELO.
      const creadas = await Promise.all(
        faltantes.map(async (nombre) => {
          try {
            const created = await this.create({ name: nombre, almacen_id });
            const data = (created.data as any)?.data ?? created.data;
            if (data) return data as Ubicacion;
            // Falló (posible duplicado por carrera): reintentar buscando.
            const retry = await this.getAll({ almacen_id, search: nombre });
            return (
              (retry.data?.data ?? []).find((u) => norm(u.name) === norm(nombre)) ??
              null
            );
          } catch (error) {
            const msg = error instanceof Error ? error.message : "desconocido";
            errors.push(`Error en "${nombre}": ${msg}`);
            return null;
          }
        }),
      );
      for (const c of creadas) if (c) results.push(c);
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

// ============= VEHICULOS API =============

export const vehiculosApi = {
  async getAll(
    params?: GetCatalogParams & { tipo?: string },
  ): Promise<ApiResponse<CatalogResponse<Vehiculo>>> {
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
    return apiRequest<CatalogResponse<Vehiculo>>(`/vehiculos${queryString}`);
  },

  async getById(id: number): Promise<ApiResponse<Vehiculo>> {
    return apiRequest<Vehiculo>(`/vehiculos/${id}`);
  },

  async create(data: {
    name: string;
    tipo: string;
    placa?: string;
    estado?: boolean;
  }): Promise<ApiResponse<Vehiculo>> {
    return apiRequest<Vehiculo>("/vehiculos", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(
    id: number,
    data: { name?: string; tipo?: string; placa?: string; estado?: boolean },
  ): Promise<ApiResponse<Vehiculo>> {
    return apiRequest<Vehiculo>(`/vehiculos/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/vehiculos/${id}`, {
      method: "DELETE",
    });
  },
};

// ============= CARGOS API =============

export interface Cargo {
  codigo: string;
  descripcion: string;
  parent?: string | null;
  highlight?: boolean;
  staff?: boolean;
  /** Si es false, el cargo no se dibuja en el organigrama (sigue siendo asignable). */
  visible_organigrama?: boolean;
  estado?: boolean;
  users_count?: number;
  /** Rol del sistema relacionado (opcional). */
  role_id?: number | null;
  role?: { id: number; name: string; descripcion: string } | null;
}

export const cargosApi = {
  async list(): Promise<Cargo[]> {
    const response = await apiRequest<CatalogResponse<Cargo>>(`/catalogos/cargos`);
    return response.data?.data || [];
  },

  /** Listado para gestión: incluye inactivos, estado y users_count. */
  async listGestion(): Promise<Cargo[]> {
    const response = await apiRequest<CatalogResponse<Cargo>>(`/catalogos/cargos-gestion`);
    return response.data?.data || [];
  },

  /** Activar / desactivar un cargo. */
  async toggleEstado(codigo: string, estado: boolean): Promise<ApiResponse<Cargo>> {
    return apiRequest<Cargo>(`/catalogos/cargos/${encodeURIComponent(codigo)}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ estado }),
    });
  },

  async getById(codigo: string): Promise<ApiResponse<Cargo>> {
    return apiRequest<Cargo>(`/catalogos/cargos/${codigo}`);
  },

  async create(data: Cargo): Promise<ApiResponse<Cargo>> {
    return apiRequest<Cargo>("/catalogos/cargos", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(codigo: string, data: Partial<Cargo>): Promise<ApiResponse<Cargo>> {
    return apiRequest<Cargo>(`/catalogos/cargos/${codigo}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(codigo: string): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/catalogos/cargos/${codigo}`, {
      method: "DELETE",
    });
  },
};
