'use server'

import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'
import HeaderCrearCompra from '../../crear-compra/_components/others/header'
import BodyComprar from '../../crear-compra/_components/others/body-comprar'
import { prisma } from '~/db/db'
import { includeCompra } from '~/app/_actions/lib/lib-compra'

export default async function CrearCompra({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  if (!(await can(permissions.COMPRAS_UPDATE))) return <NoAutorizado />

  const { id } = await params
  if (!id) return <NoAutorizado />

  const compra = await prisma.compra.findUnique({
    where: {
      id,
    },
    include: includeCompra,
  })

  const unidades_derivadas_names = [
    ...new Set(
      compra?.productos_por_almacen.flatMap(ppa =>
        ppa.unidades_derivadas.map(ud => ud.unidad_derivada_inmutable.name)
      )
    ),
  ]

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

  if (!compra) return <NoAutorizado />

  const compraConUnidadesDerivadas = {
    ...compra,
    productos_por_almacen: compra.productos_por_almacen.map(ppa => ({
      ...ppa,
      unidades_derivadas: ppa.unidades_derivadas.map(ud => ({
        ...ud,
        unidad_derivada_normal: unidades_derivadas.find(
          ud2 => ud2.name === ud.unidad_derivada_inmutable.name
        )!,
      })),
    })),
  }

  const compraFormated = JSON.parse(
    JSON.stringify(compraConUnidadesDerivadas)
  ) as typeof compraConUnidadesDerivadas

  return (
    <ContenedorGeneral>
      <HeaderCrearCompra compra={compraFormated} />
      <BodyComprar compra={compraFormated} />
    </ContenedorGeneral>
  )
}
