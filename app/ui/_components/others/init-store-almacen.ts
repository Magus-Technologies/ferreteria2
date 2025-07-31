'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useStoreAlmacen } from '~/store/store-almacen'

export function InitAlmacenStore() {
  const { data: session } = useSession()
  const setAlmacenId = useStoreAlmacen(store => store.setAlmacenId)

  useEffect(() => {
    if (session?.user?.empresa?.almacen_id) {
      setAlmacenId(session.user.empresa.almacen_id)
    }
  }, [session, setAlmacenId])

  return null
}
