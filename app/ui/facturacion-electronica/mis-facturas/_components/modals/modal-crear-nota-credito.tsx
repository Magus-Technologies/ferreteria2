"use client";

import { Modal, Form, message } from "antd";
import { useState } from "react";
import FormBase from "~/components/form/form-base";
import ButtonBase from "~/components/buttons/button-base";
import DatePickerBase from "~/app/_components/form/fechas/date-picker-base";
import SelectMotivoNota from "~/app/_components/form/selects/select-motivo-nota";
import TextAreaBase from "~/app/_components/form/inputs/textarea-base";
import { FaCalendar, FaSave } from "react-icons/fa";
import dayjs, { Dayjs } from "dayjs";
import { facturacionElectronicaApi } from "~/lib/api/facturacion-electronica";
import TableDetallesNotaCredito from "~/app/ui/facturacion-electronica/mis-facturas/_components/tables/table-detalles-nota-credito";

interface ModalCrearNotaCreditoProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  factura: any;
}

interface FormValues {
  motivo_nota_id: number;
  fecha_emision: Dayjs;
  observaciones?: string;
}

export default function ModalCrearNotaCredito({
  open,
  setOpen,
  factura,
}: ModalCrearNotaCreditoProps) {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const [detalles, setDetalles] = useState<any[]>([]);

  const handleFinish = async (values: FormValues) => {
    if (detalles.length === 0) {
      message.error("Debe agregar al menos un detalle");
      return;
    }

    setLoading(true);
    try {
      const response = await facturacionElectronicaApi.crearNotaCredito({
        comprobante_afectado_id: factura.comprobante_electronico_id,
        motivo_nota_id: values.motivo_nota_id,
        fecha_emision: values.fecha_emision.format("YYYY-MM-DD"),
        tipo_moneda: factura.tipo_moneda,
        observaciones: values.observaciones,
        detalles: detalles.map((d) => ({
          producto_id: d.producto_id,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
        })),
      });

      if (response.error) {
        message.error(response.error.message);
        return;
      }

      message.success("Nota de crédito creada exitosamente");
      form.resetFields();
      setDetalles([]);
      setOpen(false);
    } catch (error: any) {
      message.error(error.message || "Error al crear nota de crédito");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Crear Nota de Crédito"
      open={open}
      onCancel={() => setOpen(false)}
      width={900}
      footer={null}
    >
      <FormBase
        form={form}
        name="crear-nota-credito"
        onFinish={handleFinish}
        initialValues={{
          fecha_emision: dayjs(),
        }}
      >
        <div className="mb-4 p-3 bg-blue-50 rounded">
          <p className="text-sm">
            <strong>Factura:</strong> {factura?.serie}-{factura?.numero}
          </p>
          <p className="text-sm">
            <strong>Cliente:</strong>{" "}
            {factura?.comprobante_electronico?.cliente?.nombre_completo}
          </p>
          <p className="text-sm">
            <strong>Total:</strong> S/ {Number(factura?.total || 0).toFixed(2)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <SelectMotivoNota
            tipo="credito"
            propsForm={{
              name: "motivo_nota_id",
              label: "Motivo",
              rules: [{ required: true, message: "Seleccione un motivo" }],
            }}
          />

          <DatePickerBase
            propsForm={{
              name: "fecha_emision",
              label: "Fecha Emisión",
              rules: [{ required: true, message: "Seleccione la fecha" }],
            }}
            prefix={<FaCalendar className="text-blue-600" />}
          />
        </div>

        <TextAreaBase
          propsForm={{
            name: "observaciones",
            label: "Observaciones",
          }}
          placeholder="Observaciones adicionales..."
          rows={3}
        />

        <div className="mt-4">
          <h4 className="font-semibold mb-2">Detalles</h4>
          <TableDetallesNotaCredito
            factura={factura}
            detalles={detalles}
            setDetalles={setDetalles}
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <ButtonBase
            type="button"
            color="default"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </ButtonBase>
          <ButtonBase
            type="submit"
            color="success"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <FaSave />
            {loading ? "Creando..." : "Crear Nota de Crédito"}
          </ButtonBase>
        </div>
      </FormBase>
    </Modal>
  );
}
