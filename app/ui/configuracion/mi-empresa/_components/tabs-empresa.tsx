// tabs informacion, Basica,logo ,configuraciones y contactos

"use client";

import { Tabs } from "antd";
import FormInformacionEmpresa from "./forms/form-informacion-basica";
import FormContactos from "./forms/form-contactos";
import FormLogo from "./forms/form-logo";
import FormConfiguracion from "./forms/form-configuracion";

interface TabsEmpresaProps {
  empresaId: number;
}
export default function TabsEmpresa({ empresaId }: TabsEmpresaProps) {
  const tabsItems = [
    {
        key: '1',
        label: 'Información Básica',
        children: <FormInformacionEmpresa empresaId={empresaId} />
    },
    {
        key: '2',
        label: 'Logo',
        children: <FormLogo empresaId={empresaId} />
    },
    {
        key: '3',
        label: 'Configuraciones',
        children: <FormConfiguracion empresaId={empresaId} />
    },
    {
        key: '4',
        label: 'Contactos',
        children: <FormContactos empresaId={empresaId} />
    }
  ];
  return <Tabs defaultActiveKey="1" items={tabsItems} />;
}
