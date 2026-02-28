import { useState, useMemo } from "react";
import { Row, Col, InputNumber, message, Tag, Form } from "antd";
import { FaHashtag, FaSave, FaCheckCircle, FaInfoCircle, FaWallet, FaRegStickyNote } from "react-icons/fa";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { deudaPersonalApi, type DeudaPersonal } from "~/lib/api/deuda-personal";
import { despliegueDePagoApi } from "~/lib/api/despliegue-de-pago";
import SelectDespliegueDePago from "~/app/_components/form/selects/select-despliegue-de-pago";
import InputBase from "~/app/_components/form/inputs/input-base";
import TextareaBase from "~/app/_components/form/inputs/textarea-base";
import ButtonBase from "~/components/buttons/button-base";
import { cn } from "~/lib/utils";
import { QueryKeys } from "~/app/_lib/queryKeys";

interface FormRegistrarAbonoProps {
  deuda: DeudaPersonal;
  onSuccess: () => void;
}

export function FormRegistrarAbono({
  deuda,
  onSuccess,
}: FormRegistrarAbonoProps) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  // Cargar todos los despliegues de pago para mapear el ID del banco (parent)
  const { data: despliegues } = useQuery({
    queryKey: [QueryKeys.SUB_CAJAS, 'metodos-para-ventas'],
    queryFn: async () => {
      // Usamos el mismo endpoint que SelectDespliegueDePago para consistencia
      const response = await fetch('/api/cajas/sub-cajas/metodos-para-ventas');
      const result = await response.json();
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // Extraer el despliegue_pago_id del valor combinado (subcajaId-despliegueId)
      const combinedValue = values.despliegue_combinado_id;
      const selectedItem = despliegues?.find((d: any) => d.value === combinedValue);

      if (!selectedItem) {
        throw new Error("Método de pago no válido");
      }

      // El backend de abonos requiere el ID del MetodoDePago (Banco/Cuenta)
      // Necesitamos obtener el metodo_de_pago_id del despliegue seleccionado
      const responseDespliegue = await despliegueDePagoApi.getById(selectedItem.despliegue_pago_id);
      const despliegueData = responseDespliegue.data?.data;

      if (!despliegueData?.metodo_de_pago_id) {
        throw new Error("No se pudo determinar la cuenta bancaria de destino");
      }

      const response = await deudaPersonalApi.registrarAbono({
        deuda_personal_id: deuda.id,
        monto: values.monto,
        metodo_pago_id: Number(despliegueData.metodo_de_pago_id),
        numero_operacion: values.numero_operacion,
        observaciones: values.observaciones ? `${selectedItem.label} - ${values.observaciones}` : selectedItem.label,
      });

      if (response.success) {
        message.success("Abono registrado exitosamente");
        form.resetFields();

        queryClient.invalidateQueries({ queryKey: ["resumen-deudas"] });
        queryClient.invalidateQueries({ queryKey: ["historial-abonos"] });

        onSuccess();
      } else {
        message.error(response.message || "Error al registrar abono");
      }
    } catch (error: any) {
      console.error("Error registration abono:", error);
      message.error(error.message || "Error al registrar abono");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Información de la Deuda - Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <FaWallet size={120} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">
            <FaInfoCircle />
            <span>Resumen de Deuda Seleccionada</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-1">
              <div className="text-slate-400 text-xs font-medium">Monto Original</div>
              <div className="text-2xl font-bold flex items-baseline gap-1">
                <span className="text-sm font-normal opacity-60">S/</span>
                {Number(deuda.monto_original).toFixed(2)}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-emerald-400 text-xs font-medium">Monto Abonado</div>
              <div className="text-2xl font-bold flex items-baseline gap-1 text-emerald-400">
                <span className="text-sm font-normal opacity-60 text-white">S/</span>
                {Number(deuda.monto_abonado).toFixed(2)}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-amber-400 text-xs font-medium">Saldo Actual</div>
              <div className="text-3xl font-black flex items-baseline gap-1 text-amber-400">
                <span className="text-sm font-normal opacity-60 text-white">S/</span>
                {Number(deuda.saldo_pendiente).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          monto: deuda.saldo_pendiente,
        }}
        className="px-2"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
          <Form.Item
            label={<span className="text-slate-600 font-bold text-xs uppercase tracking-wider">Monto a Abonar</span>}
            name="monto"
            rules={[
              { required: true, message: "Ingrese el monto" },
              {
                validator: (_: unknown, value: number) => {
                  if (value <= 0) return Promise.reject("El monto debe ser mayor a 0");
                  if (value > deuda.saldo_pendiente) return Promise.reject("El monto excede el saldo pendiente");
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber
              className="w-full !rounded-xl !bg-slate-50 !border-slate-200"
              prefix={<span className="text-slate-400 font-bold mr-1">S/</span>}
              precision={2}
              min={0.01}
              max={deuda.saldo_pendiente}
              size="large"
            />
          </Form.Item>

          <SelectDespliegueDePago
            propsForm={{
              label: <span className="text-slate-600 font-bold text-xs uppercase tracking-wider">Método de Pago Detallado</span>,
              name: "despliegue_combinado_id",
              rules: [{ required: true, message: "Seleccione método de pago" }]
            }}
            placeholder="Efectivo, Yape, BCP, etc."
            size="large"
            className="!rounded-xl"
          />

          <Form.Item
            label={<span className="text-slate-600 font-bold text-xs uppercase tracking-wider">Número de Operación</span>}
            name="numero_operacion"
          >
            <InputBase
              placeholder="Ej: OP-123456"
              size="large"
              prefix={<FaHashtag className="text-slate-400" />}
              uppercase={true}
              className="!bg-slate-50"
            />
          </Form.Item>

          <Form.Item
            label={<span className="text-slate-600 font-bold text-xs uppercase tracking-wider">Observaciones</span>}
            name="observaciones"
          >
            <TextareaBase
              rows={2}
              placeholder="Detalles adicionales del abono..."
              maxLength={200}
              showCount
              uppercase={false}
              className="!bg-slate-50"
            />
          </Form.Item>
        </div>

        {/* Vista Previa del Resultado */}
        <div className="mt-8">
          <Form.Item noStyle shouldUpdate>
            {() => {
              const montoAbono = form.getFieldValue("monto") || 0;
              const nuevoSaldo = Math.max(0, deuda.saldo_pendiente - montoAbono);

              return (
                <div className={cn(
                  "rounded-2xl p-5 border-2 border-dashed transition-all duration-300 flex items-center justify-between",
                  nuevoSaldo === 0
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-blue-50 border-blue-200"
                )}>
                  <div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <FaRegStickyNote />
                      Proyección Post-Pago
                    </div>
                    <div className={cn(
                      "text-3xl font-black flex items-baseline gap-1",
                      nuevoSaldo === 0 ? "text-emerald-700" : "text-blue-700"
                    )}>
                      <span className="text-sm font-normal opacity-60">S/</span>
                      {nuevoSaldo.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 font-medium">
                      Nuevo saldo total de esta deuda
                    </div>
                  </div>

                  {nuevoSaldo === 0 && (
                    <div className="text-center animate-bounce">
                      <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                        <FaCheckCircle size={24} />
                      </div>
                      <Tag color="success" className="m-0 font-black border-none bg-emerald-100 text-emerald-700 rounded-full px-4">
                        DEUDA CANCELADA
                      </Tag>
                    </div>
                  )}
                </div>
              );
            }}
          </Form.Item>
        </div>

        <div className="flex gap-4 justify-end mt-10">
          <ButtonBase
            color="default"
            size="md"
            onClick={() => {
              form.resetFields();
              form.setFieldsValue({ monto: deuda.saldo_pendiente });
            }}
          >
            Restablecer
          </ButtonBase>
          <ButtonBase
            color="success"
            size="md"
            type="submit"
            className="flex items-center gap-3 min-w-[200px] justify-center"
            disabled={loading}
          >
            <FaSave />
            {loading ? 'Procesando...' : 'Confirmar Abono'}
          </ButtonBase>
        </div>
      </Form>
    </div>
  );
}
