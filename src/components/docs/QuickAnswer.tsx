export function QuickAnswer({
  question,
  answer,
}: {
  question: string
  answer: string
}) {
  return (
    <section
      className="mb-12 rounded-r-xl bg-muted/30 py-5 pl-6 pr-6"
      style={{ borderLeft: '3px solid hsl(var(--doc-accent, var(--primary)))' }}
      itemScope
      itemType="https://schema.org/Question"
    >
      <div
        className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em]"
        style={{ color: 'hsl(var(--doc-accent-ink, var(--primary)))' }}
      >
        Quick answer
      </div>
      <h2
        className="text-lg font-display text-foreground mb-3"
        itemProp="name"
      >
        {question}
      </h2>
      <div
        itemScope
        itemType="https://schema.org/Answer"
        itemProp="acceptedAnswer"
      >
        <p
          className="text-muted-foreground leading-relaxed"
          itemProp="text"
        >
          {answer}
        </p>
      </div>
    </section>
  )
}
