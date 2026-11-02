import p from './people.module.css'
import site from '../site/site.module.css'
import { Loading, Skeleton } from '../site/states'

/** The centred head and the figure in outline, while the server draws a map. */
export function MapPageSkeleton({ label }: { readonly label: string }) {
  return (
    <Loading label={label}>
      <div className={`${site.page} ${site.pageHead}`} aria-hidden>
        <div className={site.sectionHead}>
          <Skeleton width={90} height={12} />
          <Skeleton width="min(100%, 420px)" height={44} />
          <Skeleton width="min(100%, 560px)" height={14} />
        </div>
      </div>
      <div className={site.page} aria-hidden>
        <div className={p.figureSkeleton}>
          <Skeleton height="100%" style={{ borderRadius: 'var(--radius-stage)' }} />
        </div>
      </div>
    </Loading>
  )
}
