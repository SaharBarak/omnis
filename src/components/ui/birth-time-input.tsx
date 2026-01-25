'use client'

import { useState, useEffect } from 'react'
import { Input } from './input'
import { Label } from './label'
import { cn } from '@/lib/utils'

interface BirthTimeInputProps {
  value: string | null
  onChange: (value: string | null) => void
  disabled?: boolean
  className?: string
}

export function BirthTimeInput({ value, onChange, disabled, className }: BirthTimeInputProps) {
  const [isUnknown, setIsUnknown] = useState(value === null)
  const [timeValue, setTimeValue] = useState(value || '')

  useEffect(() => {
    // Sync external value changes
    if (value === null) {
      setIsUnknown(true)
      setTimeValue('')
    } else {
      setIsUnknown(false)
      setTimeValue(value)
    }
  }, [value])

  const handleUnknownChange = (checked: boolean) => {
    setIsUnknown(checked)
    if (checked) {
      onChange(null)
      setTimeValue('')
    } else {
      onChange(timeValue || null)
    }
  }

  const handleTimeChange = (newTime: string) => {
    setTimeValue(newTime)
    if (!isUnknown) {
      onChange(newTime || null)
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            type="time"
            value={timeValue}
            onChange={(e) => handleTimeChange(e.target.value)}
            disabled={disabled || isUnknown}
            className={cn(isUnknown && 'opacity-50')}
            placeholder="HH:MM"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isUnknown}
            onChange={(e) => handleUnknownChange(e.target.checked)}
            disabled={disabled}
            className="h-4 w-4 rounded border-gray-300"
          />
          Unknown
        </label>
      </div>
      <p className="text-xs text-muted-foreground">
        Birth time is required for accurate Human Design and Astrology calculations.
      </p>
    </div>
  )
}
