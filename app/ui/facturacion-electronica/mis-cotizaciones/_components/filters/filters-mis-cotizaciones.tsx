"use client";

import { Form } from "antd";
import { FaSearch, FaPlus } from "react-icons/fa";
import { MdPointOfSale } from "react-icons/md";
import { useRouter } from "next/navigation";
import SelectAlmacen from "~/app/_components/form/selects/select-almacen";
import TituloModulos from "~/app/_components/others/titulo-modulos";
import ButtonBase from "~/components/buttons/button-base";
import FormBase from "~/components/form/form-base";
import SelectClientes from "~/app/_components/form/selects/select-clientes";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import { useStoreAlmacen } from "~/store/store-almacen";
import InputBase from "~/app/_components/form/inputs/input-base";
import ConfigurableElement from "~/app/ui/configuracion/permisos-visuales/_components/configurable-element";
import { useDebounce } from "use-debounce";
import { useStoreFiltrosMisCotizaciones } from "../../_store/store-filtros-mis-cotizaciones";
import FilterDateRangeFields from "~/app/_components/filters/filter-date-range-fields";

interface ValuesFiltersMisCotizaciones {
  almacen_id: number;
  cliente_id?: number;
  desde?: Dayjs;
  hasta?: Dayjs;
  numero?: string;
}

export default function FiltersMisCotizaciones() {
  const router = useRouter();
  const [form] = Form.useForm<ValuesFiltersMisCotizaciones>();
  const almacen_id = useStoreAlmacen((state) => state.almacen_id);
  const setFiltros = useStoreFiltrosMisCotizaciones((state) => state.setFiltros);

  const [proformaSearchText, setProformaSearchText] = useState("");
  const [debouncedProformaSearch] = useDebounce(proformaSearchText, 500);

  useEffect(() => {
    form.submit();
  }, [debouncedProformaSearch, form]);

  useEffect(() => {
    form.setFieldValue("almacen_id", almacen_id);
    form.submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [almacen_id]);

  const handleFinish = (values: ValuesFiltersMisCotizaciones) => {
    setFiltros({
      almacen_id: values.almacen_id,
      cliente_id: values.cliente_id,
      fecha_desde: values.desde ? values.desde.format("YYYY-MM-DD") : undefined,
      fecha_hasta: values.hasta ? values.hasta.format("YYYY-MM-DD") : undefined,
      numero: values.numero,
    });
  };

  return (
    <FormBase
      form={form}
      name="filtros-mis-cotizaciones"
      initialValues={{
        desde: dayjs().startOf("day"),
        hasta: dayjs().endOf("day"),
      }}
      className="w-full"
      onValuesChange={() => form.submit()}
      onFinish={handleFinish}
    >
      <TituloModulos
        title="Mis Cotizaciones"
        icon={<MdPointOfSale className="text-amber-600" />}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <SelectAlmacen
            propsForm={{
              name: "almacen_id",
              hasFeedback: false,
              className: "!min-w-[220px] !w-[220px] !max-w-[220px]",
              rules: [{ required: true, message: "" }],
            }}
            className="w-full"
            formWithMessage={false}
            form={form}
          />

          <ButtonBase
            color="success"
            size="md"
            onClick={() => router.push('/ui/facturacion-electronica/mis-cotizaciones/crear-cotizacion')}
            className="flex items-center gap-2"
          >
            <FaPlus />
            Crear Cotización
          </ButtonBase>
        </div>
      </TituloModulos>

      {/* Filtros con labels inline */}
      <div className="mt-4 space-y-2.5">
        {/* Fila 1: Fecha Desde, Hasta, Cliente */}
        <div className="flex items-center gap-3 flex-wrap">
          <FilterDateRangeFields
            fromName="desde"
            toName="hasta"
            fromFieldClassName="!w-[150px]"
            toFieldClassName="!w-[150px]"
          />
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Cliente:
            </label>
            <SelectClientes
              autoFocus
              propsForm={{
                name: "cliente_id",
                hasFeedback: false,
                className: "!w-[350px]",
              }}
              className="w-full"
              classIconSearch="!mb-0"
              formWithMessage={false}
              allowClear
              form={form}
              placeholder="Todos los clientes"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              N°Prof:
            </label>
            <InputBase
              propsForm={{
                name: "numero",
                hasFeedback: false,
                 className: "!w-[150px]",
              }}
              placeholder="000-0000000"
              formWithMessage={false}
              onChange={(e) => setProformaSearchText(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Modalidad:
            </label>
            <InputBase
              propsForm={{
                name: "modalidad",
                hasFeedback: false,
                className: "!w-[150px]",
              }}
              placeholder="TODOS"
              formWithMessage={false}
            />
          </div>
          <ConfigurableElement componentId="mis-cotizaciones.boton-buscar" label="Botón Buscar">
            <ButtonBase
              color="info"
              size="md"
              type="submit"
              className="flex items-center gap-2"
            >
              <FaSearch />
              Buscar
            </ButtonBase>
          </ConfigurableElement>
        </div>

        {/* Fila 2: N° Proforma, Modalidad, Sucursal, Botón Buscar */}
        {/* <div className="flex items-center gap-3 flex-wrap"> */}
          {/* <div className='flex items-center gap-2'>
            <label className='text-xs font-semibold text-gray-700 whitespace-nowrap'>
              Sucursal:
            </label>
            <InputBase
              propsForm={{
                name: 'sucursal',
                hasFeedback: false,
                className: '!w-[200px]',
              }}
              placeholder='MI REDENTOR'
              formWithMessage={false}
            />
          </div> */}
     
        {/* </div> */}
      </div>
    </FormBase>
  );
}
