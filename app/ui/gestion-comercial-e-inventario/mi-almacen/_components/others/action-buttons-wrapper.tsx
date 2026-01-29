'use client'

import { ReactNode } from 'react'

interface ActionButtonsWrapperProps {
  children: ReactNode
}

export default function ActionButtonsWrapper({
  children,
}: ActionButtonsWrapperProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1">
      <style jsx>{`
        div::-webkit-scrollbar {
          height: 4px;
        }
        div::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        div::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
      {children}
    </div>
  )
}
