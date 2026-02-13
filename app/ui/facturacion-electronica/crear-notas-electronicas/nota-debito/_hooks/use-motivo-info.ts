import { useQuery } from "@tanstack/react-query";
import { facturacionElectronicaApi } from "~/lib/api/facturacion-electronica";
import { useMemo } from "react";

// Mapeo de ayudas contextuales por código de motivo
const AYUDAS_MOTIVOS: Record<string, { emoji: string; texto: string; requiereDescripcion: boolean }> = {
  "01": {
    emoji: "⏰",
    texto: "INTERESES POR MORA - Cliente pagó fuera de plazo. Agregue el interés como un ítem en la tabla.",
    requiereDescripcion: false,
  },
  "02": {
    emoji: "💵",
    texto: "AUMENTO EN EL VALOR - Error en precio, monto menor al real. Modifique los productos para reflejar el aumento.",
    requiereDescripcion: false,
  },
  "03": {
    emoji: "⚖️",
    texto: "PENALIDADES / OTROS CONCEPTOS - Multas o recargos contractuales. Requiere descripción detallada (mínimo 20 caracteres).",
    requiereDescripcion: true,
  },
  "10": {
    emoji: "📋",
    texto: "OTROS CONCEPTOS - Casos especiales. REQUIERE descripción detallada explicando el motivo específico (mínimo 20 caracteres).",
    requiereDescripcion: true,
  },
};

export function useMotivoInfo(motivoNotaId: number | undefined) {
  // Cargar motivos de débito
  const { data: motivos } = useQuery({
    queryKey: ["motivos-nota", "debito"],
    queryFn: async () => {
      const response = await facturacionElectronicaApi.getMotivosDebito();
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data?.data || [];
    },
    staleTime: 1000 * 60 * 60, // 1 hora
  });

  // Obtener información del motivo seleccionado
  const motivoInfo = useMemo(() => {
    if (!motivoNotaId || !motivos) return null;
    
    const motivoSeleccionado = motivos.find((m: any) => m.id === motivoNotaId);
    if (!motivoSeleccionado) return null;
    
    const codigoSunat = motivoSeleccionado.codigo_sunat;
    const ayuda = AYUDAS_MOTIVOS[codigoSunat];
    
    if (!ayuda) return null;
    
    return {
      ...ayuda,
      codigoSunat, // Agregar el código SUNAT al objeto retornado
    };
  }, [motivoNotaId, motivos]);

  return motivoInfo;
}
