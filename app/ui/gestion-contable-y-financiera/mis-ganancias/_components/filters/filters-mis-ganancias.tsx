"use client";

import { Form, Drawer, Badge, Select } from "antd";
import { FaSearch, FaFilter, FaCalendar, FaBoxOpen } from "react-icons/fa";
import { GiMoneyStack } from "react-icons/gi";
import { useState, useMemo, useEffect } from "react";
import LabelBase from "~/components/form/label-base";
import ConfigurableElement from "~/app/ui/configuracion/permisos-visuales/_components/configurable-element";
import SelectAlmacen from "~/app/_components/form/selects/select-almacen";
import TituloModulos from "~/app/_components/others/titulo-modulos";
import ButtonBase from "~/components/buttons/button-base";
import FormBase from "~/components/form/form-base";
import DatePickerBase from "~/app/_components/form/fechas/date-picker-base";
import SelectUsuarios from "~/app/_components/form/selects/select-usuarios";
import SelectProductos from "~/app/_components/form/selects/select-productos";
import SelectClientes from "~/app/_components/form/selects/select-clientes";
import SelectMarcas from "~/app/_components/form/selects/select-marcas";
import InputBase from "~/app/_components/form/inputs/input-base";
import { Dayjs } from "dayjs";
import { useStoreFiltrosMisGanancias } from "~/app/ui/gestion-contable-y-financiera/mis-ganancias/_store/store-filtros-mis-ganancias";
import { useStoreAlmacen } from "~/store/store-almacen";
import dayjs from "dayjs";
import SelectDespliegueDePago from "~/app/_components/form/selects/select-despliegue-de-pago";

interface ValuesFiltersMisGanancias {
  desde?: Dayjs;
  hasta?: Dayjs;
  producto_id?: number;
  cliente_id?: number;
  cliente_search_text?: string;
  user_id?: string;
  serie_numero?: string;
  incluir?: string;
  marca?: string;
  marca_id?: number;
  vendedor?: string;
  forma_pago?: string;
  confirmar_caja?: string;
  tipo_doc?: string;
  serie_n?: string;
  sucursal?: string;
  mostrar_hora?: boolean;
}

export default function FiltersMisGanancias() {
  const [form] = Form.useForm<ValuesFiltersMisGanancias>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Texto de búsqueda de cliente (para el fallback `search` cuando se escribe sin
  // seleccionar un cliente concreto). El listado de clientes lo maneja SelectClientes.
  const [clienteSearchText, setClienteSearchText] = useState<string>("");

  const almacen_id = useStoreAlmacen((state) => state.almacen_id);
  const setFiltros = useStoreFiltrosMisGanancias((state) => state.setFiltros);

  // Inicializar filtros con almacén y fechas por defecto
  useEffect(() => {
    if (almacen_id) {
      const filtrosIniciales = {
        almacen_id,
        desde: dayjs().startOf("day").format("YYYY-MM-DD"),
        hasta: dayjs().endOf("day").format("YYYY-MM-DD"),
        mostrar_hora: "false", // Inicializar como string
      };
      setFiltros(filtrosIniciales);
    }
  }, [almacen_id, setFiltros]);

  // Contar filtros activos
  const activeFiltersCount = useMemo(() => {
    const values = form.getFieldsValue();
    let count = 0;
    if (values.producto_id) count++;
    if (values.cliente_id) count++;
    if (values.user_id) count++;
    if (values.serie_numero) count++;
    if (values.incluir) count++;
    if (values.marca_id) count++;
    if (values.vendedor) count++;
    if (values.forma_pago) count++;
    if (values.confirmar_caja) count++;
    if (values.tipo_doc) count++;
    if (values.serie_n) count++;
    if (values.sucursal) count++;
    return count;
  }, [form]);

  const handleFinish = (values: ValuesFiltersMisGanancias) => {
    const { desde, hasta, serie_numero, cliente_id, mostrar_hora, ...rest } = values;
    
    let serie: string | undefined;
    let numero: number | undefined;
    if (serie_numero) {
      const raw = String(serie_numero).trim();
      if (raw.includes("-")) {
        // Formato "SERIE-NUMERO": la serie es todo lo anterior al último guion.
        const idx = raw.lastIndexOf("-");
        const s = raw.slice(0, idx).trim();
        const n = parseInt(raw.slice(idx + 1).trim());
        if (s) serie = s;
        if (!isNaN(n)) numero = n;
      } else {
        // Solo texto/número: si es número, buscar por número; si no, por serie.
        const n = parseInt(raw);
        if (!isNaN(n) && /^\d+$/.test(raw)) numero = n;
        else serie = raw;
      }
    }

    const data: any = {
      almacen_id,
      ...rest,
      ...(cliente_id ? { cliente_id } : {}),
      ...(!cliente_id && clienteSearchText ? { search: clienteSearchText } : {}),
      ...(desde ? { desde: desde.format("YYYY-MM-DD") } : {}),
      ...(hasta ? { hasta: hasta.format("YYYY-MM-DD") } : {}),
      ...(serie ? { serie } : {}),
      ...(numero ? { numero } : {}),
      // Convertir mostrar_hora a string
      mostrar_hora: String(Boolean(mostrar_hora)),
    };

    // Limpiar valores undefined, null o vacíos (pero no false para booleanos)
    Object.keys(data).forEach((key) => {
      if (data[key] === undefined || data[key] === null || data[key] === "") {
        delete data[key];
      }
    });

    // Procesar confirmar_caja si viene con el formato subcaja_id-despliegue_id
    if (data.confirmar_caja && data.confirmar_caja.includes("-")) {
      data.confirmar_caja = data.confirmar_caja.split("-")[1];
    }

    console.log("🔍 Filtros aplicados:", data);
    setFiltros(data);
    setDrawerOpen(false);
  };

  return (
    <FormBase
      form={form}
      name="filtros-mis-ganancias"
      initialValues={{
        almacen_id: almacen_id,
        desde: dayjs().startOf("day"),
        hasta: dayjs().endOf("day"),
      }}
      className="w-full"
      onFinish={handleFinish}
    >
      <TituloModulos
        title="Mis Ganancias"
        icon={<GiMoneyStack className="text-rose-600" />}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <SelectAlmacen
            propsForm={{
              name: "almacen_id",
              hasFeedback: false,
              className: "w-full sm:!min-w-[220px] sm:!w-[220px]",
              rules: [{ required: true, message: "" }],
            }}
            className="w-full"
            formWithMessage={false}
            form={form}
          />

          {/* Mobile/Tablet: Botón para abrir drawer */}
          <div className="flex lg:hidden items-center gap-2">
            <ButtonBase
              color="info"
              size="md"
              type="submit"
              className="flex items-center gap-2"
            >
              <FaSearch />
            </ButtonBase>
            <Badge count={activeFiltersCount} offset={[-5, 5]}>
              <ButtonBase
                color="warning"
                size="md"
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <FaFilter />
                Filtros
              </ButtonBase>
            </Badge>
          </div>
        </div>
      </TituloModulos>

      {/* Filtros Desktop - Dos filas optimizadas */}
      <div className="hidden lg:block mt-4">
        <div className="grid grid-cols-12 gap-x-2 gap-y-2.5">
          {/* Fila 1 */}
          <div className="col-span-1 flex flex-col gap-0.5">
            <label className="text-[10px] font-semibold text-gray-500 uppercase">
              Desde:
            </label>
            <ConfigurableElement componentId="field-fecha-desde" label="Campo Fecha Desde">
              <DatePickerBase
                propsForm={{
                  name: "desde",
                  hasFeedback: false,
                  className: "!w-full",
                }}
                placeholder="Inicio"
                formWithMessage={false}
                allowClear
              />
            </ConfigurableElement>
          </div>
          <div className="col-span-1 flex flex-col gap-0.5">
            <label className="text-[10px] font-semibold text-gray-500 uppercase">
              Hasta:
            </label>
            <ConfigurableElement componentId="field-fecha-hasta" label="Campo Fecha Hasta">
              <DatePickerBase
                propsForm={{
                  name: "hasta",
                  hasFeedback: false,
                  className: "!w-full",
                }}
                placeholder="Fin"
                formWithMessage={false}
                allowClear
              />
            </ConfigurableElement>
          </div>
          <div className="col-span-2 flex flex-col gap-0.5">
            <label className="text-[10px] font-semibold text-gray-500 uppercase">
              Producto:
            </label>
            <ConfigurableElement componentId="field-producto-servicio" label="Campo Producto/Servicio">
              <SelectProductos
                propsForm={{
                  name: "producto_id",
                  hasFeedback: false,
                  className: "!w-full",
                }}
                form={form}
                withSearch
                formWithMessage={false}
                allowClear
                placeholder="Producto..."
                prefix={<FaBoxOpen size={15} className="text-cyan-600 mx-1" />}
              />
            </ConfigurableElement>
          </div>
          <div className="col-span-2 flex flex-col gap-0.5">
            <label className="text-[10px] font-semibold text-gray-500 uppercase">
              Cliente:
            </label>
            <ConfigurableElement componentId="field-cliente" label="Campo Cliente">
              <SelectClientes
                propsForm={{
                  name: "cliente_id",
                  hasFeedback: false,
                  className: "!w-full",
                }}
                form={form}
                formWithMessage={false}
                allowClear
                placeholder="Buscar cliente..."
                onSearchChange={(text: string) => setClienteSearchText(text)}
              />
            </ConfigurableElement>
          </div>
          <div className="col-span-2 flex flex-col gap-0.5">
            <label className="text-[10px] font-semibold text-gray-500 uppercase">
              Vendedor:
            </label>
            <ConfigurableElement componentId="field-vendedor" label="Campo Vendedor">
              <SelectUsuarios
                propsForm={{
                  name: "user_id",
                  hasFeedback: false,
                  className: "!w-full",
                }}
                className="w-full"
                formWithMessage={false}
                allowClear
                placeholder="Todos"
              />
            </ConfigurableElement>
          </div>
          <div className="col-span-1 flex flex-col gap-0.5">
            <label className="text-[10px] font-semibold text-gray-500 uppercase">
              Incluir:
            </label>
            <ConfigurableElement componentId="field-incluir" label="Campo Incluir">
              <Form.Item name="incluir" noStyle>
                <Select
                  allowClear
                  placeholder="Todos"
                  className="w-full"
                  options={[
                    { value: 'todos', label: 'Todos' },
                    { value: 'con_ganancia', label: 'Ganancia' },
                    { value: 'con_perdida', label: 'Pérdida' },
                    { value: 'sin_costo', label: 'S. Costo' },
                  ]}
                />
              </Form.Item>
            </ConfigurableElement>
          </div>
          <div className="col-span-1 flex flex-col gap-0.5">
            <label className="text-[10px] font-semibold text-gray-500 uppercase">
              Marca:
            </label>
            <ConfigurableElement componentId="field-marca" label="Campo Marca">
              <SelectMarcas
                propsForm={{
                  name: "marca_id",
                  hasFeedback: false,
                  className: "!w-full",
                }}
                formWithMessage={false}
                allowClear
                placeholder="Marca..."
              />
            </ConfigurableElement>
          </div>
          <div className="col-span-1 flex flex-col gap-0.5">
            <label className="text-[10px] font-semibold text-gray-500 uppercase">
              F.Pago:
            </label>
            <ConfigurableElement componentId="field-forma-pago" label="Campo Forma Pago">
              <Form.Item name="forma_pago" noStyle>
                <Select
                  allowClear
                  placeholder="Todas"
                  className="w-full"
                  options={[
                    { value: 'co', label: 'Contado' },
                    { value: 'cr', label: 'Crédito' },
                  ]}
                />
              </Form.Item>
            </ConfigurableElement>
          </div>
          <div className="col-span-1 flex flex-col gap-0.5">
            <label className="text-[10px] font-semibold text-gray-500 uppercase">
              T.Doc:
            </label>
            <ConfigurableElement componentId="field-tipo-doc" label="Campo Tipo Documento">
              <Form.Item name="tipo_doc" noStyle>
                <Select
                  allowClear
                  placeholder="Todos"
                  className="w-full"
                  options={[
                    { value: 'nv', label: 'Nota de Venta' },
                    { value: '03', label: 'Boleta' },
                    { value: '01', label: 'Factura' },
                  ]}
                />
              </Form.Item>
            </ConfigurableElement>
          </div>

          {/* Fila 2 */}
          <div className="col-span-4 flex flex-col gap-0.5">
            <label className="text-[10px] font-semibold text-gray-500 uppercase">
              Despliegue de Pago:
            </label>
            <ConfigurableElement componentId="field-confirmar-caja" label="Despliegue de Pago">
              <Form.Item name="confirmar_caja" noStyle>
                <SelectDespliegueDePago
                  allowClear
                  placeholder="Seleccionar..."
                  className="w-full"
                  formWithMessage={false}
                />
              </Form.Item>
            </ConfigurableElement>
          </div>
          <div className="col-span-2 flex flex-col gap-0.5">
            <label className="text-[10px] font-semibold text-gray-500 uppercase">
              Serie-N°:
            </label>
            <ConfigurableElement componentId="field-serie-numero" label="Campo Serie y Número">
              <InputBase
                propsForm={{
                  name: "serie_numero",
                  hasFeedback: false,
                  className: "!w-full",
                }}
                placeholder="000-000"
                formWithMessage={false}
              />
            </ConfigurableElement>
          </div>
          <div className="col-span-2 flex flex-col gap-0.5">
            <label className="text-[10px] font-semibold text-gray-500 uppercase">
              Sucursal:
            </label>
            <ConfigurableElement componentId="field-sucursal" label="Campo Sucursal">
              <Form.Item name="sucursal" noStyle>
                <Select
                  allowClear
                  placeholder="Todas"
                  className="w-full"
                  options={[
                    { value: 'principal', label: 'PRINCIPAL' },
                    { value: 'almacen_2', label: 'ALMACÉN 2' },
                    { value: 'almacen_3', label: 'ALMACÉN 3' },
                  ]}
                />
              </Form.Item>
            </ConfigurableElement>
          </div>
          <div className="col-span-2 flex items-end">
            <ConfigurableElement componentId="button-buscar" label="Botón Buscar">
              <ButtonBase
                color="info"
                size="md"
                type="submit"
                className="flex items-center gap-2 w-full justify-center h-[32px]"
              >
                <FaSearch size={12} />
                Buscar
              </ButtonBase>
            </ConfigurableElement>
          </div>
          <div className="col-span-2 flex items-end">
            <ConfigurableElement componentId="button-limpiar" label="Botón Limpiar">
              <ButtonBase
                color="default"
                size="md"
                type="button"
                onClick={() => {
                  form.resetFields();
                  setClienteSearchText("");
                  const filtrosLimpios = {
                    almacen_id,
                    desde: dayjs().startOf("day").format("YYYY-MM-DD"),
                    hasta: dayjs().endOf("day").format("YYYY-MM-DD"),
                    mostrar_hora: "false",
                  };
                  setFiltros(filtrosLimpios);
                }}
                className="flex items-center gap-2 w-full justify-center h-[32px]"
              >
                Limpiar
              </ButtonBase>
            </ConfigurableElement>
          </div>
        </div>
      </div>

      {/* Drawer para móvil/tablet */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <FaFilter className="text-rose-600" />
            <span>Filtros de Búsqueda</span>
          </div>
        }
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={Math.min(
          400,
          typeof window !== "undefined" ? window.innerWidth - 40 : 360,
        )}
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Fecha Desde:
            </label>
            <DatePickerBase
              propsForm={{ name: "desde", hasFeedback: false }}
              placeholder="Fecha"
              formWithMessage={false}
              prefix={<FaCalendar size={15} className="text-rose-600 mx-1" />}
              allowClear
              className="w-full"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Hasta:
            </label>
            <DatePickerBase
              propsForm={{ name: "hasta", hasFeedback: false }}
              placeholder="Hasta"
              formWithMessage={false}
              prefix={<FaCalendar size={15} className="text-rose-600 mx-1" />}
              allowClear
              className="w-full"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Producto:
            </label>
            <SelectProductos
              propsForm={{ name: "producto_id", hasFeedback: false }}
              form={form}
              withSearch
              formWithMessage={false}
              allowClear
              placeholder="Producto..."
              prefix={<FaBoxOpen size={15} className="text-cyan-600 mx-1" />}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Cliente:
            </label>
            <SelectClientes
              propsForm={{ name: "cliente_id", hasFeedback: false }}
              form={form}
              formWithMessage={false}
              allowClear
              placeholder="Buscar cliente..."
              onSearchChange={(text: string) => setClienteSearchText(text)}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Vendedor:
            </label>
            <SelectUsuarios
              propsForm={{ name: "user_id", hasFeedback: false }}
              className="w-full"
              formWithMessage={false}
              allowClear
              placeholder="Todos"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Serie y N°:
            </label>
            <InputBase
              propsForm={{ name: "serie_numero", hasFeedback: false }}
              placeholder="000-0000000"
              formWithMessage={false}
            />
          </div>
          <div className="flex gap-2 mt-4">
            <ButtonBase
              color="default"
              size="md"
              type="button"
              onClick={() => {
                form.resetFields();
                form.submit();
              }}
              className="flex-1"
            >
              Limpiar
            </ButtonBase>
            <ButtonBase
              color="info"
              size="md"
              type="submit"
              className="flex-1 flex items-center justify-center gap-2"
            >
              <FaSearch />
              Aplicar
            </ButtonBase>
          </div>
        </div>
      </Drawer>
    </FormBase>
  );
}