/**
 * Tipos para Producto y todas sus relaciones
 */

import type { Almacen } from './almacen';

// Entidades básicas
export interface Marca {
  id: number;
  name: string;
}

export interface Categoria {
  id: number;
  name: string;
}

export interface UnidadMedida {
  id: number;
  name: string;
}

export interface UnidadDerivada {
  id: number;
  name: string;
  estado?: boolean;
}

export interface Ubicacion {
  id: number;
  name: string;
}

export interface Proveedor {
  id: number;
  razon_social: string;
}

// Producto Almacén - Unidades Derivadas (Precios)
export interface ProductoAlmacenUnidadDerivada {
  id: number;
  producto_almacen_id: number;
  unidad_derivada_id: number;
  factor: number;
  precio_publico: number;
  comision_publico: number;
  precio_especial: number;
  comision_especial: number;
  activador_especial: number | null;
  precio_minimo: number;
  comision_minimo: number;
  activador_minimo: number | null;
  precio_ultimo: number | null;
  comision_ultimo: number;
  activador_ultimo: number | null;
  unidad_derivada: UnidadDerivada;
}

// Compras relacionadas
export interface Compra {
  id: string;
  fecha: string;
  proveedor: Proveedor;
}

export interface UnidadDerivadaInmutableCompra {
  cantidad: number;
  factor: number;
  unidad_derivada_inmutable: UnidadDerivada;
}

export interface ProductoAlmacenCompra {
  id: number;
  costo: number;
  producto_almacen_id: number;
  compra_id: string;
  compra: Compra;
  unidades_derivadas: UnidadDerivadaInmutableCompra[];
}

// Producto en Almacén (pivot con stock y costo)
export interface ProductoAlmacen {
  id: number;
  producto_id: number;
  almacen_id: number;
  stock_fraccion: number;
  costo: number;
  ubicacion_id: number;
  created_at: string;
  updated_at: string;
  almacen: Almacen;
  ubicacion: Ubicacion;
  unidades_derivadas: ProductoAlmacenUnidadDerivada[];
  compras: ProductoAlmacenCompra[];
}

// Producto principal
export interface Producto {
  id: number;
  cod_producto: string;
  cod_barra: string | null;
  name: string;
  name_ticket: string;
  categoria_id: number;
  marca_id: number;
  unidad_medida_id: number;
  accion_tecnica: string | null;
  img: string | null;
  ficha_tecnica: string | null;
  stock_min: number;
  stock_max: number | null;
  unidades_contenidas: number;
  estado: boolean;
  permitido: boolean;
  created_at: string;
  updated_at: string;
  marca: Marca;
  categoria: Categoria;
  unidad_medida: UnidadMedida;
  producto_en_almacenes: ProductoAlmacen[];
}

// Respuesta de detalle de precios
export interface DetallePreciosResponse {
  data: {
    producto: {
      id: number;
      name: string;
      cod_producto: string;
      marca: Marca;
      categoria: Categoria;
      unidad_medida: UnidadMedida;
    };
    producto_almacen: {
      id: number;
      costo: number;
      stock_fraccion: number;
      almacen: Almacen;
      ubicacion: Ubicacion;
    };
    unidades_derivadas: Array<{
      id: number;
      producto_almacen_id: number;
      unidad_derivada_id: number;
      factor: number;
      precio_publico: number;
      comision_publico: number;
      precio_especial: number;
      comision_especial: number;
      activador_especial: number | null;
      precio_minimo: number;
      comision_minimo: number;
      activador_minimo: number | null;
      precio_ultimo: number | null;
      comision_ultimo: number;
      activador_ultimo: number | null;
      unidad_derivada: UnidadDerivada;
    }>;
  };
}

// Parámetros de consulta
export interface GetProductosParams {
  almacen_id: number;
  search?: string;
  categoria_id?: number;
  marca_id?: number;
  unidad_medida_id?: number;
  ubicacion_id?: number;
  accion_tecnica?: string;
  estado?: boolean | 0 | 1;
  cs_stock?: 'con_stock' | 'sin_stock' | 'all';
  cs_comision?: 'con_comision' | 'sin_comision' | 'all';
  per_page?: number;
  page?: number;
}

export interface GetDetallePreciosParams {
  almacen_id: number;
}
