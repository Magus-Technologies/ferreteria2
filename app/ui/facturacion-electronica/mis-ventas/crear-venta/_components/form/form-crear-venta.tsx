import { FaCalendar } from "react-icons/fa6";
import DatePickerBase from "~/app/_components/form/fechas/date-picker-base";
import LabelBase from "~/components/form/label-base";
import SelectTipoMoneda from "~/app/_components/form/selects/select-tipo-moneda";
import { Form, FormInstance } from "antd";
import InputNumberBase from "~/app/_components/form/inputs/input-number-base";
import SelectTipoDocumento from "~/app/_components/form/selects/select-tipo-documento";
import { VentaConUnidadDerivadaNormal } from "../others/header-crear-venta";
import FormFormaDePagoVenta from "./form-forma-de-pago-venta";
import SelectClientes from "~/app/_components/form/selects/select-clientes";
import InputBase from "~/app/_components/form/inputs/input-base";
import { BsGeoAltFill } from "react-icons/bs";
import { useEffect } from "react";
import RadioDireccionCliente from "~/app/_components/form/radio-direccion-cliente";

export default function FormCrearVenta({
  form,
  venta,
}: {
  form: FormInstance;
  venta?: VentaConUnidadDerivadaNormal;
}) {
  // Inicializar D1 al montar el componente
  useEffect(() => {
    if (!form.getFieldValue("direccion_seleccionada")) {
      form.setFieldValue("direccion_seleccionada", "D1");
    }
  }, [form]);

  return (
    <div className="flex flex-col gap-4">
      {/* Campos ocultos para que Form.useWatch funcione */}
      <Form.Item name="direccion_seleccionada" hidden>
        <input type="hidden" />
      </Form.Item>
      <Form.Item name="_cliente_direccion_1" hidden>
        <input type="hidden" />
      </Form.Item>
      <Form.Item name="_cliente_direccion_2" hidden>
        <input type="hidden" />
      </Form.Item>
      <Form.Item name="_cliente_direccion_3" hidden>
        <input type="hidden" />
      </Form.Item>

      {/* Primera fila: Fecha, Tipo Moneda, Tipo de Cambio */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 lg:gap-6">
        <LabelBase
          label="Fecha:"
          classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
          className="w-full sm:w-auto"
        >
          <DatePickerBase
            propsForm={{
              name: "fecha",
              rules: [
                {
                  required: true,
                  message: "Por favor, ingresa la fecha",
                },
              ],
            }}
            placeholder="Fecha"
            className="w-full sm:!w-[160px] sm:!min-w-[160px] sm:!max-w-[160px]"
            prefix={<FaCalendar size={15} className="text-rose-700 mx-1" />}
          />
        </LabelBase>
        <LabelBase
          label="Tipo Moneda:"
          classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
          className="w-full sm:w-auto"
        >
          <SelectTipoMoneda
            classNameIcon="text-rose-700 mx-1"
            className="w-full sm:!w-[120px] sm:!min-w-[120px] sm:!max-w-[120px]"
            propsForm={{
              name: "tipo_moneda",
              rules: [
                {
                  required: true,
                  message: "Por favor, selecciona el tipo de moneda",
                },
              ],
            }}
            onChangeTipoDeCambio={(value) =>
              form.setFieldValue("tipo_de_cambio", value)
            }
          />
        </LabelBase>
        <LabelBase
          label="Tipo de Cambio:"
          classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
          className="w-full sm:w-auto"
        >
          <InputNumberBase
            propsForm={{
              name: "tipo_de_cambio",
              rules: [
                {
                  required: true,
                  message: "Por favor, ingresa el tipo de cambio",
                },
              ],
            }}
            prefix={<span className="text-rose-700 font-bold">S/. </span>}
            precision={4}
            min={1}
            className="w-full sm:!w-[100px] sm:!min-w-[100px] sm:!max-w-[100px]"
          />
        </LabelBase>
        <div className="flex items-center ml-auto">
          <RadioDireccionCliente form={form} />
        </div>
      </div>

      {/* Segunda fila: Tipo Documento, Cliente, Recomendado por */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 lg:gap-6">
        <LabelBase
          label="Tipo Documento:"
          classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
          className="w-full sm:w-auto"
        >
          <SelectTipoDocumento
            propsForm={{
              name: "tipo_documento",
              hasFeedback: false,
              className:
                "w-full sm:!min-w-[150px] sm:!w-[150px] sm:!max-w-[150px]",
              rules: [
                {
                  required: true,
                  message: "Selecciona el tipo de documento",
                },
              ],
            }}
            className="w-full"
            classNameIcon="text-rose-700 mx-1"
          />
        </LabelBase>
        <LabelBase
          label="Cliente:"
          classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
          className="w-full sm:w-auto"
        >
          <SelectClientes
            form={form}
            propsForm={{
              name: "cliente_id",
              hasFeedback: false,
              className:
                "w-full sm:!min-w-[150px] sm:!w-[150px] sm:!max-w-[150px]",
              rules: [
                {
                  required: true,
                  message: "Selecciona el cliente",
                },
              ],
            }}
            className="w-full"
            classNameIcon="text-rose-700 mx-1"
          />
        </LabelBase>
        <LabelBase
          label="Recomendado por:"
          classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
          className="w-full sm:w-auto"
        >
          <SelectClientes
            propsForm={{
              name: "recomendado_por_id",
              hasFeedback: false,
              className:
                "w-full sm:!min-w-[150px] sm:!w-[150px] sm:!max-w-[150px]",
            }}
            className="w-full"
            classNameIcon="text-cyan-600 mx-1"
          />
        </LabelBase>
           <LabelBase
          label="Dirección:"
          classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
          className="w-full sm:w-auto sm:flex-1"
        >
          <div className="flex gap-2" style={{ alignItems: "center" }}>
            <InputBase
              prefix={<BsGeoAltFill className="text-cyan-600 mx-1" />}
              propsForm={{
                name: "direccion",
              }}
              placeholder="Dirección del cliente"
              className="flex-1"
            />
            {/* <RadioDireccionCliente form={form} /> */}
          </div>
        </LabelBase>
      </div>

      {/* Tercera fila: Dirección */}
      {/* <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 lg:gap-6">
     
      </div> */}

      {/* Cuarta fila: Forma de Pago */}
      <div className="flex gap-3 sm:gap-4 lg:gap-6">
        <FormFormaDePagoVenta form={form} />
      </div>
    </div>
  );
}
