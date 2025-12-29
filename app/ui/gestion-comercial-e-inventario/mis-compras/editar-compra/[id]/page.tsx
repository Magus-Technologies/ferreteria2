'use server'

import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'
import HeaderCrearCompra from '../../crear-compra/_components/others/header'
import BodyComprar from '../../crear-compra/_components/others/body-comprar'
import { compraApi } from '~/lib/api/compra'
import { CompraConUnidadDerivadaNormal } from '../../crear-compra/_components/others/header'
import { prisma } from '~/db/db'

export default async function CrearCompra({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  if (!(await can(permissions.COMPRAS_UPDATE))) return <NoAutorizado />

  const { id } = await params
  if (!id) return <NoAutorizado />

  const result = await compraApi.getById(id)

  if (result.error || !result.data?.data) return <NoAutorizado />

  const compra = result.data.data

  const unidades_derivadas_names = [
    ...new Set(
      compra.productos_por_almacen?.flatMap(ppa =>
        (ppa.unidades_derivadas ?? []).map(ud => ud.unidad_derivada_inmutable?.name)
      ).filter(Boolean) ?? []
    ),
  ] as string[]

  const unidades_derivadas = await prisma.unidadDerivada.findMany({
    where: {
      name: {
        in: unidades_derivadas_names,
      },
    },
    select: {
      id: true,
      name: true,
    },
  })

  const compraFormated: CompraConUnidadDerivadaNormal = {
    ...compra,
    productos_por_almacen: (compra.productos_por_almacen ?? []).map(ppa => ({
      ...ppa,
      unidades_derivadas: (ppa.unidades_derivadas ?? []).map(ud => ({
        ...ud,
        unidad_derivada_normal: unidades_derivadas.find(
          ud2 => ud2.name === ud.unidad_derivada_inmutable?.name
        )!,
      })),
    })),
  }

  return (
    <ContenedorGeneral>
      <HeaderCrearCompra compra={compraFormated} />
      <BodyComprar compra={compraFormated} />
    </ContenedorGeneral>
  )
}
