import DropdownUser from '~/app/ui/_components/nav/dropdown-user'

interface BaseNavProps {
  className?: string
  classNameChildren?: string
  children: React.ReactNode
  withDropdownUser?: boolean
}

export default function BaseNav({
  className = '',
  classNameChildren = '',
  children,
  withDropdownUser = true,
}: BaseNavProps) {
  return (
    <div className={`px-8 py-4 w-full ${className}`}>
      <div
        className={`flex items-center justify-between bg-emerald-600 rounded-full px-16 py-3 text-white shadow-lg shadow-black/20`}
      >
        <div
          className={`${classNameChildren} flex justify-around items-center gap-16 ${
            withDropdownUser ? '' : 'w-full'
          }`}
        >
          {children}
        </div>
        {withDropdownUser && <DropdownUser />}
      </div>
    </div>
  )
}
