import { useServerQuery } from "~/hooks/use-server-query";
import { facturacionElectronicaApi } from "~/lib/api/facturacion-electronica";

export default function useGetNotasDebito({ where }: { where?: any } = {}) {
  const { data, isLoading, error, refetch } = useServerQuery({
    queryKey: ["notas-debito", where],
    queryFn: async () => {
      const response = await facturacionElectronicaApi.getNotasDebito(where);
      if (response.error) throw new Error(response.error.message);
      return response.data?.data || [];
    },
  });
  return { response: data || [], isLoading, error, refetch };
}
