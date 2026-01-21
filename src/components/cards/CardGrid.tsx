import type { ReactNode } from 'react'

export interface CardGridProps {
  children: ReactNode
}

export function CardGrid({ children }: CardGridProps) {
  return (
    <div className="card-grid grid grid-cols-[repeat(auto-fit,minmax(148mm,1fr))] gap-8 justify-items-center p-4 print:block print:p-0">
      {children}
    </div>
  )
}
