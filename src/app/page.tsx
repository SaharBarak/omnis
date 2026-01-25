import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
      <main className="flex flex-col items-center gap-8 text-center max-w-2xl">
        <h1 className="text-5xl font-bold font-heading">Omnis</h1>
        <p className="text-xl text-muted-foreground">
          Personal Symbolic Mapping System
        </p>
        <p className="text-muted-foreground">
          Discover your symbolic maps according to ancient and modern systems -
          Dreamspell, Tzolkin, Astrology, Human Design, and more.
        </p>
        <div className="flex gap-4 flex-col sm:flex-row">
          <Button asChild size="lg">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/app">Enter App</Link>
          </Button>
        </div>
      </main>
      <footer className="absolute bottom-8 text-sm text-muted-foreground">
        <p>© 2026 Omnis. All rights reserved.</p>
      </footer>
    </div>
  )
}
