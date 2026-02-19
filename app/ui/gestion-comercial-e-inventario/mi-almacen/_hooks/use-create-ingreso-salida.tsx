import { useState } from "react";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { TipoDocumento } from "@prisma/client";
import { toUTCBD } from "~/utils/fechas";
import { FormCreateIngresoSalidaProps } from "../_components/modals/modal-create-ingreso-salida";
import { ingresosSalidasApi } from "~/lib/api/ingreso-salida";
import { IngresoSalidaWithRelations } from "~/lib/api/ingreso-salida";

export default function useCreateIngresoSalida({
  tipo_documento,
  onSuccess,
}: {
  tipo_documento: TipoDocumento;
  onSuccess?: (res: IngresoSalidaWithRelations) => void;
}) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const { notification } = App.useApp();

  async function crearIngresoSalidaForm(values: FormCreateIngresoSalidaProps) {
    setLoading(true);
    try {
      // Convertir TipoDocumento a 'Ingreso' o 'Salida' para el API
      const tipoDocumentoApi: "Ingreso" | "Salida" =
        tipo_documento === TipoDocumento.Ingreso ? "Ingreso" : "Salida";

      const data = {
        ...values,
        tipo_documento: tipoDocumentoApi,
        fecha: values.fecha
          ? toUTCBD({
              date: values.fecha,
            })
          : undefined,
      };

      const res = await ingresosSalidasApi.create(data);

      if (res.error) {
        notification.error({
          message: "Error",
          description: res.error.message,
        });
        return;
      }

      notification.success({
        message: `${tipo_documento === TipoDocumento.Ingreso ? "Ingreso" : "Salida"} creado exitosamente`,
      });

      // El backend devuelve { data: { data: {...} } } debido a doble wrapping
      // Extraer los datos correctos
      const ingresoSalidaData = (res.data as any)?.data || res.data;

      if (!ingresoSalidaData) {
        throw new Error("No se recibieron datos del servidor");
      }

      // Actualizar SOLO el producto afectado en el cache de la tabla (sin refetch)
      const paiData = ingresoSalidaData.productos_por_almacen?.[0];
      const productoId = paiData?.producto_almacen?.producto?.id;
      const nuevoStock = paiData?.producto_almacen?.stock_fraccion;

      if (productoId) {
        queryClient.setQueriesData<InfiniteData<any>>(
          { predicate: (query) => query.queryKey[0] === "productos-infinite" },
          (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => ({
                ...page,
                data: page.data.map((producto: any) => {
                  if (producto.id !== productoId) return producto;
                  // Actualizar stock y tiene_ingresos directamente con dato del backend
                  return {
                    ...producto,
                    tiene_ingresos: true,
                    producto_en_almacenes: producto.producto_en_almacenes?.map(
                      (pa: any) => ({
                        ...pa,
                        stock_fraccion: nuevoStock ?? pa.stock_fraccion,
                      })
                    ),
                  };
                }),
              })),
            };
          }
        );
      }

      // Llamar onSuccess con los datos correctos (cierra modal, abre doc)
      onSuccess?.(ingresoSalidaData);
    } catch (error) {
      console.error("Error en crearIngresoSalidaForm:", error);
      notification.error({
        message: "Error",
        description: error instanceof Error ? error.message : "Error al procesar la solicitud",
      });
    } finally {
      setLoading(false);
    }
  }

  return {
    crearIngresoSalidaForm,
    loading: loading,
  };
}
