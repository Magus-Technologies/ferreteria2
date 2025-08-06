import InfoTooltip from '~/components/others/info-tooltip'

interface LabelBaseProps {
  label: React.ReactNode
  className?: string
  classNames?: {
    label?: string
    labelParent?: string
  }
  children: React.ReactNode
  infoTooltip?: React.ReactNode
  orientation?: 'row' | 'column'
}

export default function LabelBase({
  label,
  children,
  className = '',
  classNames = {},
  infoTooltip,
  orientation = 'row',
}: LabelBaseProps) {
  const { label: labelClass = '', labelParent = '' } = classNames
  return (
    <div
      className={`flex ${
        orientation === 'column' ? 'flex-col items-start' : 'items-center'
      } gap-2 ${className}`}
    >
      <div className={`flex items-center gap-2 ${labelParent}`}>
        <label
          className={`text-slate-600 font-semibold text-nowrap ${labelClass}`}
        >
          {label}
        </label>
        {infoTooltip && (
          <InfoTooltip
            title={
              <div className='text-balance text-center'>{infoTooltip}</div>
            }
          />
        )}
      </div>
      {children}
    </div>
  )
}
