'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/app', label: 'ראשי', icon: '🏠' },
  { href: '/app/people', label: 'אנשים', icon: '👥' },
  { href: '/app/relationships', label: 'קשרים', icon: '🔗' },
  { href: '/app/groups', label: 'קבוצות', icon: '👨‍👩‍👧‍👦' },
  { href: '/app/graph', label: 'מפת קשרים', icon: '🕸️' },
  { href: '/app/cards', label: 'כרטיסים', icon: '🎴' },
  { href: '/app/profile', label: 'פרופיל', icon: '👤' },
]

function Sidebar({ className = '' }: { className?: string }) {
  const pathname = usePathname()

  return (
    <nav className={`flex flex-col gap-2 p-4 ${className}`}>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${pathname === item.href
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
            }`}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, profile, signOut, loading } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">טוען...</div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  const initials = profile?.display_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || user.email?.slice(0, 2).toUpperCase() || '??'

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-0">
              <div className="p-4 border-b">
                <Link href="/app" className="font-bold text-xl">Omnis</Link>
              </div>
              <Sidebar />
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/app" className="font-bold text-xl mr-4 lg:mr-0">
            Omnis
          </Link>

          {/* Spacer */}
          <div className="flex-1" />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || 'User'} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  {profile?.display_name && (
                    <p className="font-medium">{profile.display_name}</p>
                  )}
                  {user.email && (
                    <p className="text-sm text-muted-foreground" dir="ltr">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/app/profile">פרופיל</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/app/settings">הגדרות</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                התנתק
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 border-l min-h-[calc(100vh-3.5rem)] sticky top-14">
          <Sidebar />
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
