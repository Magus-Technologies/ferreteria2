import { Compra, TipoDocumento } from '@prisma/client'
import { TiposDocumentos } from '~/lib/docs'

export function getNroDoc({
  tipo_documento,
  serie,
  numero,
}: {
  tipo_documento?: TipoDocumento
  serie: number
  numero: number
}) {
  return tipo_documento
    ? `${TiposDocumentos[tipo_documento].cod_serie}${serie
        .toString()
        .padStart(2, '0')}-${numero.toString().padStart(4, '0')}`
    : ''
}

export function getNroDocCompra({
  compra,
}: {
  compra?: { serie: Compra['serie']; numero: Compra['numero'] }
}) {
  return compra
    ? `${compra.serie}-${(compra.numero ?? '-').toString().padStart(4, '0')}`
    : ''
}
