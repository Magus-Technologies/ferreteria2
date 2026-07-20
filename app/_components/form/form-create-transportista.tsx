"use client";

import { FaAddressCard, FaBuilding, FaTruck } from "react-icons/fa6";
import LabelBase from "~/components/form/label-base";
import { FormInstance } from "antd/lib";
import InputBase from "~/app/_components/form/inputs/input-base";
import InputConsultaRuc from "~/app/_components/form/inputs/input-consulta-ruc";
import { ConsultaRuc } from "~/app/_types/consulta-ruc";
import { Transportista, transportistaApi } from "~/lib/api/transportista";

export default function FormCreateTransportista({
  form,
  dataEdit,
}: {
  form: FormInstance;
  dataEdit?: Transportista;
}) {
  const MTC_CONSULTA_URL = 'https://www.mtc.gob.pe/tramitesenlinea/tweb_tLinea/tw_consultadgtt/Frm_rep_intra_mercancia.aspx'

  return (
    <>
      <LabelBase
        label="RUC:"
        className="w-full"
        classNames={{ labelParent: "mb-6" }}
      >
        <InputConsultaRuc
          prefix={<FaAddressCard className="text-rose-700 mx-1" />}
          propsForm={{
            name: "ruc",
            validateTrigger: "onBlur",
            rules: [
              { required: true, message: "Por favor, ingresa el RUC" },
              { len: 11, message: "El RUC debe tener 11 dígitos" },
            ],
          }}
          placeholder="RUC"
          automatico={!dataEdit}
          onSuccess={(res) => {
            const rucData = (res as ConsultaRuc)?.ruc
              ? (res as ConsultaRuc)
              : undefined;

            form.resetFields(["razon_social"]);

            if (rucData) {
              form.setFieldValue("razon_social", rucData.razonSocial);
              // Autocompletar N° Registro MTC desde el portal del MTC
              // (async, no bloquea; si el portal falla, queda manual).
              // Solo registros HABILITADOS: los vencidos no sirven para la GRE.
              transportistaApi
                .consultaMtc(rucData.ruc)
                .then((resp) => {
                  const registros = (resp.data as any)?.data ?? [];
                  const habilitado = registros.find(
                    (r: any) => r.habilitado && r.codigo,
                  );
                  if (habilitado && !form.getFieldValue("nro_mtc")) {
                    form.setFieldValue("nro_mtc", habilitado.codigo);
                  }
                })
                .catch(() => {
                  /* portal MTC caído: el campo queda manual */
                });
            }
          }}
          form={form}
          nameWatch="ruc"
        />
      </LabelBase>

      <LabelBase label="Razón Social:" classNames={{ labelParent: "mb-6" }}>
        <InputBase
          prefix={<FaBuilding className="text-rose-700 mx-1" />}
          propsForm={{
            name: "razon_social",
            rules: [
              { required: true, message: "La razón social es requerida" },
            ],
          }}
          placeholder="Razón Social"
          uppercase={false}
        />
      </LabelBase>

      <LabelBase label="N° Registro MTC:">
        <InputBase
          prefix={<FaTruck className="text-cyan-700 mx-1" />}
          propsForm={{
            name: "nro_mtc",
          }}
          placeholder="Opcional"
          uppercase
        />
        {/* Consulta manual en el portal MTC (se abre en el navegador del
            usuario, con IP peruana). Copiar el código al campo. */}
        <div className="flex justify-end w-full mt-1">
          <a
            href={MTC_CONSULTA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-normal text-cyan-600 hover:text-cyan-700 hover:underline whitespace-nowrap"
            title="Buscar el N° de Registro MTC en el portal del MTC por RUC"
          >
            Consultar en MTC ↗
          </a>
        </div>
      </LabelBase>
    </>
  );
}
