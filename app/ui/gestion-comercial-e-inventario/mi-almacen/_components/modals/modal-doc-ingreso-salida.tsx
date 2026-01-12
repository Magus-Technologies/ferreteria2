import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import DocIngresoSalida, {
  DataDocIngresoSalida,
} from '../docs/doc-ingreso-salida'
import { getNroDoc } from '~/app/_utils/get-nro-doc'
import { useAuth } from '~/lib/auth-context'
import DocIngresoSalidaTicket from '../docs/doc-ingreso-salida-ticket'
import { useState, useMemo } from 'react'
import { useConfiguracionImpresion } from '~/hooks/use-configuracion-impresion'

export default function ModalDocIngresoSalida({
  open,
  setOpen,
  data,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  data: DataDocIngresoSalida | undefined
}) {
  const nro_doc = getNroDoc({
    tipo_documento: data?.tipo_documento,
    serie: data?.serie ?? 0,
    numero: data?.numero ?? 0,
  })

  const { user } = useAuth()
  const empresa = user?.empresa

  const [esTicket, setEsTicket] = useState(true)

  // Obtener configuraciones de estilos
  const { getConfiguracionCampo } = useConfiguracionImpresion({ 
    tipoDocumento: 'ingreso_salida',
    enabled: open,
  })

  // Preparar estilos para pasar al PDF
  const estilosCampos = useMemo(() => {
    const campos = [
      'fecha', 'numero_documento', 'empresa_nombre', 'empresa_ruc', 'empresa_direccion',
      'almacen', 'usuario', 'proveedor', 'tipo_ingreso', 'observaciones',
      'tabla_codigo', 'tabla_cantidad', 'tabla_unidad', 'tabla_costo'
    ]
    
    const estilos: Record<string, { fontFamily?: string; fontSize?: number; fontWeight?: string }> = {}
    
    campos.forEach(campo => {
      const config = getConfiguracionCampo(campo)
      estilos[campo] = {
        fontFamily: config.font_family,
        fontSize: config.font_size,
        fontWeight: config.font_weight,
      }
    })
    
    return estilos
  }, [getConfiguracionCampo])

  return (
    <ModalShowDoc
      open={open}
      setOpen={setOpen}
      nro_doc={nro_doc}
      setEsTicket={setEsTicket}
      esTicket={esTicket}
      tipoDocumento='ingreso_salida'
    >
      {esTicket ? (
        <DocIngresoSalidaTicket
          data={data}
          nro_doc={nro_doc}
          empresa={empresa ?? undefined}
          estilosCampos={estilosCampos}
        />
      ) : (
        <DocIngresoSalida data={data} nro_doc={nro_doc} empresa={empresa ?? undefined} />
      )}
    </ModalShowDoc>
  )
}
