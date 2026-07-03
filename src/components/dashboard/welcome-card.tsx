'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sparkles, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WelcomeCardProps {
  className?: string
}

export function WelcomeCard({ className }: WelcomeCardProps) {
  return (
    <div className={cn(
      'surface-card p-6 border-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent',
      className
    )}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Welcome to OmnisX</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1">
            Begin your symbolic journey
          </h2>
          <p className="text-muted-foreground text-sm max-w-md">
            Start by adding yourself and the people in your life to discover unique Galactic Signatures and explore the connections between you.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button asChild size="default" className="gap-2">
            <Link href="/app/people">
              <Plus className="w-4 h-4" />
              Add First Person
            </Link>
          </Button>
          <Button asChild variant="outline" size="default">
            <Link href="/app/profile">Complete Profile</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
