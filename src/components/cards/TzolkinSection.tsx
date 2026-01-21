import { dateToTzolkin } from '@/lib/calculations/tzolkin'
import { SealIcon } from './SealIcon'

export interface TzolkinSectionProps {
  date: string
}

export function TzolkinSection({ date }: TzolkinSectionProps) {
  const { daySign, tone } = dateToTzolkin(date)

  return (
    <section className="tzolkin-section pt-4">
      <h3 className="text-center text-sm font-medium text-muted-foreground mb-4">
        לפי הצולקין / According to the Tzolkin
      </h3>

      <div className="flex items-center justify-center gap-4">
        <SealIcon sealNumber={daySign.number} size="lg" system="tzolkin" />

        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold">
            {tone} {daySign.yucatec}
          </span>
          <span className="text-base text-muted-foreground">
            {daySign.english} — {daySign.hebrew}
          </span>
        </div>
      </div>
    </section>
  )
}
