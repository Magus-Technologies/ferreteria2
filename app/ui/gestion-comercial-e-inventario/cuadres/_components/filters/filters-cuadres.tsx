"use client";

import { Form } from "antd";
import { FaSearch, FaCalendarAlt } from "react-icons/fa";
import { useState } from "react";
import FormBase from "~/components/form/form-base";
import LabelBase from "~/components/form/label-base";
import InputBase from "~/app/_components/form/inputs/input-base";
import DatePickerBase from "~/app/_components/form/fechas/date-picker-base";
import SelectAlmacen from "~/app/_components/form/selects/select-almacen";
import ButtonBase from "~/components/buttons/button-base";
import dayjs from "dayjs";
import SelectBase from "~/app/_components/form/selects/select-base";
import { useCuadresContext } from "../../_contexts/cuadres-context";
import ModalProductoSearch from "~/app/_components/modals/modal-producto-search";
import ModalProveedorSearch from "~/app/_components/modals/modal-proveedor-search";
import { TipoBusquedaProducto } from "~/app/_components/form/selects/select-tipo-busqueda-producto";
import { useStoreAlmacen } from "~/store/store-almacen";
import { useStoreProveedorSeleccionado } from "~/app/ui/gestion-comercial-e-inventario/mis-proveedores/store/store-proveedor-seleccionado";

export default function FiltersCuadres() {
    const [form] = Form.useForm();
    const { handleSearch, loading } = useCuadresContext();
    const almacenIdDefault = useStoreAlmacen((store) => store.almacen_id);

    // Modal buscador de producto
    const [openModalProducto, setOpenModalProducto] = useState(false);
    const [textDefaultProducto, setTextDefaultProducto] = useState("");
    const [tipoBusqueda, setTipoBusqueda] = useState<TipoBusquedaProducto>(
        TipoBusquedaProducto.CODIGO_DESCRIPCION
    );

    const abrirModalProducto = () => {
        setTextDefaultProducto(form.getFieldValue("search_producto") || "");
        setOpenModalProducto(true);
    };

    // Modal buscador de proveedor
    const [openModalProveedor, setOpenModalProveedor] = useState(false);
    const [textDefaultProveedor, setTextDefaultProveedor] = useState("");
    const proveedorSeleccionado = useStoreProveedorSeleccionado(
        (store) => store.proveedor
    );

    const abrirModalProveedor = () => {
        setTextDefaultProveedor(form.getFieldValue("search_proveedor") || "");
        setOpenModalProveedor(true);
    };

    const aplicarProveedor = (prov?: { ruc?: string | null; razon_social?: string }) => {
        if (!prov) return;
        form.setFieldValue(
            "search_proveedor",
            prov.razon_social || prov.ruc || ""
        );
        setOpenModalProveedor(false);
    };

    return (
        <div className="w-full p-1.5">
            <FormBase
                form={form}
                name="filters-cuadres"
                initialValues={{
                    desde: dayjs().startOf('day'),
                    hasta: dayjs(),
                    estado_filtro: 'activos',
                    tipo: 'TODOS',
                    almacen_id: almacenIdDefault ?? 1
                }}
                onFinish={handleSearch}
                className="w-full"
            >
                <div className="flex flex-wrap gap-x-3 gap-y-2 items-center">
                    <LabelBase label="Desde:" orientation="row" className="!text-[12px] font-semibold">
                        <DatePickerBase
                            propsForm={{ name: "desde", className: "!mb-0 w-[115px]" }}
                            className="w-full !h-9"
                            placeholder="Desde"
                            prefix={<FaCalendarAlt className="text-emerald-600 mx-1" size={13} />}
                            formWithMessage={false}
                        />
                    </LabelBase>
                    <LabelBase label="Hasta:" orientation="row" className="!text-[12px] font-semibold">
                        <DatePickerBase
                            propsForm={{ name: "hasta", className: "!mb-0 w-[115px]" }}
                            className="w-full !h-9"
                            placeholder="Hasta"
                            prefix={<FaCalendarAlt className="text-emerald-600 mx-1" size={13} />}
                            formWithMessage={false}
                        />
                    </LabelBase>
                    <LabelBase label="Sucursal:" orientation="row" className="!text-[12px] font-semibold">
                        <SelectAlmacen
                            propsForm={{ name: "almacen_id", className: "!mb-0 w-[145px]" }}
                            className="!min-w-0 w-full !h-9"
                            size="middle"
                            sizeIcon={14}
                            classNameIcon="text-emerald-600 mx-1"
                            formWithMessage={false}
                        />
                    </LabelBase>
                    <LabelBase label="Tipo:" orientation="row" className="!text-[12px] font-semibold">
                        <SelectBase
                            propsForm={{ name: "tipo", className: "!mb-0 w-[145px]" }}
                            className="w-full !h-9"
                            size="middle"
                            options={[
                                { label: 'TODOS', value: 'TODOS' },
                                { label: 'AJUSTE', value: 'AJUSTE' },
                                { label: 'CUADRE INVENTARIO', value: 'CUADRE INVENTARIO' },
                                { label: 'MERMA', value: 'MERMA' },
                                { label: 'PRESTAMO', value: 'PRESTAMO' },
                            ]}
                            formWithMessage={false}
                        />
                    </LabelBase>
                    <LabelBase label="Producto:" orientation="row" className="!text-[12px] font-semibold">
                        <InputBase
                            propsForm={{ name: "search_producto", className: "!mb-0 w-[145px]" }}
                            placeholder="Buscar..."
                            className="w-full !h-9 bg-yellow-50/50"
                            formWithMessage={false}
                            allowClear
                            nextInEnter={false}
                            onPressEnter={(e) => {
                                e.preventDefault();
                                abrirModalProducto();
                            }}
                        />
                        <FaSearch
                            className="text-yellow-600 cursor-pointer min-w-fit"
                            size={15}
                            title="Buscar producto"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                abrirModalProducto();
                            }}
                        />
                    </LabelBase>
                    <LabelBase label="Proveedor:" orientation="row" className="!text-[12px] font-semibold">
                        <InputBase
                            propsForm={{ name: "search_proveedor", className: "!mb-0 w-[130px]" }}
                            placeholder="F1..."
                            className="w-full !h-9 bg-yellow-50/50"
                            formWithMessage={false}
                            allowClear
                            nextInEnter={false}
                            onPressEnter={(e) => {
                                e.preventDefault();
                                abrirModalProveedor();
                            }}
                        />
                        <FaSearch
                            className="text-yellow-600 cursor-pointer min-w-fit"
                            size={15}
                            title="Buscar proveedor"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                abrirModalProveedor();
                            }}
                        />
                    </LabelBase>
                    <LabelBase label="Observación:" orientation="row" className="!text-[12px] font-semibold">
                        <InputBase
                            propsForm={{ name: "observacion", className: "!mb-0 w-[145px]" }}
                            placeholder="..."
                            className="w-full !h-9 bg-yellow-50/50"
                            formWithMessage={false}
                            allowClear
                        />
                    </LabelBase>
                    <LabelBase label="Estado:" orientation="row" className="!text-[12px] font-semibold">
                        <SelectBase
                            propsForm={{ name: "estado_filtro", className: "!mb-0 w-[145px]" }}
                            className="w-full !h-9"
                            size="middle"
                            options={[
                                { label: 'TODOS', value: 'todos' },
                                { label: 'ACTIVOS', value: 'activos' },
                                { label: 'ANULADOS', value: 'anulados' },
                            ]}
                            formWithMessage={false}
                        />
                    </LabelBase>
                    <ButtonBase
                        color="info"
                        size="md"
                        className="!h-9 flex items-center justify-center gap-2 !text-[12px] px-4"
                        type="submit"
                    >
                        <FaSearch size={13} /> Buscar
                    </ButtonBase>
                </div>
            </FormBase>

            <ModalProductoSearch
                open={openModalProducto}
                setOpen={setOpenModalProducto}
                textDefault={textDefaultProducto}
                setTextDefault={setTextDefaultProducto}
                tipoBusqueda={tipoBusqueda}
                setTipoBusqueda={setTipoBusqueda}
                onRowDoubleClicked={({ data }) => {
                    if (!data) return;
                    form.setFieldValue(
                        "search_producto",
                        data.name || data.cod_producto || ""
                    );
                    setOpenModalProducto(false);
                }}
                showUltimasCompras={false}
                ignoreAlmacen
            />

            <ModalProveedorSearch
                open={openModalProveedor}
                setOpen={setOpenModalProveedor}
                textDefault={textDefaultProveedor}
                onOk={() => aplicarProveedor(proveedorSeleccionado)}
                onRowDoubleClicked={({ data }) => aplicarProveedor(data)}
            />
        </div>
    );
}
