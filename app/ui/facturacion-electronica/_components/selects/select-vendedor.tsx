'use client'

import SelectBase, { SelectBaseProps } from '~/app/_components/form/selects/select-base'
import { useQuery } from '@tanstack/react-query'
import { cajaPrincipalApi, type Usuario } from '~/lib/api/caja-principal'
import { FaUser } from 'react-icons/fa'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useState, useEffect } from 'react'

interface SelectVendedorProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
  soloVendedores?: boolean
  sinCaja?: boolean
  mostrarDocumento?: boolean
  excludeIds?: string[]
}

export default function SelectVendedor({
  placeholder = 'Selecciona un vendedor',
  variant = 'filled',
  classNameIcon = 'text-blue-600 mx-1',
  sizeIcon = 14,
  soloVendedores = true,
  sinCaja = false,
  mostrarDocumento = true,
  excludeIds = [],
  value,
  propsForm,
  ...props
}: SelectVendedorProps) {
  // Cuando se usa dentro de un Form (propsForm), el valor real puede llegar
  // programáticamente (form.setFieldValue) sin que el usuario abra el
  // desplegable — Form.Item inyecta value/onChange en SelectBase (un nivel
  // más abajo), así que el `value` desestructurado arriba nunca lo refleja
  // y el fetch lazy nunca se disparaba: el Select mostraba el ID crudo en
  // vez del nombre. Por eso acá se hace fetch eager cuando hay `propsForm`.
  const [shouldFetch, setShouldFetch] = useState(!!propsForm)

  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.VENDEDORES_DISPONIBLES, soloVendedores, sinCaja],
    queryFn: async () => {
      const response = await cajaPrincipalApi.getVendedoresDisponibles({
        solo_vendedores: soloVendedores,
        sin_caja: sinCaja,
      })
      return response.data?.data || []
    },
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Si hay un valor seleccionado, cargar los datos inmediatamente
  useEffect(() => {
    if (value && !shouldFetch) {
      setShouldFetch(true)
    }
  }, [value, shouldFetch])

  return (
    <SelectBase
      showSearch
      prefix={<FaUser className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      loading={isLoading}
      value={value}
      propsForm={propsForm}
      options={data
        ?.filter((v: Usuario) => !excludeIds.includes(v.id))
        .map((vendedor: Usuario) => ({
          value: vendedor.id,
          label: mostrarDocumento
            ? `${vendedor.name} - ${vendedor.numero_documento || vendedor.email}`
            : vendedor.name,
        }))}
      filterOption={(input, option) =>
        String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
      }
      onFocus={() => {
        if (!shouldFetch) {
          setShouldFetch(true)
        }
      }}
      onOpenChange={(open) => {
        if (open && !shouldFetch) {
          setShouldFetch(true)
        }
      }}
      {...props}
    />
  )
}
