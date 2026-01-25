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
          Hello, {profile?.display_name}
        </h1>
        <p className="text-muted-foreground">
          Welcome to your personal symbolic mapping system
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/app/people">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>👥</span>
                <span>My People</span>
              </CardTitle>
              <CardDescription>
                Manage your list of people and their calculation results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Add new people, edit existing details and view their symbolic maps
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/app/profile">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>👤</span>
                <span>My Profile</span>
              </CardTitle>
              <CardDescription>
                View and edit your personal details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Update your birth date, Hebrew name and settings
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/app/predictions">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🔮</span>
                <span>Predictions</span>
              </CardTitle>
              <CardDescription>
                Daily, weekly and monthly forecasts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View Dreamspell calendar predictions and cycle information
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
