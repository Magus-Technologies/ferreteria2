"use client";

import { Form, Select } from "antd";
import { FaSearch, FaGift } from "react-icons/fa";
import TituloModulos from "~/app/_components/others/titulo-modulos";
import ButtonBase from "~/components/buttons/button-base";
import FormBase from "~/components/form/form-base";
import InputBase from "~/app/_components/form/inputs/input-base";
import {
  useStoreFiltrosVales,
  type FiltrosVales,
} from "../../_store/store-filtros-vales";
import FilterDateRangeFields from "~/app/_components/filters/filter-date-range-fields";
import dayjs, { type Dayjs } from "dayjs";
import { toUTCBD } from "~/utils/fechas";
import { useEffect, useState } from "react";
import {
  ESTADO_VALE_OPTIONS,
  TIPO_PROMOCION_OPTIONS,
  MODALIDAD_OPTIONS,
} from "../../_constants/filtros-vale-options";

interface FormValues extends Omit<FiltrosVales, "desde" | "hasta"> {
  desde?: Dayjs;
  hasta?: Dayjs;
}

export default function FiltersValesCompra() {
  const [form] = Form.useForm<FormValues>();
  const setFiltros = useStoreFiltrosVales((s) => s.setFiltros);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    form.setFieldsValue({
      estado: "ACTIVO",
      desde: dayjs().startOf("day"),
      hasta: dayjs().endOf("day"),
    });

    setFiltros({
      estado: "ACTIVO",
      desde: dayjs().format("YYYY-MM-DD"),
      hasta: dayjs().format("YYYY-MM-DD"),
    });
    setSearchValue("");
  }, [form, setFiltros]);

  const handleSearch = (values: FormValues) => {
    const { desde, hasta, ...rest } = values;
    setFiltros({
      ...rest,
      search: searchValue.trim() || undefined,
      desde: desde ? toUTCBD({ date: desde.startOf("day") }) : undefined,
      hasta: hasta ? toUTCBD({ date: hasta.endOf("day") }) : undefined,
    });
  };

  const handleManualSearch = (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.preventDefault();
    event?.stopPropagation();
    handleSearch(form.getFieldsValue());
  };

  return (
    <FormBase
      form={form}
      name="filtros-vales-compra"
      initialValues={{
        estado: "ACTIVO",
        desde: dayjs().startOf("day"),
        hasta: dayjs().endOf("day"),
      }}
      className="w-full"
      onFinish={handleSearch}
    >
      <TituloModulos
        title="Vales de Compra (Promociones)"
        icon={<FaGift className="text-amber-600" />}
      />

      {/* Filtros Desktop */}
      <div className="mt-4">
        <div className="grid grid-cols-12 gap-x-3 gap-y-2.5">
          {/* Fila 1: Desde | Hasta | Buscar | Estado | Buscar btn | Limpiar btn */}
          <div className="col-span-4 grid grid-cols-2 gap-3">
            <FilterDateRangeFields
              fromName="desde"
              toName="hasta"
              fromLabel="Desde:"
              itemClassName="flex items-center gap-1"
              fromPlaceholder="Fecha"
            />
          </div>

          <div className="col-span-3 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Buscar:
            </label>
            <InputBase
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Código o nombre del vale..."
              formWithMessage={false}
            />
          </div>

<div className="col-span-2 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Estado:
            </label>
            <Form.Item name="estado" noStyle className="flex-1">
              <Select
                className="!w-full"
                placeholder="Estado"
                options={ESTADO_VALE_OPTIONS}
                allowClear
              />
            </Form.Item>
          </div>

          <div className="col-span-2 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Tipo:
            </label>
            <Form.Item name="tipo_promocion" noStyle className="flex-1">
              <Select
                className="!w-full"
                placeholder="Tipo promoción"
                options={TIPO_PROMOCION_OPTIONS}
                allowClear
              />
            </Form.Item>
          </div>

          <div className="col-span-1 flex items-center gap-2">
            <ButtonBase
              color="info"
              size="md"
              type="button"
              onClick={handleManualSearch}
              className="flex items-center gap-2 w-full justify-center"
            >
              <FaSearch />
              Buscar
            </ButtonBase>
          </div>

          {/* Fila 2: Modalidad | Limpiar */}
          <div className="col-span-2 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Modalidad:
            </label>
            <Form.Item name="modalidad" noStyle className="flex-1">
              <Select
                className="!w-full"
                placeholder="Modalidad"
                options={MODALIDAD_OPTIONS}
                allowClear
              />
            </Form.Item>
          </div>
        </div>
      </div>
    </FormBase>
  );
}
