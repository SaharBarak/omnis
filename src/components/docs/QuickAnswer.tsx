export function QuickAnswer({
  question,
  answer,
}: {
  question: string
  answer: string
}) {
  return (
    <section
      className="mb-12 p-6 rounded-xl border border-primary/20 bg-primary/5"
      itemScope
      itemType="https://schema.org/Question"
    >
      <div className="text-xs uppercase tracking-[0.15em] text-primary mb-2">Quick Answer</div>
      <h2
        className="text-lg font-heading text-foreground mb-3"
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
