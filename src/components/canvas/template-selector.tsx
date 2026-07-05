'use client'

import { useState, useCallback } from 'react'
import {
  X,
  Check,
  File,
  Network,
  GitBranch,
  CalendarRange,
  User,
  Users,
  LayoutGrid,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { BOARD_TEMPLATE_CONFIGS, type BoardTemplateConfig } from '@/lib/services/board-templates'
import type { BoardTemplate } from '@/lib/types/board'

/** Icon per board template — replaces the emoji glyphs in the template config. */
export const TEMPLATE_ICONS: Record<BoardTemplate, LucideIcon> = {
  blank: File,
  'relationship-map': Network,
  'family-tree': GitBranch,
  'yearly-overview': CalendarRange,
  'personal-profile': User,
  'group-analysis': Users,
}

/** Fallback glyph for unknown/missing template ids. */
export const FALLBACK_TEMPLATE_ICON: LucideIcon = LayoutGrid

interface TemplateSelectorProps {
  open: boolean
  onClose: () => void
  onSelect: (template: BoardTemplate) => void
  title?: string
}

export function TemplateSelector({
  open,
  onClose,
  onSelect,
  title = 'Select Template',
}: TemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<BoardTemplate>('blank')

  const handleConfirm = useCallback(() => {
    onSelect(selectedTemplate)
    onClose()
  }, [selectedTemplate, onSelect, onClose])

  if (!open) return null

  const templates = Object.values(BOARD_TEMPLATE_CONFIGS)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-lg shadow-xl border w-[600px] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold" dir="ltr">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4" dir="ltr">
          <div className="grid grid-cols-2 gap-4">
            {templates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                selected={selectedTemplate === template.id}
                onSelect={() => setSelectedTemplate(template.id)}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            <Check className="h-4 w-4 mr-2" />
            Create Board
          </Button>
        </div>
      </div>
    </div>
  )
}

interface TemplateCardProps {
  template: BoardTemplateConfig
  selected: boolean
  onSelect: () => void
}

function TemplateCard({ template, selected, onSelect }: TemplateCardProps) {
  const Icon = TEMPLATE_ICONS[template.id] ?? FALLBACK_TEMPLATE_ICON
  return (
    <button
      type="button"
      className={`relative p-4 text-left border rounded-lg transition-all hover:shadow-md ${
        selected
          ? 'border-primary bg-primary/5 ring-2 ring-primary'
          : 'border-border hover:border-primary/50'
      }`}
      onClick={onSelect}
    >
      {/* Selection indicator */}
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>
      )}

      {/* Icon */}
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>

      {/* Name */}
      <h3 className="font-display font-semibold tracking-tight text-base mb-1">{template.name}</h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground">{template.description}</p>

      {/* Features */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {template.autoPopulate && (
          <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
            Auto
          </span>
        )}
        {template.layout && template.layout !== 'free' && (
          <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary border border-primary/20">
            {template.layout === 'hierarchical' ? 'Hierarchical' :
             template.layout === 'circular' ? 'Circular' :
             template.layout === 'force-directed' ? 'Dynamic' : template.layout}
          </span>
        )}
      </div>
    </button>
  )
}

// Inline template selector component for embedding in forms
interface InlineTemplateSelectorProps {
  value: BoardTemplate
  onChange: (template: BoardTemplate) => void
}

export function InlineTemplateSelector({ value, onChange }: InlineTemplateSelectorProps) {
  const templates = Object.values(BOARD_TEMPLATE_CONFIGS)

  return (
    <div className="space-y-3" dir="ltr">
      <Label className="text-sm font-medium">Template</Label>
      <div className="grid grid-cols-3 gap-2">
        {templates.map(template => {
          const Icon = TEMPLATE_ICONS[template.id] ?? FALLBACK_TEMPLATE_ICON
          return (
            <button
              key={template.id}
              type="button"
              className={`p-3 text-center border rounded-lg transition-all active:scale-[0.98] ${
                value === template.id
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => onChange(template.id)}
            >
              <Icon className="mx-auto mb-1 h-5 w-5 text-primary" aria-hidden="true" />
              <div className="text-xs font-medium">{template.name}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default TemplateSelector
