import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock html2canvas - returns a mock canvas
import html2canvas from 'html2canvas'

// Mock jsPDF
import jsPDF from 'jspdf'
import {
  exportCanvas,
  downloadExport,
  exportToDataUrl,
  EXPORT_FORMAT_OPTIONS,
  EXPORT_SCALE_OPTIONS,
} from './canvas-export'
vi.mock('html2canvas', () => ({
  default: vi.fn(),
}))
const mockJsPDFInstance = {
  addImage: vi.fn(),
  output: vi.fn().mockReturnValue(new Blob(['pdf-content'], { type: 'application/pdf' })),
}
vi.mock('jspdf', () => {
  return {
    default: class MockJsPDF {
      addImage = vi.fn()
      output = vi.fn().mockReturnValue(new Blob(['pdf-content'], { type: 'application/pdf' }))
    },
  }
})

// Mock URL API
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url')
const mockRevokeObjectURL = vi.fn()
global.URL.createObjectURL = mockCreateObjectURL
global.URL.revokeObjectURL = mockRevokeObjectURL

// Mock FileReader
class MockFileReader {
  result: string | null = null
  onloadend: (() => void) | null = null
  onerror: ((error: Error) => void) | null = null

  readAsDataURL(blob: Blob) {
    setTimeout(() => {
      this.result = `data:${blob.type};base64,mockbase64data`
      if (this.onloadend) this.onloadend()
    }, 0)
  }
}
global.FileReader = MockFileReader as unknown as typeof FileReader

// Mock canvas context
const mockCanvasContext = {
  fillStyle: '',
  fillRect: vi.fn(),
  drawImage: vi.fn(),
  getImageData: vi.fn(),
}

describe('Canvas Export Service', () => {
  let mockCanvasElement: HTMLElement
  let mockViewport: HTMLElement
  let mockNode: HTMLElement
  let originalCreateElement: typeof document.createElement

  beforeEach(() => {
    vi.clearAllMocks()

    // Save original createElement
    originalCreateElement = document.createElement.bind(document)

    // Setup html2canvas mock to return a canvas element
    const mockCanvas = originalCreateElement('canvas')
    mockCanvas.width = 800
    mockCanvas.height = 600
    mockCanvas.toBlob = vi.fn((callback: BlobCallback, type?: string) => {
      const blobType = type || 'image/png'
      callback(new Blob(['mock-image-data'], { type: blobType }))
    })
    mockCanvas.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,mockbase64data')
    vi.mocked(html2canvas).mockResolvedValue(mockCanvas)

    // Create mock DOM structure
    mockNode = document.createElement('div')
    mockNode.className = 'react-flow__node'
    Object.defineProperty(mockNode, 'getBoundingClientRect', {
      value: () => ({
        width: 200,
        height: 150,
        top: 100,
        left: 100,
        bottom: 250,
        right: 300,
      }),
    })

    mockViewport = document.createElement('div')
    mockViewport.className = 'react-flow__viewport'
    mockViewport.appendChild(mockNode)

    mockCanvasElement = document.createElement('div')
    mockCanvasElement.appendChild(mockViewport)

    // Mock window.getComputedStyle
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      transform: 'translate(100px, 50px)',
    } as CSSStyleDeclaration)

    // Mock canvas getContext to return a valid context
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName)
      if (tagName === 'canvas') {
        const canvasElement = element as HTMLCanvasElement
        canvasElement.getContext = vi.fn().mockReturnValue(mockCanvasContext)
        canvasElement.toBlob = vi.fn((callback: BlobCallback, type?: string) => {
          const blobType = type || 'image/png'
          callback(new Blob(['mock-image-data'], { type: blobType }))
        })
        canvasElement.width = 800
        canvasElement.height = 600
      }
      return element
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('exportCanvas', () => {
    describe('Input Validation', () => {
      it('should throw error when canvas element is missing', async () => {
        await expect(
          exportCanvas({
            format: 'png',
            canvasElement: null,
          })
        ).rejects.toThrow('Canvas element is required for export')
      })

      it('should throw error when viewport is not found', async () => {
        const emptyElement = originalCreateElement('div')
        await expect(
          exportCanvas({
            format: 'png',
            canvasElement: emptyElement,
          })
        ).rejects.toThrow('Could not find React Flow viewport')
      })

      it('should throw error for unsupported format', async () => {
        await expect(
          exportCanvas({
            format: 'bmp' as 'png',
            canvasElement: mockCanvasElement,
          })
        ).rejects.toThrow('Unsupported export format: bmp')
      })
    })

    describe('PNG Export', () => {
      it('should export to PNG with default options', async () => {
        const result = await exportCanvas({
          format: 'png',
          canvasElement: mockCanvasElement,
        })

        expect(result.filename).toMatch(/board-export-\d+\.png/)
        expect(result.mimeType).toBe('image/png')
        expect(result.blob).toBeInstanceOf(Blob)
      })

      it('should export to PNG with custom filename', async () => {
        const result = await exportCanvas({
          format: 'png',
          canvasElement: mockCanvasElement,
          filename: 'my-board',
        })

        expect(result.filename).toBe('my-board.png')
      })

      it('should export to PNG with custom scale', async () => {
        const result = await exportCanvas({
          format: 'png',
          canvasElement: mockCanvasElement,
          scale: 2,
        })

        expect(result.mimeType).toBe('image/png')
      })
    })

    describe('JPEG Export', () => {
      it('should export to JPEG', async () => {
        const result = await exportCanvas({
          format: 'jpeg',
          canvasElement: mockCanvasElement,
        })

        expect(result.filename).toMatch(/board-export-\d+\.jpg/)
        expect(result.mimeType).toBe('image/jpeg')
        expect(result.blob).toBeInstanceOf(Blob)
      })

      it('should export to JPEG with quality setting', async () => {
        const result = await exportCanvas({
          format: 'jpeg',
          canvasElement: mockCanvasElement,
          quality: 0.5,
        })

        expect(result.mimeType).toBe('image/jpeg')
      })
    })

    describe('SVG Export', () => {
      it('should export to SVG', async () => {
        const result = await exportCanvas({
          format: 'svg',
          canvasElement: mockCanvasElement,
        })

        expect(result.filename).toMatch(/board-export-\d+\.svg/)
        expect(result.mimeType).toBe('image/svg+xml')
        expect(result.blob).toBeInstanceOf(Blob)
      })

      it('should create SVG blob with correct MIME type', async () => {
        const result = await exportCanvas({
          format: 'svg',
          canvasElement: mockCanvasElement,
        })

        expect(result.blob.type).toBe('image/svg+xml;charset=utf-8')
      })

      it('should export SVG with background option', async () => {
        const result = await exportCanvas({
          format: 'svg',
          canvasElement: mockCanvasElement,
          background: true,
        })

        expect(result.mimeType).toBe('image/svg+xml')
        expect(result.blob).toBeInstanceOf(Blob)
      })

      it('should export SVG without background', async () => {
        const result = await exportCanvas({
          format: 'svg',
          canvasElement: mockCanvasElement,
          background: false,
        })

        expect(result.blob).toBeInstanceOf(Blob)
      })
    })

    describe('PDF Export', () => {
      it('should export to PDF', async () => {
        const result = await exportCanvas({
          format: 'pdf',
          canvasElement: mockCanvasElement,
        })

        expect(result.filename).toMatch(/board-export-\d+\.pdf/)
        expect(result.mimeType).toBe('application/pdf')
        expect(result.blob).toBeInstanceOf(Blob)
      })

      it('should export to PDF with custom filename', async () => {
        const result = await exportCanvas({
          format: 'pdf',
          canvasElement: mockCanvasElement,
          filename: 'my-pdf-export',
        })

        expect(result.filename).toBe('my-pdf-export.pdf')
        expect(result.mimeType).toBe('application/pdf')
      })

      it('should export PDF with scale option', async () => {
        const result = await exportCanvas({
          format: 'pdf',
          canvasElement: mockCanvasElement,
          scale: 2,
        })

        expect(result.mimeType).toBe('application/pdf')
        expect(result.blob).toBeInstanceOf(Blob)
      })

      it('should return data URL for PDF export', async () => {
        const dataUrl = await exportToDataUrl({
          format: 'pdf',
          canvasElement: mockCanvasElement,
        })

        expect(dataUrl).toContain('data:')
        expect(dataUrl).toContain('base64')
      })
    })

    describe('Bounds Calculation', () => {
      it('should calculate bounds from nodes and export successfully', async () => {
        const result = await exportCanvas({
          format: 'svg',
          canvasElement: mockCanvasElement,
        })

        expect(result.blob).toBeInstanceOf(Blob)
        expect(result.mimeType).toBe('image/svg+xml')
      })

      it('should use default bounds when no nodes exist', async () => {
        // Remove all nodes from viewport
        mockViewport.innerHTML = ''

        const result = await exportCanvas({
          format: 'svg',
          canvasElement: mockCanvasElement,
        })

        // Should still export successfully with default 800x600 bounds
        expect(result.blob).toBeInstanceOf(Blob)
        expect(result.mimeType).toBe('image/svg+xml')
      })

      it('should export successfully with padding applied to bounds', async () => {
        const result = await exportCanvas({
          format: 'svg',
          canvasElement: mockCanvasElement,
        })

        expect(result.blob).toBeInstanceOf(Blob)
      })
    })
  })

  describe('downloadExport', () => {
    it('should create download link and trigger click', () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' })
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      }

      vi.spyOn(document, 'createElement').mockReturnValueOnce(mockLink as unknown as HTMLElement)
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as unknown as Node)
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as unknown as Node)

      downloadExport({
        blob: mockBlob,
        filename: 'test-export.png',
        mimeType: 'image/png',
      })

      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob)
      expect(mockLink.href).toBe('blob:mock-url')
      expect(mockLink.download).toBe('test-export.png')
      expect(mockLink.click).toHaveBeenCalled()
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    })

    it('should remove link element after download', () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' })
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      }

      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as unknown as Node)
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as unknown as Node)
      vi.spyOn(document, 'createElement').mockReturnValueOnce(mockLink as unknown as HTMLElement)

      downloadExport({
        blob: mockBlob,
        filename: 'test-export.png',
        mimeType: 'image/png',
      })

      expect(appendChildSpy).toHaveBeenCalled()
      expect(removeChildSpy).toHaveBeenCalled()
    })
  })

  describe('exportToDataUrl', () => {
    it('should return data URL for PNG export', async () => {
      const dataUrl = await exportToDataUrl({
        format: 'png',
        canvasElement: mockCanvasElement,
      })

      expect(dataUrl).toContain('data:')
      expect(dataUrl).toContain('base64')
    })

    it('should return data URL for JPEG export', async () => {
      const dataUrl = await exportToDataUrl({
        format: 'jpeg',
        canvasElement: mockCanvasElement,
      })

      expect(dataUrl).toContain('data:')
      expect(dataUrl).toContain('base64')
    })

    it('should return data URL for SVG export', async () => {
      const dataUrl = await exportToDataUrl({
        format: 'svg',
        canvasElement: mockCanvasElement,
      })

      expect(dataUrl).toContain('data:')
      expect(dataUrl).toContain('image/svg+xml')
    })
  })

  describe('Export Options Constants', () => {
    describe('EXPORT_FORMAT_OPTIONS', () => {
      it('should have all supported formats', () => {
        const formats = EXPORT_FORMAT_OPTIONS.map(opt => opt.value)
        expect(formats).toContain('png')
        expect(formats).toContain('jpeg')
        expect(formats).toContain('svg')
        expect(formats).toContain('pdf')
      })

      it('should have labels for all formats', () => {
        EXPORT_FORMAT_OPTIONS.forEach(opt => {
          expect(opt.label).toBeDefined()
          expect(opt.label.length).toBeGreaterThan(0)
        })
      })

      it('should have descriptions for all formats', () => {
        EXPORT_FORMAT_OPTIONS.forEach(opt => {
          expect(opt.description).toBeDefined()
          expect(opt.description.length).toBeGreaterThan(0)
        })
      })
    })

    describe('EXPORT_SCALE_OPTIONS', () => {
      it('should have multiple scale options', () => {
        expect(EXPORT_SCALE_OPTIONS.length).toBeGreaterThanOrEqual(3)
      })

      it('should include 100% scale', () => {
        const hasFullScale = EXPORT_SCALE_OPTIONS.some(opt => opt.value === 1)
        expect(hasFullScale).toBe(true)
      })

      it('should have scale values and labels', () => {
        EXPORT_SCALE_OPTIONS.forEach(opt => {
          expect(opt.value).toBeGreaterThan(0)
          expect(opt.label).toBeDefined()
        })
      })

      it('should have scales in ascending order', () => {
        const values = EXPORT_SCALE_OPTIONS.map(opt => opt.value)
        const sorted = [...values].sort((a, b) => a - b)
        expect(values).toEqual(sorted)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle nodes without transform', async () => {
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        transform: 'none',
      } as CSSStyleDeclaration)

      const result = await exportCanvas({
        format: 'svg',
        canvasElement: mockCanvasElement,
      })

      expect(result.blob).toBeInstanceOf(Blob)
    })

    it('should handle nodes with invalid transform', async () => {
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        transform: 'matrix(1, 0, 0, 1, 0, 0)',
      } as CSSStyleDeclaration)

      const result = await exportCanvas({
        format: 'svg',
        canvasElement: mockCanvasElement,
      })

      expect(result.blob).toBeInstanceOf(Blob)
    })

    it('should handle multiple nodes', async () => {
      // Add more nodes
      const node2 = originalCreateElement('div')
      node2.className = 'react-flow__node'
      Object.defineProperty(node2, 'getBoundingClientRect', {
        value: () => ({
          width: 100,
          height: 100,
          top: 300,
          left: 400,
          bottom: 400,
          right: 500,
        }),
      })
      mockViewport.appendChild(node2)

      const result = await exportCanvas({
        format: 'svg',
        canvasElement: mockCanvasElement,
      })

      expect(result.blob).toBeInstanceOf(Blob)
    })
  })

  describe('html2canvas Integration', () => {
    it('should use html2canvas for PNG export', async () => {
      const result = await exportCanvas({
        format: 'png',
        canvasElement: mockCanvasElement,
        scale: 2,
      })

      expect(html2canvas).toHaveBeenCalled()
      expect(result.mimeType).toBe('image/png')
    })

    it('should pass correct options to html2canvas', async () => {
      await exportCanvas({
        format: 'png',
        canvasElement: mockCanvasElement,
        scale: 2,
        background: true,
      })

      expect(html2canvas).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          allowTaint: true,
        })
      )
    })

    it('should pass null background when background is false', async () => {
      await exportCanvas({
        format: 'png',
        canvasElement: mockCanvasElement,
        background: false,
      })

      expect(html2canvas).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          backgroundColor: null,
        })
      )
    })
  })

  describe('Background Option', () => {
    it('should pass background color to html2canvas when background is true', async () => {
      await exportCanvas({
        format: 'png',
        canvasElement: mockCanvasElement,
        background: true,
      })

      expect(html2canvas).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          backgroundColor: '#ffffff',
        })
      )
    })

    it('should pass null background to html2canvas when background is false', async () => {
      await exportCanvas({
        format: 'png',
        canvasElement: mockCanvasElement,
        background: false,
      })

      expect(html2canvas).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          backgroundColor: null,
        })
      )
    })
  })
})
