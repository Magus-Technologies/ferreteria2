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
  return (
    <div
      className={`cursor-pointer transition-all flex items-center group py-1 ${className} ${
        pathname === path ? `bg-white px-6 rounded-full ${colorActive}` : ''
      }`}
    >
      {withIcon && (
        <FaAngleRight className='invisible -translate-x-2 transition-all group-hover:translate-x-0 group-hover:visible -ml-2' />
      )}
      <div className='flex items-center gap-2 text-nowrap'>{children}</div>
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
