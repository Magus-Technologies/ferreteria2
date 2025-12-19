/**
 * Tipos para el módulo de Cotizaciones
 * Estos tipos reemplazan los que antes venían de Prisma
 */

import { Dayjs } from "dayjs";

export type TipoMoneda = "s" | "d";
export type DescuentoTipo = "Porcentaje" | "Monto";
export type FormaDePago = string;
export type TipoDocumento = string;

export interface ProductoCotizacion {
  producto_id: number;
  producto_name: string;
  producto_codigo: string;
  marca_name: string;
  unidad_derivada_id: number;
  unidad_derivada_name: string;
  unidad_derivada_factor: number;
  cantidad: number;
  precio_venta: number;
  recargo?: number;
  subtotal: number;
  descuento_tipo?: DescuentoTipo;
  descuento?: number;
}

export interface FormCreateCotizacion {
  productos: ProductoCotizacion[];
  // Campos principales
  fecha: Dayjs;
  tipo_moneda?: TipoMoneda;
  tipo_de_cambio?: number;
  
  // Campos de vendedor y forma de pago
  vendedor?: string;
  forma_de_pago?: FormaDePago;
  vigencia_dias?: number;
  
  // Campos de cliente
  ruc_dni?: string;
  cliente_id?: number;
  telefono?: string;
  direccion?: string;
  
  // Campos de documento
  fecha_vencimiento?: Dayjs;
  tipo_documento?: TipoDocumento;
  fecha_proforma?: Dayjs;
  numero?: string;
  
  // Opciones
  reservar_stock?: boolean;
  
  // Observaciones
  observaciones?: string;
}
