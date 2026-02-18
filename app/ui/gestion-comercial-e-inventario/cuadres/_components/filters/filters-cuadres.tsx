"use client";

import { Form, Checkbox } from "antd";
import { FaSearch, FaCalendarAlt } from "react-icons/fa";
import FormBase from "~/components/form/form-base";
import LabelBase from "~/components/form/label-base";
import InputBase from "~/app/_components/form/inputs/input-base";
import DatePickerBase from "~/app/_components/form/fechas/date-picker-base";
import SelectAlmacen from "~/app/_components/form/selects/select-almacen";
import ButtonBase from "~/components/buttons/button-base";
import dayjs from "dayjs";
import SelectBase from "~/app/_components/form/selects/select-base";
import { useCuadresContext } from "../../_contexts/cuadres-context";

export default function FiltersCuadres() {
    const [form] = Form.useForm();
    const { handleSearch, loading } = useCuadresContext();

    return (
        <div className="w-full bg-white p-2">
            <FormBase
                form={form}
                name="filters-cuadres"
                initialValues={{
                    desde: dayjs().startOf('month'),
                    hasta: dayjs(),
                    listar_no_anuladas: true,
                    tipo: 'TODOS'
                }}
                onFinish={handleSearch}
                className="w-full"
            >
                <div className="flex flex-col gap-2">
                    {/* Fila 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                        <div className="col-span-12 md:col-span-2">
                            <LabelBase label="Desde:" orientation="column" className="w-full !text-[9px]">
                                <DatePickerBase
                                    propsForm={{ name: "desde" }}
                                    className="w-full h-7"
                                    placeholder="Desde"
                                    prefix={<FaCalendarAlt className="text-emerald-600 mx-1" size={10} />}
                                    formWithMessage={false}
                                />
                            </LabelBase>
                        </div>
                        <div className="col-span-12 md:col-span-2">
                            <LabelBase label="Hasta:" orientation="column" className="w-full !text-[9px]">
                                <DatePickerBase
                                    propsForm={{ name: "hasta" }}
                                    className="w-full h-7"
                                    placeholder="Hasta"
                                    prefix={<FaCalendarAlt className="text-emerald-600 mx-1" size={10} />}
                                    formWithMessage={false}
                                />
                            </LabelBase>
                        </div>
                        <div className="col-span-12 md:col-span-5">
                            <LabelBase label="Nombre del Producto:" orientation="column" className="w-full !text-[9px]">
                                <InputBase
                                    propsForm={{ name: "search_producto" }}
                                    placeholder="Buscar producto..."
                                    className="w-full h-7 bg-yellow-50/50"
                                    formWithMessage={false}
                                />
                            </LabelBase>
                        </div>
                        <div className="col-span-12 md:col-span-3 flex items-end h-7 mt-4">
                            <Form.Item name="listar_no_anuladas" valuePropName="checked" noStyle>
                                <Checkbox className="!text-[10px] font-bold uppercase text-gray-600 flex items-center gap-2 whitespace-nowrap">
                                    LISTAR NOTAS NO ANULADAS
                                </Checkbox>
                            </Form.Item>
                        </div>
                    </div>

                    {/* Fila 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                        <div className="col-span-12 md:col-span-3">
                            <LabelBase label="Proveedor / RUC:" orientation="column" className="w-full !text-[9px]">
                                <InputBase
                                    propsForm={{ name: "search_proveedor" }}
                                    placeholder="F1 para buscar..."
                                    className="w-full h-7 bg-yellow-50/50"
                                    formWithMessage={false}
                                />
                            </LabelBase>
                        </div>
                        <div className="col-span-12 md:col-span-2">
                            <LabelBase label="Sucursal:" orientation="column" className="w-full !text-[9px]">
                                <SelectAlmacen
                                    propsForm={{ name: "almacen_id" }}
                                    className="!min-w-0 w-full !h-7"
                                    size="small"
                                    sizeIcon={14}
                                    classNameIcon="text-emerald-600 mx-1"
                                    formWithMessage={false}
                                />
                            </LabelBase>
                        </div>
                        <div className="col-span-12 md:col-span-4">
                            <LabelBase label="Observación:" orientation="column" className="w-full !text-[9px]">
                                <InputBase
                                    propsForm={{ name: "observacion" }}
                                    placeholder="..."
                                    className="w-full h-7 bg-yellow-50/50"
                                    formWithMessage={false}
                                />
                            </LabelBase>
                        </div>
                        <div className="col-span-12 md:col-span-2">
                            <LabelBase label="Tipo:" orientation="column" className="w-full !text-[9px]">
                                <SelectBase
                                    propsForm={{ name: "tipo" }}
                                    className="w-full h-7"
                                    size="small"
                                    options={[
                                        { label: 'TODOS', value: 'TODOS' },
                                        { label: 'AJUSTE', value: 'AJUSTE' },
                                        { label: 'CUADRE INVENTARIO', value: 'CUADRE INVENTARIO' },
                                        { label: 'MERMA', value: 'MERMA' },
                                    ]}
                                    formWithMessage={false}
                                />
                            </LabelBase>
                        </div>
                        <div className="col-span-12 md:col-span-1">
                            <ButtonBase
                                color="info"
                                size="sm"
                                className="w-full h-7 flex items-center justify-center gap-1"
                                type="submit"
                            >
                                <FaSearch size={10} /> Buscar
                            </ButtonBase>
                        </div>
                    </div>
                </div>
            </FormBase>
        </div>
    );
}
