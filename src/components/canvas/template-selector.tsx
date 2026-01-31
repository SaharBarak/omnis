'use client'

import { useState, useCallback } from 'react'
import { X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { BOARD_TEMPLATE_CONFIGS, type BoardTemplateConfig } from '@/lib/services/board-templates'
import type { BoardTemplate } from '@/lib/types/board'

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
      <div className="text-4xl mb-3">{template.icon}</div>

      {/* Name */}
      <h3 className="font-semibold text-base mb-1">{template.name}</h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground">{template.description}</p>

      {/* Features */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {template.autoPopulate && (
          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
            Auto
          </span>
        )}
        {template.layout && template.layout !== 'free' && (
          <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
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
        {templates.map(template => (
          <button
            key={template.id}
            type="button"
            className={`p-3 text-center border rounded-lg transition-all ${
              value === template.id
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => onChange(template.id)}
          >
            <div className="text-2xl mb-1">{template.icon}</div>
            <div className="text-xs font-medium">{template.name}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default TemplateSelector
