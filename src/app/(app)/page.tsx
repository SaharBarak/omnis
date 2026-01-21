'use client'

import { useAuth } from '@/lib/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function DashboardPage() {
  const { profile } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          שלום, {profile?.display_name}
        </h1>
        <p className="text-muted-foreground">
          ברוכים הבאים למערכת המיפוי הסימבולי שלך
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/app/people">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>👥</span>
                <span>האנשים שלי</span>
              </CardTitle>
              <CardDescription>
                נהל את רשימת האנשים ותוצאות החישוב שלהם
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                הוסף אנשים חדשים, ערוך פרטים קיימים וצפה במפות הסימבוליות שלהם
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/app/profile">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>👤</span>
                <span>הפרופיל שלי</span>
              </CardTitle>
              <CardDescription>
                צפה וערוך את הפרטים האישיים שלך
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                עדכן את תאריך הלידה, השם העברי וההגדרות שלך
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🔮</span>
              <span>תחזיות</span>
            </CardTitle>
            <CardDescription>
              בקרוב
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              תחזיות יומיות, שבועיות וחודשיות בהתאם למערכות השונות
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
