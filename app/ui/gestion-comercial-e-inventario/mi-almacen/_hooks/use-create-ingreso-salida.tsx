import { useState } from "react";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { TipoDocumento } from "~/types";
import { FormCreateIngresoSalidaProps } from "../_components/modals/modal-create-ingreso-salida";
import { ingresosSalidasApi } from "~/lib/api/ingreso-salida";
import { IngresoSalidaWithRelations } from "~/lib/api/ingreso-salida";
import { useStoreProductoSeleccionado } from "../_store/store-producto-seleccionado";
import { calcularNuevoStock } from "../_components/others/stock-ingreso-salida";

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
  const { producto, setProducto } = useStoreProductoSeleccionado();

  async function crearIngresoSalidaForm(values: FormCreateIngresoSalidaProps) {
    setLoading(true);
    try {
      // Convertir TipoDocumento a 'Ingreso' o 'Salida' para el API
      const tipoDocumentoApi: "Ingreso" | "Salida" =
        tipo_documento === TipoDocumento.Ingreso ? "Ingreso" : "Salida";

      const data = {
        ...values,
        tipo_documento: tipoDocumentoApi,
        // Enviar fecha en hora local de Perú directo, sin conversión UTC.
        // toUTCBD() convertía a ISO con Z y Laravel lo guardaba como UTC literal,
        // resultando en 5 horas adelante en la columna datetime.
        fecha: values.fecha
          ? values.fecha.format('YYYY-MM-DD HH:mm:ss')
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

      // Invalidar cache de productos para forzar actualización
      // Esto asegura que el stock se actualice correctamente en la tabla
      queryClient.invalidateQueries({
        queryKey: ["productos-infinite"],
      });

      // También invalidar el cache de productos por almacén (si existe)
      queryClient.invalidateQueries({
        queryKey: ["productos-by-almacen"],
      });

      // Actualizar el producto en el store local para reflejar el nuevo stock
      if (producto && producto.id === values.producto_id) {
        const productoActualizado = { ...producto };
        const indexAlmacen = productoActualizado.producto_en_almacenes.findIndex(
          (pea) => pea.almacen_id === values.almacen_id
        );

        if (indexAlmacen !== -1) {
          const productoEnAlmacen = productoActualizado.producto_en_almacenes[indexAlmacen];
          const unidadDerivada = productoEnAlmacen.unidades_derivadas.find(
            (ud) => ud.unidad_derivada.id === values.unidad_derivada_id
          );

          if (unidadDerivada) {
            const nuevoStockFraccion = calcularNuevoStock({
              stock_fraccion: Number(productoEnAlmacen.stock_fraccion ?? 0),
              cantidad: values.cantidad,
              factor: Number(unidadDerivada.factor),
              tipo: tipo_documento,
            });

            productoActualizado.producto_en_almacenes[indexAlmacen] = {
              ...productoEnAlmacen,
              stock_fraccion: nuevoStockFraccion,
            };

            setProducto(productoActualizado);
          }
        }
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
