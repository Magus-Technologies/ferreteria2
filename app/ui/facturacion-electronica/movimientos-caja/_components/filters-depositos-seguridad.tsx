"use client";

import { Form } from "antd";
import { FaCalendar, FaSearch } from "react-icons/fa";
import { FilterOutlined } from "@ant-design/icons";
import DatePickerBase from "~/app/_components/form/fechas/date-picker-base";
import SelectVendedor from "~/app/ui/facturacion-electronica/_components/selects/select-vendedor";
import FormBase from "~/components/form/form-base";
import ButtonBase from "~/components/buttons/button-base";
import { Dayjs } from "dayjs";

interface FiltersDepositosSeguridadProps {
  onFilter: (filters: any) => void;
}

interface FilterValues {
  desde?: Dayjs;
  hasta?: Dayjs;
  vendedor_id?: string;
}

export default function FiltersDepositosSeguridad({ onFilter }: FiltersDepositosSeguridadProps) {
  const [form] = Form.useForm<FilterValues>();

  const handleFinish = (values: FilterValues) => {
    const { desde, hasta, ...rest } = values;
    
    const filters: any = {
      ...rest,
      ...(desde ? { desde: desde.format("YYYY-MM-DD") } : {}),
      ...(hasta ? { hasta: hasta.format("YYYY-MM-DD") } : {}),
    };

    // Limpiar valores undefined
    Object.keys(filters).forEach((key) => {
      if (filters[key] === undefined || filters[key] === null || filters[key] === "") {
        delete filters[key];
      }
    });

    onFilter(filters);
  };

  const handleReset = () => {
    form.resetFields();
    onFilter({});
  };

  return (
    <FormBase
      form={form}
      name="filtros-depositos-seguridad"
      onFinish={handleFinish}
      className="w-full mb-4"
    >
      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center gap-3 mb-3">
        </div>
        <div className="flex items-center gap-3">
          {/* Desde */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Desde:
            </label>
            <DatePickerBase
              propsForm={{
                name: "desde",
                hasFeedback: false,
                className: "!w-[140px]",
              }}
              placeholder="Fecha"
              formWithMessage={false}
              prefix={<FaCalendar size={15} className="text-amber-600 mx-1" />}
              allowClear
            />
          </div>

          {/* Hasta */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Hasta:
            </label>
            <DatePickerBase
              propsForm={{
                name: "hasta",
                hasFeedback: false,
                className: "!w-[140px]",
              }}
              placeholder="Fecha"
              formWithMessage={false}
              prefix={<FaCalendar size={15} className="text-amber-600 mx-1" />}
              allowClear
            />
          </div>

          {/* Vendedor */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Vendedor:
            </label>
            <SelectVendedor
              propsForm={{
                name: "vendedor_id",
                hasFeedback: false,
                className: "!w-[180px]",
              }}
              formWithMessage={false}
              allowClear
              placeholder="Todos"
              soloVendedores={false}
              mostrarDocumento={false}
            />
          </div>

          {/* Botones */}
          <div className="flex items-center gap-2">
            <ButtonBase
              color="info"
              size="md"
              type="submit"
              className="flex items-center gap-2"
            >
              <FaSearch />
              Buscar
            </ButtonBase>
            <ButtonBase
              color="default"
              size="md"
              type="button"
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              Limpiar
            </ButtonBase>
          </div>
        </div>
      </div>
    </FormBase>
  );
}
