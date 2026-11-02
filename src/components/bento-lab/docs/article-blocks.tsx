import { site } from '../site'
import d from './docs.module.css'
import type { ArticleBlock, ArticleCard, Prose } from './library'

export function ProseView({ prose }: { readonly prose: readonly Prose[] }) {
  return prose.map((part, index) =>
    part.kind === 'p' ? (
      <p key={index}>{part.text}</p>
    ) : (
      <ul key={index}>
        {part.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    ),
  )
}

function RecordCard({ card }: { readonly card: ArticleCard }) {
  return (
    <article className={`${site.card} ${site.cardTight} ${d.recordCard}`}>
      <header className={d.recordHead}>
        <h4 className={d.recordTitle}>{card.title}</h4>
        {card.badges.map((badge) => (
          <span key={badge} className={site.chip}>
            {badge}
          </span>
        ))}
      </header>
      {card.facts.length > 0 && (
        <dl className={d.facts}>
          {card.facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {card.body.map((part, index) => (
        <div key={index} className={d.recordBody}>
          {part.label && <h5 className={d.recordLabel}>{part.label}</h5>}
          <ProseView prose={part.prose} />
        </div>
      ))}
      {card.chips.length > 0 && (
        <div className={d.chips}>
          {card.chips.map((chip) => (
            <span key={chip} className={site.chip}>
              {chip}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}

/** One block of an article: prose, a quote, steps, a table or a set of record cards. */
export function ArticleBlockView({ block }: { readonly block: ArticleBlock }) {
  switch (block.kind) {
    case 'prose':
      return (
        <div className={d.prose}>
          {block.label && <h3 className={d.blockLabel}>{block.label}</h3>}
          <ProseView prose={block.prose} />
        </div>
      )
    case 'lines':
      return (
        <figure className={`${d.prose} ${d.figure}`}>
          <figcaption className={d.blockLabel}>{block.label}</figcaption>
          <div className={d.lines}>
            {block.lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
        </figure>
      )
    case 'quote':
      return (
        <blockquote className={d.quote}>
          <p>{block.text}</p>
          <footer>{block.author}</footer>
        </blockquote>
      )
    case 'steps':
      return (
        <div className={d.prose}>
          <h3 className={d.blockLabel}>{block.label}</h3>
          <ol>
            {block.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
      )
    case 'table':
      return (
        <div>
          <h3 className={d.blockLabel}>{block.label}</h3>
          <div className={site.tableScroll} tabIndex={0} role="region" aria-label={block.label}>
            <table className={site.table}>
              <thead>
                <tr>
                  {block.columns.map((column, index) => (
                    <th key={index} scope="col">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, index) => (
                      <td key={index}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    case 'cards':
      return (
        <div>
          <h3 className={d.blockLabel}>{block.label}</h3>
          <div className={d.cards}>
            {block.cards.map((card, index) => (
              <RecordCard key={`${card.title}-${index}`} card={card} />
            ))}
          </div>
        </div>
      )
  }
}
