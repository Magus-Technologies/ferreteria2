"use client";

import { Form, Switch } from "antd";
import { FaSearch, FaCalendar } from "react-icons/fa";
import { IoMdContact } from "react-icons/io";
import { useQueryClient } from "@tanstack/react-query";
import { TipoCliente } from "~/lib/api/cliente";
import { useStoreFiltrosMisContactos } from "../../_store/store-filtros-mis-contactos";
import ButtonCreateCliente from "~/app/_components/form/buttons/button-create-cliente";
import TituloModulos from "~/app/_components/others/titulo-modulos";
import ButtonBase from "~/components/buttons/button-base";
import FormBase from "~/components/form/form-base";
import InputBase from "~/app/_components/form/inputs/input-base";
import SelectTipoCliente from "~/app/_components/form/selects/select-tipo-cliente";
import DatePickerBase from "~/app/_components/form/fechas/date-picker-base";
import { QueryKeys } from "~/app/_lib/queryKeys";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useEffect } from "react";

interface ValuesFiltersMisContactos {
  search?: string;
  tipo_cliente?: TipoCliente;
  desde?: Dayjs;
  hasta?: Dayjs;
  con_recomendaciones?: boolean;
}

export default function FiltersMisContactos() {
  const [form] = Form.useForm<ValuesFiltersMisContactos>();
  const { setFiltros } = useStoreFiltrosMisContactos();
  const queryClient = useQueryClient();

  // Inicializar con fecha de hoy
  useEffect(() => {
    setFiltros({
      fecha_desde: dayjs().format("YYYY-MM-DD"),
      fecha_hasta: dayjs().format("YYYY-MM-DD"),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFinish = (values: ValuesFiltersMisContactos) => {
    const data: any = {};
    if (values.search) data.search = values.search;
    if (values.tipo_cliente) data.tipo_cliente = values.tipo_cliente;
    if (values.desde) data.fecha_desde = values.desde.format("YYYY-MM-DD");
    if (values.hasta) data.fecha_hasta = values.hasta.format("YYYY-MM-DD");
    if (values.con_recomendaciones) data.con_recomendaciones = true;
    setFiltros(data);
    queryClient.invalidateQueries({ queryKey: [QueryKeys.CLIENTES] });
  };

  return (
    <FormBase
      form={form}
      name="filtros-mis-contactos"
      initialValues={{
        desde: dayjs().startOf("day"),
        hasta: dayjs().endOf("day"),
      }}
      className="w-full"
      onFinish={handleFinish}
    >
      <TituloModulos
        title="Mis Clientes"
        icon={<IoMdContact className="text-cyan-600" />}
      >
        <ButtonCreateCliente
          onSuccess={() => queryClient.invalidateQueries({ queryKey: [QueryKeys.CLIENTES] })}
        />
      </TituloModulos>

      <div className="mt-4">
        <div className="grid grid-cols-12 gap-x-2 gap-y-2 items-center">
          {/* Buscar */}
          <div className="col-span-5 flex items-center gap-1">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">Buscar:</label>
            <InputBase
              propsForm={{ name: "search", hasFeedback: false, className: "!w-full" }}
              placeholder="RUC/DNI, Razón Social, Nombres..."
              formWithMessage={false}
            />
          </div>

          {/* Tipo */}
          <div className="col-span-1 flex items-center gap-1">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">Tipo:</label>
            <SelectTipoCliente
              propsForm={{ name: "tipo_cliente", hasFeedback: false, className: "!w-full" }}
              className="w-full"
              formWithMessage={false}
              allowClear
              placeholder="Todos"
            />
          </div>

          {/* Desde */}
          <div className="col-span-2 flex items-center gap-1">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">Desde:</label>
            <DatePickerBase
              propsForm={{ name: "desde", hasFeedback: false, className: "!w-full" }}
              placeholder="Fecha"
              formWithMessage={false}
              prefix={<FaCalendar size={13} className="text-cyan-600 mx-1" />}
              allowClear
            />
          </div>

          {/* Hasta */}
          <div className="col-span-2 flex items-center gap-1">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">Hasta:</label>
            <DatePickerBase
              propsForm={{ name: "hasta", hasFeedback: false, className: "!w-full" }}
              placeholder="Hasta"
              formWithMessage={false}
              prefix={<FaCalendar size={13} className="text-cyan-600 mx-1" />}
              allowClear
            />
          </div>

          {/* Buscar */}
          <div className="col-span-1 flex items-center">
            <ButtonBase
              color="info"
              size="md"
              type="submit"
              className="flex items-center gap-2 w-full justify-center h-10"
            >
              <FaSearch />
              Buscar
            </ButtonBase>
          </div>

          {/* Con recomendaciones */}
          <div className="col-span-2 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">Con recomendaciones:</label>
            <Form.Item name="con_recomendaciones" valuePropName="checked" noStyle>
              <Switch size="small" onChange={() => form.submit()} />
            </Form.Item>
          </div>
        </div>
      </div>
    </FormBase>
  );
}
