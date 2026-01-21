import { SealIcon } from './SealIcon'
import type { Kin, SealNumber } from '@/core/types'
import { kinToSeal } from '@/lib/calculations/dreamspell'
import { calculateOracle } from '@/lib/calculations/oracle'

export interface OracleMapProps {
  kin: Kin
}

export function OracleMap({ kin }: OracleMapProps) {
  const seal: SealNumber = kinToSeal(kin)
  const oracle = calculateOracle(kin)

  return (
    <div
      className="oracle-map grid grid-cols-3 grid-rows-3 gap-1 w-[180px] h-[180px] mx-auto"
      role="img"
      aria-label="Oracle map"
    >
      {/* Row 1: Guide (top center) */}
      <div className="col-start-2 row-start-1 flex flex-col items-center justify-center">
        <SealIcon sealNumber={oracle.guide} size="sm" />
        <span className="text-xs text-muted-foreground mt-1">Guide</span>
      </div>

      {/* Row 2: Antipode (left), Kin (center), Analog (right) */}
      <div className="col-start-1 row-start-2 flex flex-col items-center justify-center">
        <SealIcon sealNumber={oracle.antipode} size="sm" />
        <span className="text-xs text-muted-foreground mt-1">Antipode</span>
      </div>

      <div className="col-start-2 row-start-2 flex flex-col items-center justify-center">
        <SealIcon sealNumber={seal} size="lg" />
      </div>

      <div className="col-start-3 row-start-2 flex flex-col items-center justify-center">
        <SealIcon sealNumber={oracle.analog} size="sm" />
        <span className="text-xs text-muted-foreground mt-1">Analog</span>
      </div>

      {/* Row 3: Occult (bottom center) */}
      <div className="col-start-2 row-start-3 flex flex-col items-center justify-center">
        <SealIcon sealNumber={oracle.occult} size="sm" />
        <span className="text-xs text-muted-foreground mt-1">Occult</span>
      </div>
    </div>
  )
}
