import p from './people.module.css'
import type { Appearance } from '../site/appearance'
import site from '../site/site.module.css'
import { Loading, Skeleton } from '../site/states'
import f from '@/components/bento-v2/frame/frame.module.css'

/** The head and the figure in outline, while the server draws a map: centred on the bento site, on panels in v2. */
export function MapPageSkeleton({ label, appearance = 'bento' }: { readonly label: string; readonly appearance?: Appearance }) {
  const framed = appearance === 'frame'
  return (
    <Loading label={label}>
      <div className={framed ? site.frameStack : undefined}>
        <div className={framed ? `${f.panel} ${f.pad} ${site.frameHead}` : `${site.page} ${site.pageHead}`} aria-hidden>
          <div className={framed ? site.frameHead : site.sectionHead}>
            <Skeleton width={90} height={12} />
            <Skeleton width="min(100%, 420px)" height={44} />
            <Skeleton width="min(100%, 560px)" height={14} />
          </div>
        </div>
        <div className={framed ? `${f.panel} ${f.pad}` : site.page} aria-hidden>
          <div className={p.figureSkeleton}>
            <Skeleton height="100%" style={{ borderRadius: 'var(--radius-stage)' }} />
          </div>
        </div>
      </div>
    </Loading>
  )
}
