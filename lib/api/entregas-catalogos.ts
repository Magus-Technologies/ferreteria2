import { apiRequest } from "../api";
import type { ApiResponse } from "~/app/_types/api";

// ============= INTERFACES =============

export interface TipoEntregaCatalogo {
  id: number;
  codigo: "rt" | "de" | "pa";
  nombre: string;
  icono: string;
  color: string;
  orden: number;
}

export interface TipoDespachoCatalogo {
  id: number;
  codigo: "in" | "pr";
  nombre: string;
}

export interface EstadoEntregaCatalogo {
  id: number;
  codigo: "pe" | "ec" | "en" | "ca";
  nombre: string;
  color: string;
  es_final: boolean;
}

export interface QuienEntregaCatalogo {
  id: number;
  codigo: "almacen" | "vendedor" | "chofer";
  nombre: string;
}

// ============= API FUNCTIONS =============

export async function getTiposEntrega(): Promise<
  ApiResponse<TipoEntregaCatalogo[]>
> {
  return apiRequest<TipoEntregaCatalogo[]>(
    "/entregas/catalogos/tipos-entrega",
    { method: "GET" }
  );
}

export async function getTiposDespacho(): Promise<
  ApiResponse<TipoDespachoCatalogo[]>
> {
  return apiRequest<TipoDespachoCatalogo[]>(
    "/entregas/catalogos/tipos-despacho",
    { method: "GET" }
  );
}

export async function getEstadosEntrega(): Promise<
  ApiResponse<EstadoEntregaCatalogo[]>
> {
  return apiRequest<EstadoEntregaCatalogo[]>(
    "/entregas/catalogos/estados-entrega",
    { method: "GET" }
  );
}

export async function getQuienesEntrega(): Promise<
  ApiResponse<QuienEntregaCatalogo[]>
> {
  return apiRequest<QuienEntregaCatalogo[]>(
    "/entregas/catalogos/quien-entrega",
    { method: "GET" }
  );
}
