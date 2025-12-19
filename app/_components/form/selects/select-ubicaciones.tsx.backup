"use client";

import { useLazyServerQuery } from "~/hooks/use-lazy-server-query";
import SelectBase, { RefSelectBaseProps, SelectBaseProps } from "./select-base";
import { FaLocationCrosshairs } from "react-icons/fa6";
import { getUbicaciones } from "~/app/_actions/ubicacion";
import { QueryKeys } from "~/app/_lib/queryKeys";
import { useEffect, useRef, useState } from "react";
import { useStoreAlmacen } from "~/store/store-almacen";
import ButtonCreateUbicacion from "../buttons/button-create-ubicacion";
import iterarChangeValue from "~/app/_utils/iterar-change-value";

interface SelectUbicacionesProps extends SelectBaseProps {
  classNameIcon?: string;
  sizeIcon?: number;
  showButtonCreate?: boolean;
  tieneValorPorDefecto?: boolean;
}

export default function SelectUbicaciones({
  placeholder = "Seleccionar Ubicación",
  variant = "filled",
  classNameIcon = "text-cyan-600 mx-1",
  sizeIcon = 16,
  showButtonCreate = false,
  tieneValorPorDefecto = false,
  ...props
}: SelectUbicacionesProps) {
  const selectUbicacionesRef = useRef<RefSelectBaseProps>(null);
  const [primera_vez, setPrimeraVez] = useState(true);

  const [primera_vez_con_valor_por_defecto, setPrimeraVezConValorPorDefecto] =
    useState(true);

  const almacen_id = useStoreAlmacen((store) => store.almacen_id);

  const { response, refetch, loading, triggerFetch, isFetched } =
    useLazyServerQuery({
      action: getUbicaciones,
      propsQuery: {
        queryKey: [QueryKeys.UBICACIONES],
      },
      params: { almacen_id: almacen_id || 0 },
    });

  useEffect(() => {
    if (!loading && almacen_id) setPrimeraVez(false);
  }, [loading, almacen_id]);

  useEffect(() => {
    if (!primera_vez) {
      refetch();
      if (!(primera_vez_con_valor_por_defecto && tieneValorPorDefecto)) {
        // Usar setTimeout para asegurar que el ref esté disponible
        setTimeout(() => {
          selectUbicacionesRef.current?.changeValue?.(undefined);
        }, 0);
      }
      setPrimeraVezConValorPorDefecto(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [almacen_id, refetch, primera_vez]);

  return (
    <>
      <SelectBase
        ref={selectUbicacionesRef}
        showSearch
        prefix={
          <FaLocationCrosshairs className={classNameIcon} size={sizeIcon} />
        }
        variant={variant}
        placeholder={placeholder}
        options={response?.map((item) => ({
          value: item.id,
          label: item.name,
        }))}
        onFocus={() => {
          if (!isFetched) {
            triggerFetch();
          }
        }}
        onOpenChange={(open) => {
          if (open && !isFetched) {
            triggerFetch();
          }
        }}
        {...props}
      />
      {showButtonCreate && (
        <ButtonCreateUbicacion
          onSuccess={(res) =>
            iterarChangeValue({
              refObject: selectUbicacionesRef,
              value: res.id,
            })
          }
        />
      )}
    </>
  );
}
