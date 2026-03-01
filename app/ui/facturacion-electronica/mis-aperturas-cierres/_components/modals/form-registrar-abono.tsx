import { useState, useMemo, useEffect } from "react";
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
  abonoToEdit?: any;
}

export function FormRegistrarAbono({
  deuda,
  onSuccess,
  abonoToEdit,
}: FormRegistrarAbonoProps) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const isEditMode = !!abonoToEdit;

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

  // Pre-fill form when editing
  useEffect(() => {
    if (isEditMode && abonoToEdit) {
      // Limpiar observaciones que contengan el patrón de método de pago concatenado
      let observacionesLimpias = abonoToEdit.observaciones || '';
      
      // Si las observaciones contienen el patrón "Caja/Método/Método", extraer solo la parte después del último " - "
      if (observacionesLimpias && observacionesLimpias.includes('/')) {
        const partes = observacionesLimpias.split(' - ');
        if (partes.length > 1) {
          observacionesLimpias = partes[partes.length - 1]; // Tomar la última parte
        } else {
          // Si no hay " - ", pero tiene "/", probablemente es solo el método de pago, dejar vacío
          observacionesLimpias = '';
        }
      }
      
      // Buscar el despliegue que corresponde al metodo_pago_id del abono
      let despliegueId = null;
      if (abonoToEdit.metodo_pago_id && despliegues) {
        // Buscar en los despliegues el que tenga el mismo metodo_de_pago_id
        const despliegueCorrecto = despliegues.find((d: any) => {
          // El despliegue tiene la estructura: { value: "subcajaId-despliegueId", despliegue_pago_id: "xxx", ... }
          // Necesitamos verificar si este despliegue apunta al mismo metodo_de_pago_id
          return d.metodo_de_pago_id === abonoToEdit.metodo_pago_id;
        });
        
        if (despliegueCorrecto) {
          despliegueId = despliegueCorrecto.value;
        }
      }
      
      form.setFieldsValue({
        monto: parseFloat(String(abonoToEdit.monto)),
        despliegue_combinado_id: despliegueId,
        numero_operacion: abonoToEdit.numero_operacion,
        observaciones: observacionesLimpias,
      });
    } else if (!isEditMode) {
      form.setFieldsValue({
        monto: deuda.saldo_pendiente,
      });
    }
  }, [isEditMode, abonoToEdit, form, deuda.saldo_pendiente, despliegues]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // Extraer el despliegue_pago_id del valor combinado
      const combinedValue = values.despliegue_combinado_id;
      const selectedItem = despliegues?.find((d: any) => d.value === combinedValue);

      if (!selectedItem) {
        throw new Error("Método de pago no válido");
      }

      // Obtener el metodo_de_pago_id del despliegue seleccionado
      const responseDespliegue = await despliegueDePagoApi.getById(selectedItem.despliegue_pago_id);
      const despliegueData = responseDespliegue.data?.data;

      if (!despliegueData?.metodo_de_pago_id) {
        throw new Error("No se pudo determinar la cuenta bancaria de destino");
      }

      if (isEditMode) {
        // Modo edición - actualizar abono existente
        const response = await deudaPersonalApi.actualizarAbono(abonoToEdit.id, {
          monto: values.monto,
          metodo_pago_id: despliegueData.metodo_de_pago_id as any,
          numero_operacion: values.numero_operacion,
          observaciones: values.observaciones || null,
        }) as any;

        if (response.success) {
          message.success("Abono actualizado exitosamente");
          form.resetFields();

          queryClient.invalidateQueries({ queryKey: ["resumen-deudas"] });
          queryClient.invalidateQueries({ queryKey: ["historial-abonos"] });

          onSuccess();
        } else {
          message.error(response.message || "Error al actualizar abono");
        }
      } else {
        // Modo creación - registrar nuevo abono
        const response = await deudaPersonalApi.registrarAbono({
          deuda_personal_id: deuda.id,
          monto: values.monto,
          metodo_pago_id: despliegueData.metodo_de_pago_id as any, // Mantener como string (ULID)
          numero_operacion: values.numero_operacion,
          observaciones: values.observaciones || null,
        }) as any;

        if (response.success) {
          message.success("Abono registrado exitosamente");
          form.resetFields();

          queryClient.invalidateQueries({ queryKey: ["resumen-deudas"] });
          queryClient.invalidateQueries({ queryKey: ["historial-abonos"] });

          onSuccess();
        } else {
          message.error(response.message || "Error al registrar abono");
        }
      }
    } catch (error: any) {
      console.error("Error registration/update abono:", error);
      message.error(error.message || isEditMode ? "Error al actualizar abono" : "Error al registrar abono");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Información de la Deuda - Header */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wide mb-5">
          <FaInfoCircle />
          <span>Resumen de Deuda Seleccionada</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="text-slate-500 text-xs font-medium uppercase tracking-wide">Monto Original</div>
            <div className="text-2xl font-bold text-slate-700 flex items-baseline gap-1">
              <span className="text-sm font-normal text-slate-500">S/</span>
              {Number(deuda.monto_original).toFixed(2)}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-slate-500 text-xs font-medium uppercase tracking-wide">Monto Abonado</div>
            <div className="text-2xl font-bold text-emerald-600 flex items-baseline gap-1">
              <span className="text-sm font-normal text-slate-500">S/</span>
              {Number(deuda.monto_abonado).toFixed(2)}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-slate-500 text-xs font-medium uppercase tracking-wide">Saldo Pendiente</div>
            <div className="text-2xl font-bold text-amber-600 flex items-baseline gap-1">
              <span className="text-sm font-normal text-slate-500">S/</span>
              {Number(deuda.saldo_pendiente).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={
          isEditMode
            ? {
                monto: parseFloat(String(abonoToEdit.monto)),
                numero_operacion: abonoToEdit.numero_operacion,
                observaciones: abonoToEdit.observaciones,
              }
            : {
                monto: deuda.saldo_pendiente,
              }
        }
        className="px-2"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <Form.Item
              label={<span className="text-slate-600 font-semibold text-xs uppercase tracking-wide">{isEditMode ? 'Nuevo Monto' : 'Monto a Abonar'}</span>}
              name="monto"
              rules={[
                { required: true, message: "Ingrese el monto" },
                {
                  validator: (_: unknown, value: number) => {
                    if (value <= 0) return Promise.reject("El monto debe ser mayor a 0");
                    if (!isEditMode && value > deuda.saldo_pendiente) return Promise.reject("El monto excede el saldo pendiente");
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                className="w-full !rounded-lg !bg-white !border-slate-300"
                prefix={<span className="text-slate-500 font-semibold mr-1">S/</span>}
                precision={2}
                min={0.01}
                max={isEditMode ? undefined : deuda.saldo_pendiente}
                size="large"
              />
            </Form.Item>

            <SelectDespliegueDePago
              propsForm={{
                label: <span className="text-slate-600 font-semibold text-xs uppercase tracking-wide">Método de Pago</span>,
                name: "despliegue_combinado_id",
                rules: [{ required: true, message: "Seleccione método de pago" }]
              }}
              placeholder="Efectivo, Yape, BCP, etc."
              size="large"
              className="!rounded-lg"
            />

            <Form.Item
              label={<span className="text-slate-600 font-semibold text-xs uppercase tracking-wide">Número de Operación</span>}
              name="numero_operacion"
            >
              <InputBase
                placeholder="Ej: OP-123456"
                size="large"
                prefix={<FaHashtag className="text-slate-400" />}
                uppercase={true}
                className="!bg-white !rounded-lg"
              />
            </Form.Item>
          </div>

          <Form.Item
            label={<span className="text-slate-600 font-semibold text-xs uppercase tracking-wide">Observaciones</span>}
            name="observaciones"
          >
            <TextareaBase
              rows={2}
              placeholder="Detalles adicionales del abono..."
              maxLength={200}
              showCount
              uppercase={false}
              className="!bg-white !rounded-lg"
            />
          </Form.Item>
        </div>

        {/* Vista Previa del Resultado */}
        {!isEditMode && (
          <div className="mt-6">
            <Form.Item noStyle shouldUpdate>
              {() => {
                const montoAbono = form.getFieldValue("monto") || 0;
                const nuevoSaldo = Math.max(0, deuda.saldo_pendiente - montoAbono);

                return (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          Proyección Post-Pago
                        </div>
                        <div className="text-3xl font-semibold text-slate-700 flex items-baseline gap-1">
                          <span className="text-sm font-normal text-slate-500">S/</span>
                          {nuevoSaldo.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Nuevo saldo total de esta deuda
                        </div>
                      </div>

                      {nuevoSaldo === 0 && (
                        <Tag color="success" className="font-semibold">
                          DEUDA CANCELADA
                        </Tag>
                      )}
                    </div>
                  </div>
                );
              }}
            </Form.Item>
          </div>
        )}

        <div className="flex gap-4 justify-end mt-8">
          <ButtonBase
            color="default"
            size="md"
            onClick={() => {
              form.resetFields();
              if (!isEditMode) {
                form.setFieldsValue({ monto: deuda.saldo_pendiente });
              }
            }}
          >
            Restablecer
          </ButtonBase>
          <ButtonBase
            color={isEditMode ? "warning" : "success"}
            size="md"
            type="submit"
            className="flex items-center gap-2 min-w-[180px] justify-center"
            disabled={loading}
          >
            <FaSave />
            {loading ? 'Procesando...' : (isEditMode ? 'Guardar Cambios' : 'Confirmar Abono')}
          </ButtonBase>
        </div>
      </Form>
    </div>
  );
}
