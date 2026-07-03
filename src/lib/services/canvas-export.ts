// Canvas Export Service for OmnisX Phase 4
// Provides functionality to export canvas to PNG, JPEG, SVG, PDF

import type { ExportFormat, ExportOptions } from '@/lib/types/board'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

// ============================================================================
// TYPES
// ============================================================================

interface ExportResult {
  blob: Blob
  filename: string
  mimeType: string
}

interface CanvasExportOptions {
  format: ExportFormat
  scale?: number
  background?: boolean
  quality?: number
  canvasElement?: HTMLElement | null
  filename?: string
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

/**
 * Export the canvas to the specified format
 */
export async function exportCanvas(options: CanvasExportOptions): Promise<ExportResult> {
  const {
    format,
    scale = 1,
    background = true,
    quality = 0.9,
    canvasElement,
    filename = `board-export-${Date.now()}`,
  } = options

  if (!canvasElement) {
    throw new Error('Canvas element is required for export')
  }

  // Find the React Flow viewport element
  const viewport = canvasElement.querySelector('.react-flow__viewport') as HTMLElement
  if (!viewport) {
    throw new Error('Could not find React Flow viewport')
  }

  // Get the bounding box of all nodes
  const bounds = calculateBounds(canvasElement)

  switch (format) {
    case 'png':
      return exportToPng(viewport, bounds, scale, background, filename)
    case 'jpeg':
      return exportToJpeg(viewport, bounds, scale, background, quality, filename)
    case 'svg':
      return exportToSvg(viewport, bounds, background, filename)
    case 'pdf':
      return exportToPdf(viewport, bounds, scale, background, filename)
    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
}

/**
 * Trigger download of the exported file
 */
export function downloadExport(result: ExportResult): void {
  const url = URL.createObjectURL(result.blob)
  const link = document.createElement('a')
  link.href = url
  link.download = result.filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Get a data URL for the exported canvas
 */
export async function exportToDataUrl(options: CanvasExportOptions): Promise<string> {
  const result = await exportCanvas(options)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(result.blob)
  })
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

function calculateBounds(canvasElement: HTMLElement): Bounds {
  const nodes = canvasElement.querySelectorAll('.react-flow__node')

  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 800, height: 600 }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  nodes.forEach(node => {
    const rect = (node as HTMLElement).getBoundingClientRect()
    const style = window.getComputedStyle(node)
    const transform = style.transform

    // Extract translate values from transform
    let translateX = 0
    let translateY = 0
    if (transform && transform !== 'none') {
      const match = transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/)
      if (match) {
        translateX = parseFloat(match[1])
        translateY = parseFloat(match[2])
      }
    }

    const x = translateX
    const y = translateY
    const width = rect.width
    const height = rect.height

    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x + width)
    maxY = Math.max(maxY, y + height)
  })

  // Add padding
  const padding = 50
  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  }
}

async function exportToPng(
  viewport: HTMLElement,
  bounds: Bounds,
  scale: number,
  background: boolean,
  filename: string
): Promise<ExportResult> {
  const canvas = await renderToCanvas(viewport, bounds, scale, background)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) {
          resolve({
            blob,
            filename: `${filename}.png`,
            mimeType: 'image/png',
          })
        } else {
          reject(new Error('Failed to create PNG blob'))
        }
      },
      'image/png'
    )
  })
}

async function exportToJpeg(
  viewport: HTMLElement,
  bounds: Bounds,
  scale: number,
  background: boolean,
  quality: number,
  filename: string
): Promise<ExportResult> {
  const canvas = await renderToCanvas(viewport, bounds, scale, background || true) // JPEG always needs background

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) {
          resolve({
            blob,
            filename: `${filename}.jpg`,
            mimeType: 'image/jpeg',
          })
        } else {
          reject(new Error('Failed to create JPEG blob'))
        }
      },
      'image/jpeg',
      quality
    )
  })
}

async function exportToSvg(
  viewport: HTMLElement,
  bounds: Bounds,
  background: boolean,
  filename: string
): Promise<ExportResult> {
  // Create SVG from the viewport
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  svg.setAttribute('width', bounds.width.toString())
  svg.setAttribute('height', bounds.height.toString())
  svg.setAttribute('viewBox', `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`)

  // Add background if requested
  if (background) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    rect.setAttribute('x', bounds.x.toString())
    rect.setAttribute('y', bounds.y.toString())
    rect.setAttribute('width', bounds.width.toString())
    rect.setAttribute('height', bounds.height.toString())
    rect.setAttribute('fill', '#ffffff')
    svg.appendChild(rect)
  }

  // Clone viewport content and convert to SVG foreignObject
  const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')
  foreignObject.setAttribute('x', bounds.x.toString())
  foreignObject.setAttribute('y', bounds.y.toString())
  foreignObject.setAttribute('width', bounds.width.toString())
  foreignObject.setAttribute('height', bounds.height.toString())

  const clonedViewport = viewport.cloneNode(true) as HTMLElement
  clonedViewport.style.transform = `translate(${-bounds.x}px, ${-bounds.y}px)`
  foreignObject.appendChild(clonedViewport)
  svg.appendChild(foreignObject)

  // Serialize to string
  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(svg)
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })

  return {
    blob,
    filename: `${filename}.svg`,
    mimeType: 'image/svg+xml',
  }
}

async function exportToPdf(
  viewport: HTMLElement,
  bounds: Bounds,
  scale: number,
  background: boolean,
  filename: string
): Promise<ExportResult> {
  const canvas = await renderToCanvas(viewport, bounds, scale, background)

  // Determine PDF orientation based on canvas dimensions
  const orientation = bounds.width > bounds.height ? 'landscape' : 'portrait'

  // Create PDF with dimensions matching the canvas
  const pdf = new jsPDF({
    orientation,
    unit: 'px',
    format: [bounds.width * scale, bounds.height * scale],
  })

  // Add the canvas as an image to the PDF
  const imgData = canvas.toDataURL('image/png')
  pdf.addImage(imgData, 'PNG', 0, 0, bounds.width * scale, bounds.height * scale)

  // Get PDF as blob
  const blob = pdf.output('blob')

  return {
    blob,
    filename: `${filename}.pdf`,
    mimeType: 'application/pdf',
  }
}

async function renderToCanvas(
  viewport: HTMLElement,
  bounds: Bounds,
  scale: number,
  background: boolean
): Promise<HTMLCanvasElement> {
  return html2canvas(viewport, {
    scale,
    backgroundColor: background ? '#ffffff' : null,
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    useCORS: true,
    allowTaint: true,
  })
}

// ============================================================================
// EXPORT DIALOG OPTIONS
// ============================================================================

export const EXPORT_FORMAT_OPTIONS: { value: ExportFormat; label: string; description: string }[] = [
  { value: 'png', label: 'PNG', description: 'תמונה באיכות גבוהה עם שקיפות' },
  { value: 'jpeg', label: 'JPEG', description: 'תמונה דחוסה, גודל קובץ קטן' },
  { value: 'svg', label: 'SVG', description: 'וקטור, איכות ללא אובדן' },
  { value: 'pdf', label: 'PDF', description: 'מסמך להדפסה' },
]

export const EXPORT_SCALE_OPTIONS: { value: number; label: string }[] = [
  { value: 0.5, label: '50%' },
  { value: 1, label: '100%' },
  { value: 2, label: '200%' },
  { value: 3, label: '300%' },
]

const canvasExport = {
  exportCanvas,
  downloadExport,
  exportToDataUrl,
  EXPORT_FORMAT_OPTIONS,
  EXPORT_SCALE_OPTIONS,
}

export default canvasExport
