import Link from 'next/link'
import { RichText } from './rich-text'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { numberedHeading, updatedLabel, type Block, type LegalDoc } from '@/lib/site/legal'

interface LiveBlockProps {
  readonly block: Block
  readonly listClassName?: string
}

function LiveBlock({ block, listClassName }: LiveBlockProps) {
  if (block.kind === 'p') {
    return (
      <p>
        <RichText run={block.content} />
      </p>
    )
  }
  return (
    <ul className={listClassName}>
      {block.items.map((item, index) => (
        <li key={index}>
          <RichText run={item} />
        </li>
      ))}
    </ul>
  )
}

export interface LiveLegalCardProps {
  readonly doc: LegalDoc
  readonly listClassName?: string
  /** Renders the "Back to Login" footer when set. */
  readonly backHref?: string
}

/**
 * The live site's legal page (src/app/{terms,privacy,refund}): the same Card
 * markup those pages carried inline, drawn from the legal data.
 */
export function LiveLegalCard({ doc, listClassName, backHref }: LiveLegalCardProps) {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{doc.title}</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert">
            <p className="text-muted-foreground">{`Last updated: ${updatedLabel(doc)}`}</p>
            {doc.sections.map((section, index) => (
              <LiveSection key={section.heading} doc={doc} index={index} listClassName={listClassName} />
            ))}
            {backHref ? (
              <div className="mt-8 pt-6 border-t">
                <Link href={backHref} className="text-primary hover:underline">
                  &larr; Back to Login
                </Link>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface LiveSectionProps {
  readonly doc: LegalDoc
  readonly index: number
  readonly listClassName?: string
}

function LiveSection({ doc, index, listClassName }: LiveSectionProps) {
  return (
    <>
      <h2 className="text-lg font-semibold mt-6 mb-3">{numberedHeading(doc, index)}</h2>
      {doc.sections[index].blocks.map((block, blockIndex) => (
        <LiveBlock key={blockIndex} block={block} listClassName={listClassName} />
      ))}
    </>
  )
}
