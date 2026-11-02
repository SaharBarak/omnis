import b from './blocks.module.css'
import { CloseScene } from './close-scene'
import { PixelVideo } from '../pixel-video'
import { PrimaryAction } from '../site/action'
import site from '../site/site.module.css'
import type { LabMedia } from '@/lib/data/lab-media'

/** The closing call over the portal artwork (storyboard 9): one line, one solid action. */
export function CloseCta({ media, title, body, href, action }: { readonly media: LabMedia; readonly title: string; readonly body: string; readonly href: string; readonly action: string }) {
  return (
    <section className={`${site.page} ${site.section}`} aria-labelledby="close-title">
      <CloseScene media={<PixelVideo media={media} />}>
        <div className={b.closeBody}>
          <h2 id="close-title" className={`${site.h2} ${b.closeTitle}`} data-close-line="">
            {title}
          </h2>
          <p className={`${site.lead} ${b.closeLead}`} data-close-line="">
            {body}
          </p>
          <PrimaryAction href={href} className={b.closeAction}>
            {action}
          </PrimaryAction>
        </div>
      </CloseScene>
    </section>
  )
}
