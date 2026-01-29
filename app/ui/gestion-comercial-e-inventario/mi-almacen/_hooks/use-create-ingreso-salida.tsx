import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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

      console.log("🔍 Respuesta del backend:", res);
      console.log("🔍 Datos recibidos:", res.data);

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

      console.log("✅ Datos EXTRAÍDOS correctamente:", ingresoSalidaData);
      console.log("✅ Tiene almacen?", ingresoSalidaData.almacen);
      console.log("✅ Tiene user?", ingresoSalidaData.user);
      console.log("✅ Tiene tipo_ingreso?", ingresoSalidaData.tipo_ingreso);
      console.log(
        "✅ Tiene productos_por_almacen?",
        ingresoSalidaData.productos_por_almacen,
      );

      // Llamar onSuccess con los datos correctos
      onSuccess?.(ingresoSalidaData);

      // Invalidar las queries de productos para que se recarguen con los datos actualizados
      // En lugar de intentar actualizar manualmente el caché, es más seguro invalidar
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "productos-by-almacen" ||
          query.queryKey[0] === "productos-search",
      });
    } catch {
      notification.error({
        message: "Error",
        description: "Error al procesar la solicitud",
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
