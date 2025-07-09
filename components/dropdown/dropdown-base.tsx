'use client'

import { Dropdown, DropdownProps } from 'antd'
import { useState } from 'react'
import { FaAngleDown } from 'react-icons/fa'

interface DropdownBaseProps extends DropdownProps {
  classNameDiv?: string
}

export default function DropdownBase({
  classNameDiv,
  children,
  ...props
}: DropdownBaseProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <Dropdown open={isMenuOpen} onOpenChange={setIsMenuOpen} {...props}>
      <div className={`flex items-center gap-3 cursor-pointer ${classNameDiv}`}>
        {children}
        <FaAngleDown
          className={`transition-all ${isMenuOpen ? 'rotate-180' : ''}`}
        />
      </div>
    </Dropdown>
  )
}
