import InfoTooltip from '~/components/others/info-tooltip'

interface LabelBaseProps {
  label: React.ReactNode
  className?: string
  classNameLabel?: string
  children: React.ReactNode
  infoTooltip?: React.ReactNode
}

export default function LabelBase({
  label,
  children,
  className = '',
  classNameLabel = '',
  infoTooltip,
}: LabelBaseProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className='flex items-center gap-2'>
        <label
          className={`text-slate-600 font-semibold text-nowrap ${classNameLabel}`}
        >
          {label}
        </label>
        {infoTooltip && <InfoTooltip title={infoTooltip} />}
      </div>
      {children}
    </div>
  )
}
