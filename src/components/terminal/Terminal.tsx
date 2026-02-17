'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { executeCommand } from './command-interpreter'

// ─── ANSI parser ────────────────────────────────────────────────────────

interface StyledSpan {
  text: string
  className: string
}

function parseAnsi(text: string): StyledSpan[] {
  const spans: StyledSpan[] = []
  const regex = /\x1b\[(\d+)m/g
  let lastIndex = 0
  let currentClasses: string[] = []

  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      spans.push({ text: text.slice(lastIndex, match.index), className: currentClasses.join(' ') })
    }
    const code = parseInt(match[1])
    switch (code) {
      case 0: currentClasses = []; break
      case 1: currentClasses.push('font-bold'); break
      case 2: currentClasses.push('opacity-50'); break
      case 31: currentClasses = currentClasses.filter(c => !c.startsWith('text-')); currentClasses.push('text-red-400'); break
      case 32: currentClasses = currentClasses.filter(c => !c.startsWith('text-')); currentClasses.push('text-green-400'); break
      case 33: currentClasses = currentClasses.filter(c => !c.startsWith('text-')); currentClasses.push('text-yellow-400'); break
      case 35: currentClasses = currentClasses.filter(c => !c.startsWith('text-')); currentClasses.push('text-purple-400'); break
      case 36: currentClasses = currentClasses.filter(c => !c.startsWith('text-')); currentClasses.push('text-cyan-400'); break
      case 37: currentClasses = currentClasses.filter(c => !c.startsWith('text-')); currentClasses.push('text-gray-200'); break
    }
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    spans.push({ text: text.slice(lastIndex), className: currentClasses.join(' ') })
  }

  return spans
}

function AnsiLine({ text }: { text: string }) {
  const spans = parseAnsi(text)
  return (
    <div className="leading-relaxed whitespace-pre">
      {spans.map((span, i) => (
        <span key={i} className={span.className}>{span.text}</span>
      ))}
    </div>
  )
}

// ─── Matrix rain effect ─────────────────────────────────────────────────

const GLYPHS = 'IMIXIKAKBALKANCHICCHANCIMIMANIKLAMATMULOCCHUEBENIXMENCIBCABANCAUACAHAU'

function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const columns: number[] = []
    const fontSize = 14

    function resize() {
      if (!canvas) return
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      const colCount = Math.floor(canvas.width / fontSize)
      columns.length = 0
      for (let i = 0; i < colCount; i++) {
        columns.push(Math.random() * canvas.height / fontSize)
      }
    }

    resize()
    window.addEventListener('resize', resize)

    function draw() {
      if (!ctx || !canvas) return
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < columns.length; i++) {
        const char = GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
        const x = i * fontSize
        const y = columns[i] * fontSize

        const alpha = 0.1 + Math.random() * 0.15
        ctx.fillStyle = `rgba(0, 255, 100, ${alpha})`
        ctx.fillText(char, x, y)

        if (y > canvas.height && Math.random() > 0.975) {
          columns[i] = 0
        }
        columns[i] += 0.5
      }

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
    />
  )
}

// ─── Terminal Component ─────────────────────────────────────────────────

interface TerminalLine {
  type: 'input' | 'output'
  content: string
}

const BANNER = `\x1b[36m
   $$$$$$\\  $$\\      $$\\ $$\\   $$\\ $$$$$$\\ $$$$$$\\
  $$  __$$\\ $$$\\    $$$ |$$$\\  $$ |\\_$$  _|$$  __$$\\
  $$ /  $$ |$$$$\\  $$$$ |$$$$\\ $$ |  $$ |  $$ /  \\__|
  $$ |  $$ |$$\\$$\\$$ $$ |$$ $$\\$$ |  $$ |  \\$$$$$$\\
  $$ |  $$ |$$ \\$$$  $$ |$$ \\$$$$ |  $$ |   \\____$$\\
  $$ |  $$ |$$ |\\$  /$$ |$$ |\\$$$ |  $$ |  $$\\   $$ |
   $$$$$$  |$$ | \\_/ $$ |$$ | \\$$ |$$$$$$\\ \\$$$$$$  |
   \\______/ \\__|     \\__|\\__|  \\__|\\______| \\______/\x1b[0m

  \x1b[2mSymbolic Life OS  -  Terminal Interface\x1b[0m
  \x1b[2mType \x1b[32mhelp\x1b[0m\x1b[2m for available commands\x1b[0m

`

export default function Terminal() {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'output', content: BANNER },
  ])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isProcessing, setIsProcessing] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [lines, scrollToBottom])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = useCallback(async () => {
    const cmd = input.trim()
    if (!cmd) return

    setLines(prev => [...prev, { type: 'input', content: cmd }])
    setHistory(prev => [cmd, ...prev])
    setHistoryIndex(-1)
    setInput('')
    setIsProcessing(true)

    try {
      const result = await executeCommand(cmd)
      if (result === '__CLEAR__') {
        setLines([])
      } else if (result) {
        setLines(prev => [...prev, { type: 'output', content: result }])
      }
    } catch (err) {
      setLines(prev => [...prev, {
        type: 'output',
        content: `\x1b[31mError: ${err instanceof Error ? err.message : 'Unknown error'}\x1b[0m`,
      }])
    } finally {
      setIsProcessing(false)
    }
  }, [input])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (history.length > 0) {
        const newIndex = Math.min(historyIndex + 1, history.length - 1)
        setHistoryIndex(newIndex)
        setInput(history[newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setInput(history[newIndex])
      } else {
        setHistoryIndex(-1)
        setInput('')
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      setLines([])
    }
  }, [handleSubmit, history, historyIndex])

  return (
    <div
      className="relative flex flex-col h-full bg-black font-mono text-sm text-green-400 overflow-hidden"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Matrix rain background */}
      <MatrixRain />

      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px)',
        }}
      />

      {/* CRT vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      {/* Terminal content */}
      <div className="relative z-20 flex-1 overflow-y-auto p-4">
        {lines.map((line, i) => (
          <div key={i}>
            {line.type === 'input' ? (
              <div className="flex gap-2">
                <span className="text-cyan-400 shrink-0">omnis&gt;</span>
                <span className="text-green-300">{line.content}</span>
              </div>
            ) : (
              <AnsiLine text={line.content} />
            )}
          </div>
        ))}

        {/* Input line */}
        <div className="flex gap-2 items-center mt-1">
          <span className="text-cyan-400 shrink-0">omnis&gt;</span>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isProcessing}
              className="w-full bg-transparent text-green-300 outline-none caret-green-400 placeholder:text-green-900"
              placeholder={isProcessing ? 'processing...' : ''}
              autoFocus
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
          </div>
          {isProcessing && (
            <span className="text-green-600 animate-pulse">|</span>
          )}
        </div>

        <div ref={bottomRef} />
      </div>

      {/* Status bar */}
      <div className="relative z-20 flex items-center justify-between px-4 py-1.5 bg-green-950/50 border-t border-green-900/50 text-xs text-green-600">
        <span>OMNIS TERMINAL v1.0</span>
        <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        <span>Type &apos;help&apos; for commands</span>
      </div>
    </div>
  )
}
