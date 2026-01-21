import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
      <main className="flex flex-col items-center gap-8 text-center max-w-2xl">
        <h1 className="text-5xl font-bold font-heading">Omnis</h1>
        <p className="text-xl text-muted-foreground">
          מערכת מיפוי סימבולי אישי
        </p>
        <p className="text-muted-foreground">
          גלה את המפות הסימבוליות שלך לפי מערכות עתיקות ומודרניות -
          דרימספל, צולקין, אסטרולוגיה, ועוד.
        </p>
        <div className="flex gap-4 flex-col sm:flex-row">
          <Button asChild size="lg">
            <Link href="/login">התחבר</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/app">למערכת</Link>
          </Button>
        </div>
      </main>
      <footer className="absolute bottom-8 text-sm text-muted-foreground">
        <p>© 2026 Omnis. כל הזכויות שמורות.</p>
      </footer>
    </div>
  )
}
