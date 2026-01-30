'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: 'people' | 'relationships' | 'groups' | 'boards' | 'cards' | 'predictions' | 'general'
  title: string
  description: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  className?: string
}

const illustrations: Record<string, JSX.Element> = {
  people: (
    <svg viewBox="0 0 200 160" className="w-full h-full" fill="none">
      {/* Background circles */}
      <circle cx="100" cy="80" r="60" fill="currentColor" className="text-primary/5" />
      <circle cx="100" cy="80" r="40" fill="currentColor" className="text-primary/10" />

      {/* Person silhouette */}
      <circle cx="100" cy="55" r="18" fill="currentColor" className="text-primary/40" />
      <path
        d="M70 110 Q70 85 100 85 Q130 85 130 110"
        fill="currentColor"
        className="text-primary/40"
      />

      {/* Plus icon */}
      <circle cx="145" cy="105" r="18" fill="currentColor" className="text-primary" />
      <path
        d="M145 97 v16 M137 105 h16"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="text-primary-foreground"
      />

      {/* Decorative elements */}
      <circle cx="50" cy="40" r="4" fill="currentColor" className="text-secondary/30" />
      <circle cx="160" cy="50" r="3" fill="currentColor" className="text-accent/30" />
      <circle cx="40" cy="100" r="2" fill="currentColor" className="text-primary/20" />
    </svg>
  ),
  relationships: (
    <svg viewBox="0 0 200 160" className="w-full h-full" fill="none">
      {/* Background */}
      <circle cx="100" cy="80" r="55" fill="currentColor" className="text-secondary/5" />

      {/* Two people */}
      <circle cx="70" cy="65" r="14" fill="currentColor" className="text-primary/40" />
      <path d="M50 100 Q50 80 70 80 Q90 80 90 100" fill="currentColor" className="text-primary/40" />

      <circle cx="130" cy="65" r="14" fill="currentColor" className="text-secondary/50" />
      <path d="M110 100 Q110 80 130 80 Q150 80 150 100" fill="currentColor" className="text-secondary/50" />

      {/* Heart connection */}
      <path
        d="M100 55 c-5-10 -20-10 -20 5 c0 15 20 25 20 25 s20-10 20-25 c0-15 -15-15 -20-5"
        fill="currentColor"
        className="text-destructive/40"
      />

      {/* Connection line */}
      <path
        d="M85 75 Q100 70 115 75"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="4 2"
        className="text-muted-foreground/30"
      />
    </svg>
  ),
  groups: (
    <svg viewBox="0 0 200 160" className="w-full h-full" fill="none">
      {/* Background */}
      <circle cx="100" cy="80" r="60" fill="currentColor" className="text-accent/5" />

      {/* Multiple people */}
      <g className="text-primary/30">
        <circle cx="100" cy="50" r="12" fill="currentColor" />
        <path d="M85 80 Q85 65 100 65 Q115 65 115 80" fill="currentColor" />
      </g>

      <g className="text-secondary/40">
        <circle cx="65" cy="75" r="10" fill="currentColor" />
        <path d="M52 100 Q52 88 65 88 Q78 88 78 100" fill="currentColor" />
      </g>

      <g className="text-accent/40">
        <circle cx="135" cy="75" r="10" fill="currentColor" />
        <path d="M122 100 Q122 88 135 88 Q148 88 148 100" fill="currentColor" />
      </g>

      {/* Connection lines */}
      <path
        d="M85 60 Q75 70 68 72 M115 60 Q125 70 132 72 M78 95 h44"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="3 2"
        className="text-muted-foreground/20"
      />

      {/* Circle encompassing */}
      <circle
        cx="100"
        cy="80"
        r="45"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="8 4"
        className="text-accent/30"
      />
    </svg>
  ),
  boards: (
    <svg viewBox="0 0 200 160" className="w-full h-full" fill="none">
      {/* Background */}
      <rect x="30" y="30" width="140" height="100" rx="12" fill="currentColor" className="text-muted/30" />

      {/* Grid lines */}
      <line x1="70" y1="30" x2="70" y2="130" stroke="currentColor" strokeWidth="1" className="text-border" />
      <line x1="130" y1="30" x2="130" y2="130" stroke="currentColor" strokeWidth="1" className="text-border" />
      <line x1="30" y1="70" x2="170" y2="70" stroke="currentColor" strokeWidth="1" className="text-border" />
      <line x1="30" y1="100" x2="170" y2="100" stroke="currentColor" strokeWidth="1" className="text-border" />

      {/* Cards/items */}
      <rect x="40" y="40" width="22" height="22" rx="4" fill="currentColor" className="text-primary/40" />
      <rect x="80" y="75" width="40" height="18" rx="4" fill="currentColor" className="text-secondary/40" />
      <rect x="140" y="105" width="22" height="18" rx="4" fill="currentColor" className="text-accent/40" />

      {/* Decorative elements */}
      <circle cx="55" cy="85" r="6" fill="currentColor" className="text-primary/20" />
      <circle cx="150" cy="50" r="4" fill="currentColor" className="text-secondary/20" />
    </svg>
  ),
  cards: (
    <svg viewBox="0 0 200 160" className="w-full h-full" fill="none">
      {/* Stacked cards */}
      <rect x="45" y="35" width="90" height="110" rx="8" fill="currentColor" className="text-muted/50" />
      <rect x="55" y="25" width="90" height="110" rx="8" fill="currentColor" stroke="currentColor" strokeWidth="1" className="text-card stroke-border" />
      <rect x="65" y="15" width="90" height="110" rx="8" fill="currentColor" stroke="currentColor" strokeWidth="1" className="text-card stroke-border" />

      {/* Card content */}
      <circle cx="110" cy="50" r="16" fill="currentColor" className="text-primary/30" />
      <rect x="85" y="75" width="50" height="6" rx="3" fill="currentColor" className="text-muted" />
      <rect x="95" y="88" width="30" height="4" rx="2" fill="currentColor" className="text-muted/60" />
      <rect x="90" y="100" width="40" height="4" rx="2" fill="currentColor" className="text-muted/40" />

      {/* Print icon hint */}
      <path
        d="M170 130 h-20 v-15 h20 v15 M155 115 v-8 h10 v8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-secondary/40"
      />
    </svg>
  ),
  predictions: (
    <svg viewBox="0 0 200 160" className="w-full h-full" fill="none">
      {/* Crystal ball / orb */}
      <circle cx="100" cy="75" r="45" fill="currentColor" className="text-accent/10" />
      <circle cx="100" cy="75" r="40" fill="currentColor" stroke="currentColor" strokeWidth="2" className="text-card stroke-accent/30" />

      {/* Inner glow */}
      <circle cx="100" cy="75" r="30" fill="currentColor" className="text-primary/5" />

      {/* Stars inside */}
      <path d="M90 65 l2 4 4 1 -3 3 1 4 -4-2 -4 2 1-4 -3-3 4-1 2-4" fill="currentColor" className="text-primary/40" />
      <path d="M110 80 l1.5 3 3 0.75 -2.25 2.25 0.75 3 -3-1.5 -3 1.5 0.75-3 -2.25-2.25 3-0.75 1.5-3" fill="currentColor" className="text-secondary/40" />
      <path d="M95 85 l1 2 2 0.5 -1.5 1.5 0.5 2 -2-1 -2 1 0.5-2 -1.5-1.5 2-0.5 1-2" fill="currentColor" className="text-accent/40" />

      {/* Base */}
      <ellipse cx="100" cy="125" rx="30" ry="8" fill="currentColor" className="text-muted" />
      <path d="M75 120 Q75 135 100 135 Q125 135 125 120 Q115 125 100 125 Q85 125 75 120" fill="currentColor" className="text-muted-foreground/20" />

      {/* Reflection */}
      <ellipse cx="85" cy="60" rx="8" ry="5" fill="currentColor" className="text-background/40" />
    </svg>
  ),
  general: (
    <svg viewBox="0 0 200 160" className="w-full h-full" fill="none">
      {/* Concentric circles */}
      <circle cx="100" cy="80" r="55" fill="currentColor" className="text-primary/5" />
      <circle cx="100" cy="80" r="40" fill="currentColor" className="text-primary/10" />
      <circle cx="100" cy="80" r="25" fill="currentColor" className="text-primary/15" />
      <circle cx="100" cy="80" r="10" fill="currentColor" className="text-primary/30" />

      {/* Radiating lines */}
      <g stroke="currentColor" strokeWidth="1" className="text-primary/20">
        <line x1="100" y1="25" x2="100" y2="45" />
        <line x1="100" y1="115" x2="100" y2="135" />
        <line x1="45" y1="80" x2="65" y2="80" />
        <line x1="135" y1="80" x2="155" y2="80" />
      </g>

      {/* Corner elements */}
      <circle cx="45" cy="35" r="5" fill="currentColor" className="text-secondary/20" />
      <circle cx="155" cy="35" r="4" fill="currentColor" className="text-accent/20" />
      <circle cx="45" cy="125" r="3" fill="currentColor" className="text-primary/20" />
      <circle cx="155" cy="125" r="6" fill="currentColor" className="text-secondary/15" />
    </svg>
  ),
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      {/* Illustration */}
      <div className="w-48 h-40 mb-6">
        {illustrations[icon]}
      </div>

      {/* Content */}
      <h3 className="text-xl font-heading text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-6">{description}</p>

      {/* Action */}
      {action && (
        action.href ? (
          <Button asChild className="rounded-xl">
            <Link href={action.href}>
              <svg viewBox="0 0 24 24" className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              {action.label}
            </Link>
          </Button>
        ) : (
          <Button onClick={action.onClick} className="rounded-xl">
            <svg viewBox="0 0 24 24" className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {action.label}
          </Button>
        )
      )}
    </div>
  )
}
