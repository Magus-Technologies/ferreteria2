/**
 * Tipos para el módulo de Cotizaciones
 * Estos tipos reemplazan los que antes venían de Prisma
 */

import { Dayjs } from "dayjs";
import type { TipoDireccion } from "~/lib/api/cliente";
import type { ClienteDireccionFormFields } from "~/lib/utils/cliente-direcciones-form";

export type TipoMoneda = "s" | "d";
export type DescuentoTipo = "Porcentaje" | "Monto";
export type FormaDePago = string;
export type TipoDocumento = string;
export type TipoPrecio = "publico" | "especial" | "minimo" | "ultimo";

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
  tipo_precio?: TipoPrecio;
  comision?: number;
}

export interface FormCreateCotizacion extends ClienteDireccionFormFields {
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
  cliente_nombre?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  direccion_seleccionada?: TipoDireccion;
  // Campos `_cliente_direccion_*` heredados de `ClienteDireccionFormFields`.
  
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
