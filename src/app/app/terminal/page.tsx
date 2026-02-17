'use client'

import dynamic from 'next/dynamic'

const Terminal = dynamic(() => import('@/components/terminal/Terminal'), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-black flex items-center justify-center">
      <div className="text-green-500 font-mono animate-pulse">Initializing terminal...</div>
    </div>
  ),
})

export default function TerminalPage() {
  return (
    <div className="fixed inset-0 md:relative md:inset-auto md:-m-5 lg:-m-10 md:h-[calc(100vh-3.5rem)]">
      <Terminal />
    </div>
  )
}
