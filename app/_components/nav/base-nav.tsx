'use client'

import DropdownUser from './dropdown-user'
import { useState } from 'react'
import { Drawer } from 'antd'
import { HiMenuAlt3 } from 'react-icons/hi'
import { IoClose } from 'react-icons/io5'

interface BaseNavProps {
  className?: string
  classNameChildren?: string
  children: React.ReactNode
  withDropdownUser?: boolean
  bgColorClass: string
}

export default function BaseNav({
  className = '',
  classNameChildren = '',
  children,
  withDropdownUser = true,
  bgColorClass,
}: BaseNavProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className={`px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4 lg:px-6 lg:py-4 xl:px-8 xl:py-4 w-full ${className}`}>
      <div
        className={`flex items-center justify-between ${bgColorClass}
                    rounded-2xl lg:rounded-full
                    px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-2 lg:px-10 lg:py-3 xl:px-16 xl:py-3
                    text-white shadow-lg shadow-black/20`}
      >
        {/* Botón Menú Hamburguesa - Solo móvil/tablet */}
        <button
          onClick={() => setDrawerOpen(true)}
          className='lg:hidden flex items-center justify-center
                     p-2 hover:bg-white/20 rounded-lg transition-all active:scale-95'
          aria-label='Abrir menú'
        >
          <HiMenuAlt3 className='text-2xl sm:text-3xl' />
        </button>

        {/* Menú Desktop - Solo desktop */}
        <div
          className={`${classNameChildren} hidden lg:flex justify-around items-center
                      gap-8 xl:gap-16 ${withDropdownUser ? '' : 'w-full'}`}
        >
          {children}
        </div>

        {/* Usuario Dropdown */}
        {withDropdownUser && <DropdownUser />}
      </div>

      {/* Drawer para móvil/tablet */}
      <Drawer
        title={
          <div className='flex items-center justify-between'>
            <span className='text-lg font-bold'>Menú</span>
            <button
              onClick={() => setDrawerOpen(false)}
              className='lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-all'
            >
              <IoClose className='text-2xl' />
            </button>
          </div>
        }
        placement='left'
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={280}
        closeIcon={null}
        className='lg:hidden'
        styles={{
          body: {
            padding: '12px',
          },
        }}
      >
        <div className='flex flex-col gap-3'>
          {children}
        </div>
      </Drawer>
    </div>
  )
}
