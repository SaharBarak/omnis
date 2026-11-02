import { DocumentPage } from './document-page'
import { RichText } from './rich-text'
import { siteHrefForLive } from '@/lib/site/routes'
import { numberedHeading, updatedLabel, type Block, type LegalDoc } from '@/lib/site/legal'

function LegalBlock({ block }: { readonly block: Block }) {
  if (block.kind === 'p') {
    return (
      <p>
        <RichText run={block.content} resolveHref={siteHrefForLive} />
      </p>
    )
  }
  return (
    <ul>
      {block.items.map((item, index) => (
        <li key={index}>
          <RichText run={item} resolveHref={siteHrefForLive} />
        </li>
      ))}
    </ul>
  )
}

/** A policy from the legal data in the T7 template: the same text the live page shows. */
export function LegalDocument({ doc }: { readonly doc: LegalDoc }) {
  return (
    <DocumentPage
      eyebrow="Legal"
      title={doc.title}
      updated={updatedLabel(doc)}
      sections={doc.sections.map((section, index) => ({
        id: `section-${index + 1}`,
        title: numberedHeading(doc, index),
        children: section.blocks.map((block, blockIndex) => <LegalBlock key={blockIndex} block={block} />),
      }))}
    />
  )
}
