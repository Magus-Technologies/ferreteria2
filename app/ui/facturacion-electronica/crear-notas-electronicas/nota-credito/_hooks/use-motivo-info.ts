import { useQuery } from "@tanstack/react-query";
import { facturacionElectronicaApi } from "~/lib/api/facturacion-electronica";
import { useMemo } from "react";

// Mapeo de ayudas contextuales por código de motivo
const AYUDAS_MOTIVOS: Record<string, { emoji: string; texto: string; requiereDescripcion: boolean }> = {
  "01": {
    emoji: "⚠️",
    texto: "ANULACIÓN TOTAL - La operación nunca debió realizarse. Cancela TODO el comprobante.",
    requiereDescripcion: false,
  },
  "02": {
    emoji: "⚠️",
    texto: "ANULACIÓN TOTAL - RUC incorrecto. Cancela TODO y emite nuevo comprobante.",
    requiereDescripcion: false,
  },
  "03": {
    emoji: "📝",
    texto: "CORRECCIÓN - Solo texto/descripción. NO afecta montos.",
    requiereDescripcion: false,
  },
  "04": {
    emoji: "💰",
    texto: "DESCUENTO GLOBAL - Aplicado al total del comprobante.",
    requiereDescripcion: false,
  },
  "05": {
    emoji: "💰",
    texto: "DESCUENTO POR ÍTEM - Aplicado a productos específicos.",
    requiereDescripcion: false,
  },
  "06": {
    emoji: "⚠️",
    texto: "DEVOLUCIÓN TOTAL - Cliente devuelve TODOS los productos.",
    requiereDescripcion: false,
  },
  "07": {
    emoji: "📦",
    texto: "DEVOLUCIÓN PARCIAL - Cliente devuelve ALGUNOS productos.",
    requiereDescripcion: false,
  },
  "08": {
    emoji: "🎁",
    texto: "BONIFICACIÓN - Productos entregados sin costo.",
    requiereDescripcion: false,
  },
  "09": {
    emoji: "💵",
    texto: "AJUSTE DE VALOR - Corrección de precios o valores.",
    requiereDescripcion: false,
  },
  "10": {
    emoji: "📋",
    texto: "OTROS CONCEPTOS - Casos especiales. REQUIERE descripción detallada explicando el motivo específico (mínimo 20 caracteres).",
    requiereDescripcion: true,
  },
};

export function useMotivoInfo(motivoNotaId: number | undefined) {
  // Cargar motivos de crédito
  const { data: motivos } = useQuery({
    queryKey: ["motivos-nota", "credito"],
    queryFn: async () => {
      const response = await facturacionElectronicaApi.getMotivosCredito();
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
