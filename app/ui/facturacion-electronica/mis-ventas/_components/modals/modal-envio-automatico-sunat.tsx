"use client";

import { Modal, Progress, message } from "antd";
import { useState } from "react";
import { facturacionElectronicaApi } from "~/lib/api/facturacion-electronica";
import dayjs from "dayjs";

interface ModalEnvioAutomaticoSunatProps {
  open: boolean;
  onClose: () => void;
  ventas: any[];
  onSuccess: () => void;
}

interface EnvioResult {
  ventaId: string;
  serie: string;
  numero: number;
  success: boolean;
  message: string;
}

export default function ModalEnvioAutomaticoSunat({
  open,
  onClose,
  ventas,
  onSuccess,
}: ModalEnvioAutomaticoSunatProps) {
  const [enviando, setEnviando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [resultados, setResultados] = useState<EnvioResult[]>([]);
  const [ventaActual, setVentaActual] = useState<string>("");

  // Filtrar ventas que cumplen los requisitos
  const ventasElegibles = ventas.filter((venta) => {
    const comprobante = venta.comprobante_electronico;
    if (!comprobante) return false;

    // Debe tener XML pero no CDR (no enviado aún)
    const tieneXml = comprobante.tiene_xml || false;
    const tieneCdr = comprobante.tiene_cdr || false;
    const estadoSunat = comprobante.estado_sunat;
    const yaEnviado = estadoSunat === "ACEPTADO" || estadoSunat === "ACEPTADO_CON_OBSERVACIONES";

    if (!tieneXml || tieneCdr || yaEnviado) return false;

    // Validar días según tipo de comprobante
    // Factura (01): máximo 3 días calendario
    // Boleta (03): máximo 7 días calendario
    const tipoComprobante = venta.tipo_documento;
    const fechaEmision = dayjs(comprobante.fecha_emision);
    const hoy = dayjs();
    const diasTranscurridos = hoy.diff(fechaEmision, "day");

    if (tipoComprobante === "01") {
      // Factura: 3 días máximo
      return diasTranscurridos <= 3;
    } else if (tipoComprobante === "03") {
      // Boleta: 7 días máximo
      return diasTranscurridos <= 7;
    }

    return false;
  });

  const handleEnviar = async () => {
    if (ventasElegibles.length === 0) {
      message.warning("No hay comprobantes elegibles para enviar");
      return;
    }

    setEnviando(true);
    setProgreso(0);
    setResultados([]);

    const resultadosTemp: EnvioResult[] = [];

    for (let i = 0; i < ventasElegibles.length; i++) {
      const venta = ventasElegibles[i];
      const comprobante = venta.comprobante_electronico;
      
      setVentaActual(`${comprobante.serie}-${comprobante.correlativo}`);

      try {
        const result = await facturacionElectronicaApi.enviarFacturaSunat(venta.id);

        if (result.error) {
          resultadosTemp.push({
            ventaId: venta.id,
            serie: comprobante.serie,
            numero: comprobante.correlativo,
            success: false,
            message: result.error.message || "Error desconocido",
          });
        } else {
          // El backend devuelve { success: true, message: string, data: { modo, codigo_sunat, mensaje_sunat } }
          const mensajeSunat = (result.data as any)?.mensaje_sunat || (result as any)?.message || "Enviado correctamente";
          resultadosTemp.push({
            ventaId: venta.id,
            serie: comprobante.serie,
            numero: comprobante.correlativo,
            success: true,
            message: mensajeSunat,
          });
        }
      } catch (error: any) {
        resultadosTemp.push({
          ventaId: venta.id,
          serie: comprobante.serie,
          numero: comprobante.correlativo,
          success: false,
          message: error?.message || "Error al enviar",
        });
      }

      setResultados([...resultadosTemp]);
      setProgreso(((i + 1) / ventasElegibles.length) * 100);

      // Delay de 2 segundos entre cada envío para no saturar SUNAT
      if (i < ventasElegibles.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    setEnviando(false);
    setVentaActual("");
    
    const exitosos = resultadosTemp.filter((r) => r.success).length;
    const fallidos = resultadosTemp.filter((r) => !r.success).length;

    message.success(`Proceso completado: ${exitosos} exitosos, ${fallidos} fallidos`);
    onSuccess();
  };

  const handleClose = () => {
    if (!enviando) {
      onClose();
      setProgreso(0);
      setResultados([]);
      setVentaActual("");
    }
  };

  return (
    <Modal
      title="Envío Automático a SUNAT"
      open={open}
      onCancel={handleClose}
      onOk={handleEnviar}
      okText={enviando ? "Enviando..." : "Iniciar Envío"}
      cancelText="Cerrar"
      okButtonProps={{ disabled: enviando || ventasElegibles.length === 0 }}
      cancelButtonProps={{ disabled: enviando }}
      width={600}
      maskClosable={false}
    >
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <p className="text-sm text-blue-800">
            <strong>Comprobantes elegibles:</strong> {ventasElegibles.length}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Solo se enviarán comprobantes con XML generado, sin CDR, y dentro del plazo SUNAT:
          </p>
          <ul className="text-xs text-blue-600 mt-1 ml-4 list-disc">
            <li>Facturas (01): máximo 3 días calendario desde emisión</li>
            <li>Boletas (03): máximo 7 días calendario desde emisión</li>
          </ul>
        </div>

        {enviando && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Enviando: {ventaActual}
            </p>
            <Progress percent={Math.round(progreso)} status="active" />
          </div>
        )}

        {resultados.length > 0 && (
          <div className="max-h-60 overflow-y-auto space-y-2">
            <p className="text-sm font-medium mb-2">Resultados:</p>
            {resultados.map((resultado, index) => (
              <div
                key={index}
                className={`p-2 rounded text-sm ${
                  resultado.success
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <p className="font-medium">
                  {resultado.serie}-{resultado.numero}:{" "}
                  <span className={resultado.success ? "text-green-700" : "text-red-700"}>
                    {resultado.success ? "✓ Exitoso" : "✗ Fallido"}
                  </span>
                </p>
                <p className="text-xs mt-1 opacity-80">{resultado.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
