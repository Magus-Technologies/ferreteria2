"use client";

import { BiSolidCategoryAlt } from "react-icons/bi";
import SelectBase, { RefSelectBaseProps, SelectBaseProps } from "./select-base";
import { useQuery } from "@tanstack/react-query";
import { QueryKeys } from "~/app/_lib/queryKeys";
import { categoriasApi } from "~/lib/api/catalogos";
import ButtonCreateCategoria from "../buttons/button-create-categoria";
import { useRef, useState } from "react";
import iterarChangeValue from "~/app/_utils/iterar-change-value";

interface SelectCategoriasProps extends SelectBaseProps {
  classNameIcon?: string;
  sizeIcon?: number;
  showButtonCreate?: boolean;
}

export default function SelectCategorias({
  placeholder = "Seleccionar Categoría",
  variant = "filled",
  classNameIcon = "text-cyan-600 mx-1",
  sizeIcon = 18,
  showButtonCreate = false,
  ...props
}: SelectCategoriasProps) {
  const selectCategoriasRef = useRef<RefSelectBaseProps>(null);
  const [shouldFetch, setShouldFetch] = useState(false);

  const { data } = useQuery({
    queryKey: [QueryKeys.CATEGORIAS],
    queryFn: async () => {
      const response = await categoriasApi.getAll();
      if (response.error) {
        throw new Error(response.error.message);
      }
      // response.data tiene la estructura { data: Categoria[] }
      return response.data?.data || [];
    },
    enabled: shouldFetch,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  return (
    <>
      <SelectBase
        ref={selectCategoriasRef}
        showSearch
        prefix={
          <BiSolidCategoryAlt className={classNameIcon} size={sizeIcon} />
        }
        variant={variant}
        placeholder={placeholder}
        options={data?.map((item) => ({
          value: item.id,
          label: item.name,
        }))}
        onFocus={() => {
          if (!shouldFetch) {
            setShouldFetch(true);
          }
        }}
        onOpenChange={(open) => {
          if (open && !shouldFetch) {
            setShouldFetch(true);
          }
        }}
        {...props}
      />
      {showButtonCreate && (
        <ButtonCreateCategoria
          onSuccess={(res) =>
            iterarChangeValue({
              refObject: selectCategoriasRef,
              value: res.id,
            })
          }
        />
      )}
    </>
  );
}
