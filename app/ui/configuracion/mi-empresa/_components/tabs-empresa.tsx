"use client";

import { Tabs } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import FormInformacionEmpresa from "./forms/form-informacion-basica";
import FormContactos from "./forms/form-contactos";
import FormLogo from "./forms/form-logo";
import FormConfiguracion from "./forms/form-configuracion";
import FormEnvioSunat from "./forms/form-envio-sunat";

interface TabsEmpresaProps {
  empresaId: number;
}

const TAB_PARAM = "tab";
const DEFAULT_TAB = "informacion";

const TABS = [
  {
    key: "informacion",
    label: "Información Básica",
    content: (id: number) => <FormInformacionEmpresa empresaId={id} />,
  },
  {
    key: "logo",
    label: "Logo",
    content: (id: number) => <FormLogo empresaId={id} />,
  },
  {
    key: "configuraciones",
    label: "Configuraciones",
    content: (id: number) => <FormConfiguracion empresaId={id} />,
  },
  {
    key: "contactos",
    label: "Contactos",
    content: (id: number) => <FormContactos empresaId={id} />,
  },
  {
    key: "sunat",
    label: "Envío SUNAT",
    content: (id: number) => <FormEnvioSunat empresaId={id} />,
  },
];

export default function TabsEmpresa({ empresaId }: TabsEmpresaProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paramTab = searchParams.get(TAB_PARAM);
  const activeKey = TABS.some((t) => t.key === paramTab) ? (paramTab as string) : DEFAULT_TAB;

  const handleChange = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(TAB_PARAM, key);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const items = TABS.map((t) => ({
    key: t.key,
    label: t.label,
    children: t.content(empresaId),
  }));

  return <Tabs activeKey={activeKey} onChange={handleChange} items={items} />;
}
