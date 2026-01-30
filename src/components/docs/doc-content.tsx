'use client'

import { cn } from '@/lib/utils'

// Typography components for documentation
export function DocH1({ children, id, className }: { children: React.ReactNode; id?: string; className?: string }) {
  return (
    <h1
      id={id}
      className={cn(
        'text-3xl sm:text-4xl font-heading text-foreground mb-4 scroll-mt-24',
        className
      )}
    >
      {children}
    </h1>
  )
}

export function DocH2({ children, id, className }: { children: React.ReactNode; id?: string; className?: string }) {
  return (
    <h2
      id={id}
      className={cn(
        'text-2xl font-heading text-foreground mt-12 mb-4 pb-2 border-b border-border scroll-mt-24',
        className
      )}
    >
      {children}
    </h2>
  )
}

export function DocH3({ children, id, className }: { children: React.ReactNode; id?: string; className?: string }) {
  return (
    <h3
      id={id}
      className={cn(
        'text-xl font-heading text-foreground mt-8 mb-3 scroll-mt-24',
        className
      )}
    >
      {children}
    </h3>
  )
}

export function DocH4({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h4 className={cn('text-lg font-medium text-foreground mt-6 mb-2', className)}>
      {children}
    </h4>
  )
}

export function DocParagraph({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('text-muted-foreground leading-relaxed mb-4', className)}>
      {children}
    </p>
  )
}

export function DocLead({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('text-lg text-muted-foreground leading-relaxed mb-6', className)}>
      {children}
    </p>
  )
}

export function DocBlockquote({ children, author, className }: { children: React.ReactNode; author?: string; className?: string }) {
  return (
    <blockquote className={cn('my-6 pl-6 border-l-2 border-primary/50 italic', className)}>
      <p className="text-foreground/80 mb-2">{children}</p>
      {author && <cite className="text-sm text-muted-foreground not-italic">— {author}</cite>}
    </blockquote>
  )
}

export function DocList({ items, ordered, className }: { items: React.ReactNode[]; ordered?: boolean; className?: string }) {
  const Tag = ordered ? 'ol' : 'ul'
  return (
    <Tag className={cn(
      'my-4 ml-6 space-y-2',
      ordered ? 'list-decimal' : 'list-disc',
      className
    )}>
      {items.map((item, i) => (
        <li key={i} className="text-muted-foreground leading-relaxed">{item}</li>
      ))}
    </Tag>
  )
}

export function DocCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('earth-card bg-card p-6 my-6', className)}>
      {children}
    </div>
  )
}

export function DocGrid({ children, cols = 2, className }: { children: React.ReactNode; cols?: 2 | 3 | 4; className?: string }) {
  const gridCols = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4'
  }
  return (
    <div className={cn('grid gap-4 my-6', gridCols[cols], className)}>
      {children}
    </div>
  )
}

export function DocInfoBox({
  title,
  children,
  variant = 'info',
  className
}: {
  title?: string
  children: React.ReactNode
  variant?: 'info' | 'warning' | 'tip' | 'note'
  className?: string
}) {
  const variants = {
    info: 'bg-accent/10 border-accent/30 text-accent',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
    tip: 'bg-secondary/10 border-secondary/30 text-secondary',
    note: 'bg-muted border-border text-muted-foreground'
  }

  const icons = {
    info: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
    ),
    warning: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />
      </svg>
    ),
    tip: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 18h6M10 22h4M12 2v1M4.22 4.22l.71.71M1 12h1M4.22 19.78l.71-.71M12 17a5 5 0 100-10 5 5 0 000 10z" />
      </svg>
    ),
    note: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10,9 9,9 8,9" />
      </svg>
    )
  }

  return (
    <div className={cn('my-6 p-4 rounded-lg border', variants[variant], className)}>
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-0.5">{icons[variant]}</div>
        <div>
          {title && <div className="font-medium mb-1">{title}</div>}
          <div className="text-sm opacity-90">{children}</div>
        </div>
      </div>
    </div>
  )
}

export function DocTable({
  headers,
  rows,
  className
}: {
  headers: string[]
  rows: (string | React.ReactNode)[][]
  className?: string
}) {
  return (
    <div className={cn('my-6 overflow-x-auto', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {headers.map((header, i) => (
              <th key={i} className="text-left py-3 px-4 font-medium text-foreground">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="py-3 px-4 text-muted-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function DocBadge({ children, color = 'default', className }: {
  children: React.ReactNode
  color?: 'default' | 'red' | 'blue' | 'yellow' | 'green' | 'purple'
  className?: string
}) {
  const colors = {
    default: 'bg-muted text-muted-foreground',
    red: 'bg-red-500/10 text-red-600 dark:text-red-400',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    yellow: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
  }

  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded text-xs font-medium', colors[color], className)}>
      {children}
    </span>
  )
}

export function DocDivider({ className }: { className?: string }) {
  return <hr className={cn('my-8 border-border', className)} />
}

// Navigation between pages
export function DocNavigation({
  prev,
  next
}: {
  prev?: { title: string; href: string }
  next?: { title: string; href: string }
}) {
  return (
    <div className="flex justify-between items-center mt-16 pt-8 border-t border-border">
      {prev ? (
        <a href={prev.href} className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <svg viewBox="0 0 24 24" className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <div>
            <div className="text-xs text-muted-foreground">Previous</div>
            <div className="font-medium">{prev.title}</div>
          </div>
        </a>
      ) : <div />}

      {next ? (
        <a href={next.href} className="group flex items-center gap-2 text-right text-muted-foreground hover:text-foreground transition-colors">
          <div>
            <div className="text-xs text-muted-foreground">Next</div>
            <div className="font-medium">{next.title}</div>
          </div>
          <svg viewBox="0 0 24 24" className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      ) : <div />}
    </div>
  )
}

// Table of contents for current page
export function DocTableOfContents({
  items,
  className
}: {
  items: { id: string; title: string; level?: number }[]
  className?: string
}) {
  return (
    <nav className={cn('space-y-1', className)}>
      <div className="text-sm font-medium text-foreground mb-3">On this page</div>
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={cn(
            'block text-sm text-muted-foreground hover:text-foreground transition-colors py-1',
            item.level === 3 && 'pl-4'
          )}
        >
          {item.title}
        </a>
      ))}
    </nav>
  )
}
