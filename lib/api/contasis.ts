import { apiRequest } from '../api'

export interface ContasisVentaItem {
  ffechadoc: string
  ffechaven: string | null
  ccoddoc: string
  cserie: string
  cnumero: number
  ccodenti: number
  ccodruc: string
  crazsoc: string
  nbase1: number
  nigv1: number
  ntots: number
  ntc: number
  crefdoc: string | null
  crefser: string | null
  crefnum: number | null
  cglosa: string | null
}

export interface ContasisCompraItem {
  ffechadoc: string
  ccoddoc: string
  cserie: string
  cnumero: string
  ccodenti: number
  ccodruc: string
  crazsoc: string
  nbase1: number
  nigv1: number
  nina: number
  ntots: number
  ntc: number
  percepcion: number
}

interface ContasisParams {
  desde: string
  hasta: string
  almacen_id?: number
}

export const contasisApi = {
  getVentas: (params: ContasisParams) =>
    apiRequest<{ data: ContasisVentaItem[]; total: number }>(
      `/contasis/ventas?desde=${params.desde}&hasta=${params.hasta}${params.almacen_id ? `&almacen_id=${params.almacen_id}` : ''}`,
    ),

  getCompras: (params: ContasisParams) =>
    apiRequest<{ data: ContasisCompraItem[]; total: number }>(
      `/contasis/compras?desde=${params.desde}&hasta=${params.hasta}${params.almacen_id ? `&almacen_id=${params.almacen_id}` : ''}`,
    ),
}
