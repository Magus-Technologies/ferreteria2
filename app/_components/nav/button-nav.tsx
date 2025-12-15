'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FaAngleRight } from 'react-icons/fa'

interface ButtonNavProps {
  children: React.ReactNode
  withIcon?: boolean
  className?: string
  path?: string
  colorActive: string
}

function ButtonNavBase({
  children,
  withIcon = true,
  className = '',
  path,
  colorActive,
}: ButtonNavProps) {
  const pathname = usePathname()
  const isActive = pathname === path

  return (
    <div
      className={`cursor-pointer transition-all flex items-center group w-full
                  py-2 lg:py-0.5 xl:py-1
                  text-sm lg:text-sm xl:text-base
                  ${className} ${
        isActive
          ? `bg-white px-3 lg:px-3 xl:px-6 rounded-lg lg:rounded-full ${colorActive}`
          : 'text-slate-700 lg:text-white hover:bg-gray-100 lg:hover:bg-white/10 lg:hover:bg-transparent px-3 lg:px-0 rounded-lg lg:rounded-none'
      }`}
    >
      {withIcon && (
        <FaAngleRight className='text-slate-700 lg:text-white lg:invisible lg:-translate-x-2 transition-all lg:group-hover:translate-x-0 lg:group-hover:visible lg:-ml-2
                                 text-sm' />
      )}
      <div className='flex items-center gap-2
                      text-nowrap
                      [&>svg]:text-base [&>svg]:lg:text-base [&>svg]:xl:text-lg'>{children}</div>
    </div>
  )
}

export default function ButtonNav({
  children,
  withIcon = true,
  className,
  path,
  colorActive,
}: ButtonNavProps) {
  return path ? (
    <Link href={path}>
      <ButtonNavBase
        withIcon={withIcon}
        className={className}
        path={path}
        colorActive={colorActive}
      >
        {children}
      </ButtonNavBase>
    </Link>
  ) : (
    <ButtonNavBase
      withIcon={withIcon}
      className={className}
      colorActive={colorActive}
    >
      {children}
    </ButtonNavBase>
  )
}
