"use server";

import { Prisma } from "@prisma/client";
import { withAuth } from "~/auth/middleware-server-actions";
import { prisma } from "~/db/db";
import { convertDecimalsToNumbers } from "./utils/convert-decimals";

const includeCotizacion = {
  cliente: {
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      razon_social: true,
      direccion: true,
      telefono: true,
    },
  },
  user: {
    select: {
      id: true,
      name: true,
    },
  },
  almacen: {
    select: {
      id: true,
      name: true,
    },
  },
  productos_por_almacen: {
    include: {
      producto_almacen: {
        include: {
          producto: {
            include: {
              marca: true,
            },
          },
        },
      },
      unidades_derivadas: {
        include: {
          unidad_derivada_inmutable: true,
        },
      },
    },
  },
} satisfies Prisma.CotizacionInclude;

export type GetCotizacionesResponse = Prisma.CotizacionGetPayload<{
  include: typeof includeCotizacion;
}>;

async function getCotizacionesWA({
  where,
}: {
  where?: Prisma.CotizacionWhereInput;
}) {
  console.log('getCotizaciones - where:', JSON.stringify(where, null, 2))
  
  const cotizaciones = await prisma.cotizacion.findMany({
    where,
    include: includeCotizacion,
    orderBy: {
      fecha: "desc",
    },
  });

  console.log('getCotizaciones - found:', cotizaciones.length, 'cotizaciones')

  return { data: convertDecimalsToNumbers(cotizaciones) };
}

export const getCotizaciones = withAuth(getCotizacionesWA);
