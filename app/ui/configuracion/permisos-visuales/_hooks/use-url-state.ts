import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface UseUrlStateOptions {
  defaultRol?: number | null;
  defaultArea?: string;
}

interface UseUrlStateReturn {
  rolId: number | null;
  area: string;
  setRolId: (id: number | null) => void;
  setArea: (area: string) => void;
}

export function useUrlState(options: UseUrlStateOptions = {}): UseUrlStateReturn {
  const { defaultRol = null, defaultArea = 'facturacion-electronica' } = options;
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialRol = searchParams.get('rol') ? Number(searchParams.get('rol')) : defaultRol;
  const initialArea = searchParams.get('area') || defaultArea;

  const [rolId, setRolIdState] = useState<number | null>(initialRol);
  const [area, setAreaState] = useState<string>(initialArea);

  const updateURL = useCallback((rol: number | null, areaStr: string) => {
    const params = new URLSearchParams();
    if (rol) params.set('rol', rol.toString());
    params.set('area', areaStr);
    const queryString = params.toString();
    const newURL = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(newURL, { scroll: false });
  }, [pathname, router]);

  useEffect(() => {
    updateURL(rolId, area);
  }, [rolId, area, updateURL]);

  const setRolId = (id: number | null) => {
    setRolIdState(id);
  };

  const setArea = (areaStr: string) => {
    setAreaState(areaStr);
  };

  return { rolId, area, setRolId, setArea };
}