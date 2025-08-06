'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useStoreAlmacen } from '~/store/store-almacen'

export function InitAlmacenStore() {
  const { data: session, status } = useSession()
  const setAlmacenId = useStoreAlmacen(store => store.setAlmacenId)

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.empresa?.almacen_id) {
      setAlmacenId(session.user.empresa.almacen_id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  return null
}
