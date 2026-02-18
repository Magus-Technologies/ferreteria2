import { useQuery } from "@tanstack/react-query";
import { clienteApi, type ClienteFilters } from "~/lib/api/cliente";
import { QueryKeys } from "~/app/_lib/queryKeys";

export function useGetContactos(filtros: ClienteFilters) {
  return useQuery({
    queryKey: [QueryKeys.CLIENTES, filtros],
    queryFn: () => clienteApi.getAll(filtros),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}