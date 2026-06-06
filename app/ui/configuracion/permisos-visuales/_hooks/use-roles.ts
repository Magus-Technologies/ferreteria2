import { useQuery } from '@tanstack/react-query';
import { permissionsApi } from '~/lib/api/permissions';

interface Role {
  id: number;
  name: string;
  descripcion: string;
  restrictions: { name: string }[];
}

interface UseRolesReturn {
  roles: Role[];
  loading: boolean;
  rolData: Role | null;
  restriccionesActivas: Set<string>;
}

export function useRoles(rolId: number | null): UseRolesReturn {
  const { data: rolesResponse, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => permissionsApi.getRoles(),
  });

  const roles: Role[] = (rolesResponse?.data as any)?.data || rolesResponse?.data || [];

  const rolData = rolId
    ? roles.find((r: Role) => r.id === rolId) || null
    : null;

  const restriccionesActivas = new Set<string>(
    rolData?.restrictions?.map((r: { name: string }) => r.name) || []
  );

  return { roles, loading: isLoading, rolData, restriccionesActivas };
}