"use client";

import { Form } from "antd";
import { FaSearch, FaFileInvoice } from "react-icons/fa";
import { FaCalendar } from "react-icons/fa6";
import { useState } from "react";
import TituloModulos from "~/app/_components/others/titulo-modulos";
import ButtonBase from "~/components/buttons/button-base";
import FormBase from "~/components/form/form-base";
import DatePickerBase from "~/app/_components/form/fechas/date-picker-base";
import SelectClientes from "~/app/_components/form/selects/select-clientes";
import InputBase from "~/app/_components/form/inputs/input-base";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useStoreFiltrosMisFacturas } from "../../_store/store-filtros-mis-facturas";
import SelectEstadoSunat from "../selects/select-estado-sunat";

interface ValuesFiltersMisFacturas {
  cliente_id?: number;
  desde?: Dayjs;
  hasta?: Dayjs;
  estado_sunat?: string;
  serie_numero?: string;
}

export default function FiltersMisFacturas() {
  const [form] = Form.useForm<ValuesFiltersMisFacturas>();
  const setFiltros = useStoreFiltrosMisFacturas((state) => state.setFiltros);

  const handleFinish = (values: ValuesFiltersMisFacturas) => {
    const { desde, hasta, serie_numero, ...rest } = values;

    let serie: string | undefined;
    let numero: number | undefined;
    if (serie_numero) {
      const parts = serie_numero.split("-");
      if (parts.length === 2) {
        serie = parts[0].trim();
        numero = parseInt(parts[1].trim());
      }
    }

    const data: any = {
      ...rest,
      ...(desde ? { desde: desde.format("YYYY-MM-DD") } : {}),
      ...(hasta ? { hasta: hasta.format("YYYY-MM-DD") } : {}),
      ...(serie ? { serie } : {}),
      ...(numero ? { numero } : {}),
    };

    Object.keys(data).forEach((key) => {
      if (data[key] === undefined || data[key] === null || data[key] === "") {
        delete data[key];
      }
    });

    setFiltros(data);
  };

  return (
    <FormBase
      form={form}
      name="filtros-mis-facturas"
      initialValues={{
        desde: dayjs().startOf("month"),
        hasta: dayjs().endOf("day"),
      }}
      className="w-full"
      onFinish={handleFinish}
    >
      <TituloModulos
        title="Mis Facturas Electrónicas"
        icon={<FaFileInvoice className="text-blue-600" />}
      />

      <div className="mt-4">
        <div className="grid grid-cols-12 gap-x-3 gap-y-2.5">
          <div className="col-span-2 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Desde:
            </label>
            <DatePickerBase
              propsForm={{
                name: "desde",
                hasFeedback: false,
                className: "!w-full",
              }}
              placeholder="Fecha"
              formWithMessage={false}
              prefix={<FaCalendar size={15} className="text-blue-600 mx-1" />}
              allowClear
            />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Hasta:
            </label>
            <DatePickerBase
              propsForm={{
                name: "hasta",
                hasFeedback: false,
                className: "!w-full",
              }}
              placeholder="Hasta"
              formWithMessage={false}
              prefix={<FaCalendar size={15} className="text-blue-600 mx-1" />}
              allowClear
            />
          </div>
          <div className="col-span-4 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Cliente:
            </label>
            <SelectClientes
              propsForm={{
                name: "cliente_id",
                hasFeedback: false,
                className: "!w-full",
              }}
              className="w-full"
              formWithMessage={false}
              allowClear
              form={form}
              placeholder="Buscar cliente"
            />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Estado:
            </label>
            <SelectEstadoSunat
              propsForm={{
                name: "estado_sunat",
                hasFeedback: false,
                className: "!w-full",
              }}
              className="w-full"
              formWithMessage={false}
              allowClear
              placeholder="Todos"
            />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Serie-N°:
            </label>
            <InputBase
              propsForm={{
                name: "serie_numero",
                hasFeedback: false,
                className: "!w-full",
              }}
              placeholder="F001-00001"
              formWithMessage={false}
            />
          </div>
        </div>

        <div className="flex justify-end mt-3">
          <ButtonBase
            color="info"
            size="md"
            type="submit"
            className="flex items-center gap-2"
          >
            <FaSearch />
            Buscar
          </ButtonBase>
        </div>
      </div>
    </FormBase>
  );
}
