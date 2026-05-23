import type { EstadoVale, TipoPromocion, Modalidad } from '~/lib/api/vales-compra'

export const ESTADO_VALE_OPTIONS: { label: string; value: EstadoVale }[] = [
  { label: 'Activo', value: 'ACTIVO' },
  { label: 'Pausado', value: 'PAUSADO' },
  { label: 'Finalizado', value: 'FINALIZADO' },
]

export const TIPO_PROMOCION_OPTIONS: { label: string; value: TipoPromocion }[] = [
  { label: 'Sorteo', value: 'SORTEO' },
  { label: 'Desc. Misma Compra', value: 'DESCUENTO_MISMA_COMPRA' },
  { label: 'Desc. Próxima Compra', value: 'DESCUENTO_PROXIMA_COMPRA' },
  { label: 'Producto Gratis', value: 'PRODUCTO_GRATIS' },
  { label: '2x1', value: 'DOS_POR_UNO' },
]

export const MODALIDAD_OPTIONS: { label: string; value: Modalidad }[] = [
  { label: 'Por Cantidad', value: 'CANTIDAD_MINIMA' },
  { label: 'Por Categoría', value: 'POR_CATEGORIA' },
  { label: 'Por Productos', value: 'POR_PRODUCTOS' },
  { label: 'Mixto', value: 'MIXTO' },
]