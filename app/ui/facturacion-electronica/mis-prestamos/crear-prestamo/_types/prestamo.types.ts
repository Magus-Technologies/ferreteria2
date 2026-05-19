/**
 * Tipos para el módulo de Préstamos
 */

import { Dayjs } from "dayjs";
import { TipoOperacion, TipoEntidad, TipoMoneda, TipoInteres } from "~/lib/api/prestamo";
import type { TipoDireccion } from "~/lib/api/cliente";
import type { ClienteDireccionFormFields } from "~/lib/utils/cliente-direcciones-form";

export interface UnidadDisponiblePrestamo {
  unidad_derivada: {
    id: number;
    name: string;
  };
  factor: number;
}

export interface ProductoPrestamo {
  producto_id: number;
  producto_name: string;
  producto_codigo: string;
  marca_name: string;
  unidad_derivada_id: number;
  unidad_derivada_name: string;
  unidad_derivada_factor: number;
  unidades_disponibles?: UnidadDisponiblePrestamo[];
  cantidad: number;
  // costo: number; // Comentado: Solo se maneja por cantidad
  // subtotal: number; // Comentado: Solo se maneja por cantidad
}

export interface FormCreatePrestamo extends ClienteDireccionFormFields {
  productos: ProductoPrestamo[];

  // Número de préstamo
  numero?: string;

  // Campos principales
  fecha: Dayjs;
  fecha_vencimiento: Dayjs;
  tipo_operacion: TipoOperacion;
  tipo_entidad: TipoEntidad;
  tipo_moneda: TipoMoneda;
  tipo_de_cambio?: number;

  // Cliente o Proveedor
  cliente_id?: number;
  proveedor_id?: number;
  ruc_dni?: string;
  telefono?: string;
  direccion?: string;
  direccion_seleccionada?: TipoDireccion;
  // Campos `_cliente_direccion_*` heredados de `ClienteDireccionFormFields`.

  // Montos
  monto_total: number;

  // Intereses y garantía
  tasa_interes?: number;
  tipo_interes?: TipoInteres;
  dias_gracia?: number;
  garantia?: string;

  // Observaciones y vendedor
  observaciones?: string;
  vendedor?: string;

  // Almacén (requerido)
  almacen_id: number;
}
