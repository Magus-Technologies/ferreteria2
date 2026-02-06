"use client";

import { Form } from "antd";
import { FaSearch, FaFileInvoice } from "react-icons/fa";
import { FaCalendar } from "react-icons/fa6";
import TituloModulos from "~/app/_components/others/titulo-modulos";
import ButtonBase from "~/components/buttons/button-base";
import FormBase from "~/components/form/form-base";
import DatePickerBase from "~/app/_components/form/fechas/date-picker-base";
import InputBase from "~/app/_components/form/inputs/input-base";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useStoreFiltrosMisNotasDebito } from "../../_store/store-filtros-mis-notas-debito";
import SelectEstadoSunat from "../../../mis-facturas/_components/selects/select-estado-sunat";

interface ValuesFilters {
  desde?: Dayjs;
  hasta?: Dayjs;
  estado_sunat?: string;
  serie_numero?: string;
}

export default function FiltersMisNotasDebito() {
  const [form] = Form.useForm<ValuesFilters>();
  const setFiltros = useStoreFiltrosMisNotasDebito((state) => state.setFiltros);

  const handleFinish = (values: ValuesFilters) => {
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
      name="filtros-mis-notas-debito"
      initialValues={{
        desde: dayjs().startOf("month"),
        hasta: dayjs().endOf("day"),
      }}
      className="w-full"
      onFinish={handleFinish}
    >
      <TituloModulos
        title="Mis Notas de Débito"
        icon={<FaFileInvoice className="text-orange-600" />}
      />
      <div className="mt-4 grid grid-cols-12 gap-x-3 gap-y-2.5">
        <div className="col-span-3 flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">Desde:</label>
          <DatePickerBase propsForm={{ name: "desde", hasFeedback: false, className: "!w-full" }} placeholder="Fecha" formWithMessage={false} prefix={<FaCalendar size={15} className="text-orange-600 mx-1" />} allowClear />
        </div>
        <div className="col-span-3 flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">Hasta:</label>
          <DatePickerBase propsForm={{ name: "hasta", hasFeedback: false, className: "!w-full" }} placeholder="Hasta" formWithMessage={false} prefix={<FaCalendar size={15} className="text-orange-600 mx-1" />} allowClear />
        </div>
        <div className="col-span-3 flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">Estado:</label>
          <SelectEstadoSunat propsForm={{ name: "estado_sunat", hasFeedback: false, className: "!w-full" }} className="w-full" formWithMessage={false} allowClear placeholder="Todos" />
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">Serie-N°:</label>
          <InputBase propsForm={{ name: "serie_numero", hasFeedback: false, className: "!w-full" }} placeholder="ND01-00001" formWithMessage={false} />
        </div>
        <div className="col-span-1 flex items-center">
          <ButtonBase color="info" size="md" type="submit" className="flex items-center gap-2 w-full justify-center"><FaSearch />Buscar</ButtonBase>
        </div>
      </div>
    </FormBase>
  );
}
