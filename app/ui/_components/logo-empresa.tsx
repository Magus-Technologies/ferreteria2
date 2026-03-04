'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useEmpresaPublicaConLogo } from '~/hooks/use-empresa-publica'

const FALLBACK = '/logo-horizontal.png'

export default function LogoEmpresa() {
  const { data } = useEmpresaPublicaConLogo()
  const [src, setSrc] = useState<string | null>(null)

  const logoUrl = src ?? data?.logoUrl ?? FALLBACK

  return (
    <Image
      src={logoUrl}
      alt={data?.razon_social || 'Logo'}
      width={500}
      height={500}
      className='w-72 h-auto sm:w-80 md:w-[28rem] lg:w-[32rem] xl:w-[36rem] 2xl:w-[40rem]
                 object-contain
                 max-w-[90vw]'
      priority
      unoptimized
      onError={() => setSrc(FALLBACK)}
    />
  )
}
