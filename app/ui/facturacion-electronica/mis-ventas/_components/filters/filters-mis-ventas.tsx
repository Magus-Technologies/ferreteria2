"use client";

import { Form, Drawer, Badge } from "antd";
import { FaSearch, FaFilter } from "react-icons/fa";
import { FaCartShopping, FaTruckFast } from "react-icons/fa6";
import { useState, useMemo } from "react";
import ConfigurableElement from "~/app/ui/configuracion/permisos-visuales/_components/configurable-element";
import SelectAlmacen from "~/app/_components/form/selects/select-almacen";
import TituloModulos from "~/app/_components/others/titulo-modulos";
import ButtonBase from "~/components/buttons/button-base";
import FormBase from "~/components/form/form-base";
import { EstadoDeVenta, FormaDePago, TipoDocumento } from "~/lib/api/venta";
import { useStoreFiltrosMisVentas } from "../../_store/store-filtros-mis-ventas";
import { FaCalendar } from "react-icons/fa6";
import DatePickerBase from "~/app/_components/form/fechas/date-picker-base";
import SelectFormaDePago from "~/app/_components/form/selects/select-forma-de-pago";
import SelectClientes from "~/app/_components/form/selects/select-clientes";
import SelectTipoDocumento from "~/app/_components/form/selects/select-tipo-documento";
import SelectUsuarios from "~/app/_components/form/selects/select-usuarios";
import SelectEstadoDeVenta from "~/app/_components/form/selects/select-estado-de-venta";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useEffect } from "react";
import { useStoreAlmacen } from "~/store/store-almacen";
import InputBase from "~/app/_components/form/inputs/input-base";
import ModalEntregarProductos from "../modals/modal-entregar-productos";
import ModalSeleccionarTipoDespacho from "../modals/modal-seleccionar-tipo-despacho";
import ModalVerEntregas from "../modals/modal-ver-entregas";
import ModalCalendarioEntregas from "../modals/modal-calendario-entregas";
import { useStoreVentaSeleccionada } from "../tables/table-mis-ventas";
import { redColors, orangeColors, greenColors } from "~/lib/colors";

interface ValuesFiltersMisVentas {
  almacen_id: number;
  cliente_id?: number;
  cliente_search_text?: string; // Nuevo: texto de búsqueda del cliente
  desde?: Dayjs;
  hasta?: Dayjs;
  forma_de_pago?: FormaDePago;
  tipo_documento?: TipoDocumento;
  user_id?: string;
  estado_de_venta?: EstadoDeVenta;
  serie_numero?: string;
}

export default function FiltersMisVentas() {
  const [form] = Form.useForm<ValuesFiltersMisVentas>();
  const [modalSeleccionarTipoOpen, setModalSeleccionarTipoOpen] =
    useState(false);
  const [modalEntregarOpen, setModalEntregarOpen] = useState(false);
  const [tipoDespachoSeleccionado, setTipoDespachoSeleccionado] = useState<
    "EnTienda" | "Domicilio" | "Parcial"
  >("EnTienda");
  const [modalVerEntregasOpen, setModalVerEntregasOpen] = useState(false);
  const [modalCalendarioOpen, setModalCalendarioOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [clienteSearchText, setClienteSearchText] = useState<string>(""); // Nuevo: guardar texto de búsqueda

  const almacen_id = useStoreAlmacen((state) => state.almacen_id);
  const ventaSeleccionada = useStoreVentaSeleccionada((state) => state.venta);

  const setFiltros = useStoreFiltrosMisVentas((state) => state.setFiltros);

  useEffect(() => {
    const data = {
      almacen_id,
      // Laravel API no usa objetos gte/lte, envía las fechas directamente
      // El backend manejará el filtrado de rangos
    };
    setFiltros(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Contar filtros activos
  const activeFiltersCount = useMemo(() => {
    const values = form.getFieldsValue();
    let count = 0;
    if (values.cliente_id) count++;
    if (values.tipo_documento) count++;
    if (values.forma_de_pago) count++;
    if (values.estado_de_venta) count++;
    if (values.user_id) count++;
    if (values.serie_numero) count++;
    return count;
  }, [form]);

  const handleFinish = (values: ValuesFiltersMisVentas) => {
    console.log("📝 Valores del formulario:", values);
    console.log("📝 Texto de búsqueda del cliente:", clienteSearchText);

    const { desde, hasta, estado_de_venta, serie_numero, cliente_id, ...rest } =
      values;

    let serie: string | undefined;
    let numero: number | undefined;
    if (serie_numero) {
      const parts = serie_numero.split("-");
      if (parts.length === 2) {
        serie = parts[0].trim();
        numero = parseInt(parts[1].trim());
      }
    }

    // Construir objeto de filtros solo con valores definidos
    const data: any = {
      ...rest,
      // Si hay cliente_id, usarlo (cliente seleccionado)
      ...(cliente_id ? { cliente_id } : {}),
      // Si NO hay cliente_id pero SÍ hay texto de búsqueda, usar search
      ...(!cliente_id && clienteSearchText
        ? { search: clienteSearchText }
        : {}),
      // Incluir fechas si existen
      ...(desde ? { desde: desde.format("YYYY-MM-DD") } : {}),
      ...(hasta ? { hasta: hasta.format("YYYY-MM-DD") } : {}),
      // Laravel API espera campos simples, no objetos anidados
      ...(serie ? { serie } : {}),
      ...(numero ? { numero } : {}),
      ...(estado_de_venta ? { estado_de_venta } : {}),
    };

    // Limpiar valores undefined, null o vacíos
    Object.keys(data).forEach((key) => {
      if (data[key] === undefined || data[key] === null || data[key] === "") {
        delete data[key];
      }
    });

    console.log("🔍 Filtros aplicados (limpiados):", data);
    setFiltros(data);
    setDrawerOpen(false);
  };

  return (
    <FormBase
      form={form}
      name="filtros-mis-ventas"
      initialValues={{
        desde: dayjs().startOf("day"),
        hasta: dayjs().endOf("day"),
      }}
      className="w-full"
      onFinish={handleFinish}
    >
      <TituloModulos
        title="Mis Ventas"
        icon={<FaCartShopping className="text-amber-600" />}
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

      {/* Filtros Desktop - Ocupan todo el espacio */}
      <div className="hidden lg:block mt-4">
        <div className="grid grid-cols-12 gap-x-3 gap-y-2.5">
          {/* Fila 1 */}
          <div className="col-span-2 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Fecha Venta:
            </label>
            <ConfigurableElement componentId="field-fecha-desde" label="Campo Fecha Desde">
              <DatePickerBase
                propsForm={{
                  name: "desde",
                  hasFeedback: false,
                  className: "!w-full",
                }}
                placeholder="Fecha"
                formWithMessage={false}
                prefix={
                  <FaCalendar size={15} className="text-amber-600 mx-1" />
                }
                allowClear
              />
            </ConfigurableElement>
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Hasta:
            </label>
            <ConfigurableElement componentId="field-fecha-hasta" label="Campo Fecha Hasta">
              <DatePickerBase
                propsForm={{
                  name: "hasta",
                  hasFeedback: false,
                  className: "!w-full",
                }}
                placeholder="Hasta"
                formWithMessage={false}
                prefix={
                  <FaCalendar size={15} className="text-amber-600 mx-1" />
                }
                allowClear
              />
            </ConfigurableElement>
          </div>
          <div className="col-span-4 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Cliente:
            </label>
            <ConfigurableElement componentId="field-cliente" label="Campo Cliente">
              <SelectClientes
                autoFocus
                propsForm={{
                  name: "cliente_id",
                  hasFeedback: false,
                  className: "!w-full",
                }}
                className="w-full"
                classIconSearch="!mb-0"
                formWithMessage={false}
                allowClear
                form={form}
                placeholder="Digite nombre del cliente"
                onSearchChange={(text) => {
                  console.log("🔵 Texto de búsqueda:", text);
                  setClienteSearchText(text);
                }}
                onChange={(value) => {
                  console.log("🔵 Cliente seleccionado - ID:", value);
                  // Cuando se selecciona un cliente, limpiar el texto de búsqueda
                  if (value) {
                    setClienteSearchText("");
                  }
                  // Cuando se limpia el cliente, asegurarse de que el valor sea undefined
                  if (!value) {
                    form.setFieldValue("cliente_id", undefined);
                  }
                }}
              />
            </ConfigurableElement>
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              T.Doc:
            </label>
            <ConfigurableElement componentId="field-tipo-documento" label="Campo Tipo Documento">
              <SelectTipoDocumento
                propsForm={{
                  name: "tipo_documento",
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
          <div className="col-span-2 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Serie N°:
            </label>
            <ConfigurableElement componentId="field-serie-numero" label="Campo Serie y Número">
              <InputBase
                propsForm={{
                  name: "serie_numero",
                  hasFeedback: false,
                  className: "!w-full",
                }}
                placeholder="000-0000000"
                formWithMessage={false}
              />
            </ConfigurableElement>
          </div>

          {/* Fila 2 */}
          <div className="col-span-2 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              F.Pago:
            </label>
            <ConfigurableElement componentId="field-forma-pago" label="Campo Forma de Pago">
              <SelectFormaDePago
                propsForm={{
                  name: "forma_de_pago",
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
          <div className="col-span-2 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Estado:
            </label>
            <ConfigurableElement componentId="field-estado-venta" label="Campo Estado de Venta">
              <SelectEstadoDeVenta
                propsForm={{
                  name: "estado_de_venta",
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
          <div className="col-span-2 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              VEND:
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

          {/* Leyenda de colores */}
          <div className="col-span-5 flex items-center gap-4 text-xs">
            <span className="font-semibold text-gray-700">Leyenda:</span>
            <div className="flex items-center gap-1.5">
              <div
                className="w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: redColors[2] }}
              ></div>
              <span className="text-gray-600">Crédito Pendiente</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: orangeColors[2] }}
              ></div>
              <span className="text-gray-600">Contado / En Espera</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: greenColors[2] }}
              ></div>
              <span className="text-gray-600">Pagado Completo</span>
            </div>
          </div>

          <div className="col-span-1 flex items-center gap-2">
            <ConfigurableElement componentId="button-buscar" label="Botón Buscar">
              <ButtonBase
                color="info"
                size="md"
                type="submit"
                className="flex items-center gap-2 w-full justify-center"
              >
                <FaSearch />
                Buscar
              </ButtonBase>
            </ConfigurableElement>
          </div>

          {/* Fila 3 - Botones de acción */}
          <div className="col-span-2 flex items-center gap-2">
            <ConfigurableElement componentId="button-entregar" label="Botón Entregar">
              <ButtonBase
                color="warning"
                size="md"
                type="button"
                className="flex items-center gap-2 whitespace-nowrap w-full justify-center"
                onClick={() =>
                  ventaSeleccionada && setModalSeleccionarTipoOpen(true)
                }
                disabled={!ventaSeleccionada}
              >
                <FaTruckFast />
                Entregar
              </ButtonBase>
            </ConfigurableElement>
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <ConfigurableElement componentId="button-ver-entregas" label="Botón Ver Entregas">
              <ButtonBase
                color="info"
                size="md"
                type="button"
                className="flex items-center gap-2 whitespace-nowrap w-full justify-center"
                onClick={() =>
                  ventaSeleccionada && setModalVerEntregasOpen(true)
                }
                disabled={!ventaSeleccionada}
              >
                <FaTruckFast />
                Ver Entregas
              </ButtonBase>
            </ConfigurableElement>
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <ConfigurableElement componentId="button-ver-calendario" label="Botón Ver Calendario">
              <ButtonBase
                color="success"
                size="md"
                type="button"
                className="flex items-center gap-2 whitespace-nowrap w-full justify-center"
                onClick={() => setModalCalendarioOpen(true)}
              >
                <FaCalendar />
                Ver Calendario
              </ButtonBase>
            </ConfigurableElement>
          </div>
        </div>
      </div>

      {/* Drawer para móvil/tablet */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <FaFilter className="text-amber-600" />
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
              Fecha Venta:
            </label>
            <DatePickerBase
              propsForm={{ name: "desde", hasFeedback: false }}
              placeholder="Fecha Venta"
              formWithMessage={false}
              prefix={<FaCalendar size={15} className="text-amber-600 mx-1" />}
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
              prefix={<FaCalendar size={15} className="text-amber-600 mx-1" />}
              allowClear
              className="w-full"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Cliente:
            </label>
            <SelectClientes
              autoFocus
              propsForm={{ name: "cliente_id", hasFeedback: false }}
              className="w-full"
              classIconSearch="!mb-0"
              formWithMessage={false}
              allowClear
              form={form}
              placeholder="Digite nombre del cliente"
              onSearchChange={(text) => {
                console.log("🔵 Texto de búsqueda:", text);
                setClienteSearchText(text);
              }}
              onChange={(value) => {
                console.log("🔵 Cliente seleccionado - ID:", value);
                // Cuando se selecciona un cliente, limpiar el texto de búsqueda
                if (value) {
                  setClienteSearchText("");
                }
                // Cuando se limpia el cliente, asegurarse de que el valor sea undefined
                if (!value) {
                  form.setFieldValue("cliente_id", undefined);
                }
              }}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Tipo Documento:
            </label>
            <SelectTipoDocumento
              propsForm={{ name: "tipo_documento", hasFeedback: false }}
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
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Forma de Pago:
            </label>
            <SelectFormaDePago
              propsForm={{ name: "forma_de_pago", hasFeedback: false }}
              className="w-full"
              formWithMessage={false}
              allowClear
              placeholder="Todos"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Estado:
            </label>
            <SelectEstadoDeVenta
              propsForm={{ name: "estado_de_venta", hasFeedback: false }}
              className="w-full"
              formWithMessage={false}
              allowClear
              placeholder="Todos"
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

      <ModalSeleccionarTipoDespacho
        open={modalSeleccionarTipoOpen}
        setOpen={setModalSeleccionarTipoOpen}
        onSelectTipo={(tipo) => {
          setTipoDespachoSeleccionado(tipo);
          setModalEntregarOpen(true);
        }}
        ventaNumero={
          ventaSeleccionada
            ? `${ventaSeleccionada.serie}-${ventaSeleccionada.numero}`
            : undefined
        }
      />

      <ModalEntregarProductos
        open={modalEntregarOpen}
        setOpen={setModalEntregarOpen}
        venta={ventaSeleccionada}
        tipoDespacho={tipoDespachoSeleccionado}
      />

      <ModalVerEntregas
        open={modalVerEntregasOpen}
        setOpen={setModalVerEntregasOpen}
        venta={ventaSeleccionada}
      />

      <ModalCalendarioEntregas
        open={modalCalendarioOpen}
        setOpen={setModalCalendarioOpen}
      />
    </FormBase>
  );
}
