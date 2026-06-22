'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useEmpresaPublicaConLogo } from '~/hooks/use-empresa-publica'

const FALLBACK = '/logo-horizontal.svg'

export default function LogoEmpresa() {
  const { data, isLoading, cachedLogoUrl } = useEmpresaPublicaConLogo()
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)

  // Usa cache de localStorage si existe, sino espera a la API
  const logoUrl = imgError ? FALLBACK : (data?.logoUrl ?? cachedLogoUrl ?? FALLBACK)
  const hasSrc = !!cachedLogoUrl || !isLoading
  const showSkeleton = !hasSrc || !imgLoaded

  return (
    <div className='relative w-72 sm:w-80 md:w-[28rem] lg:w-[32rem] xl:w-[36rem] 2xl:w-[40rem] max-w-[90vw]'>
      {showSkeleton && (
        <div className='aspect-[2/1] w-full rounded-lg bg-gray-200 animate-pulse' />
      )}
      {hasSrc && (
        <Image
          key={logoUrl}
          src={logoUrl}
          alt={data?.razon_social || 'Logo'}
          width={500}
          height={500}
          className={`w-full h-auto object-contain transition-opacity duration-300 ${!imgLoaded ? 'absolute inset-0 opacity-0' : 'opacity-100'}`}
          priority
          unoptimized
          onLoad={() => setImgLoaded(true)}
          onError={() => { setImgError(true); setImgLoaded(true) }}
        />
      )}
    </div>
  )
}
