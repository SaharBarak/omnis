'use client'

import './dashboard.css'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Toaster } from 'sonner'
import {
  Home,
  Users,
  Heart,
  UsersRound,
  Network,
  LayoutGrid,
  CreditCard,
  CalendarDays,
  Sparkles,
  Search,
  User,
  Settings,
  LogOut,
  ChevronRight,
  Moon,
  Hash,
  Columns4,
  WandSparkles,
  Dna,
  MoreHorizontal,
} from 'lucide-react'
import { BrandMark } from '@/components/brand-mark'
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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Skeleton } from '@/components/ui/skeleton'
import { CommandPalette } from '@/components/dashboard/command-palette'
import { ConfirmProvider } from '@/components/dashboard/confirm-dialog'

// Navigation structure with groups
const navGroups = [
  {
    label: 'Overview',
    items: [
      { href: '/app', label: 'Home', icon: Home },
      { href: '/app/calendar', label: 'Calendar', icon: CalendarDays },
    ],
  },
  {
    label: 'My Data',
    items: [
      { href: '/app/people', label: 'People', icon: Users },
      { href: '/app/relationships', label: 'Relationships', icon: Heart },
      { href: '/app/groups', label: 'Groups', icon: UsersRound },
    ],
  },
  {
    label: 'Tools',
    items: [
      { href: '/app/graph', label: 'Relationship Map', icon: Network },
      { href: '/app/boards', label: 'Boards', icon: LayoutGrid },
      { href: '/app/cards', label: 'Cards', icon: CreditCard },
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/app/predictions', label: 'Predictions', icon: Sparkles },
      { href: '/app/moon', label: 'Moon Map', icon: Moon },
      { href: '/app/numerology', label: 'Numerology', icon: Hash },
      { href: '/app/bazi', label: 'BaZi', icon: Columns4 },
      { href: '/app/oracles', label: 'Oracles', icon: WandSparkles },
      { href: '/app/gene-keys', label: 'Gene Keys', icon: Dna },
    ],
  },
]

// Mobile bottom nav items (subset)
const mobileNavItems = [
  { href: '/app', label: 'Home', icon: Home },
  { href: '/app/people', label: 'People', icon: Users },
  { href: '/app/predictions', label: 'Insights', icon: Sparkles },
  { href: '/app/boards', label: 'Boards', icon: LayoutGrid },
]

function AppSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()
  const collapsed = state === 'collapsed'

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/app" className="flex items-center gap-3">
                <div className="flex aspect-square size-8 items-center justify-center rounded-xl bg-brand text-white shadow-[0_0_24px_-6px_rgba(125,91,201,0.55)]">
                  <BrandMark size={22} mono className="size-5" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-display font-semibold tracking-tight">Pleiad</span>
                  <span className="truncate font-sans font-medium text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Symbolic Life OS</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-sidebar-foreground/50">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/app' && pathname.startsWith(item.href))
                  const Icon = item.icon
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                      >
                        <Link href={item.href}>
                          <Icon className="size-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

function NavUser() {
  const router = useRouter()
  const { user, profile, signOut } = useAuth()
  const { state } = useSidebar()
  const collapsed = state === 'collapsed'

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const initials = profile?.display_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || '??'

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-full">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || 'User'} />
                <AvatarFallback className="rounded-full bg-primary/10 text-brand-soft text-xs font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{profile?.display_name || 'User'}</span>
                <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
              </div>
              <ChevronRight className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={collapsed ? "right" : "top"}
            align="end"
            sideOffset={4}
          >
            <div className="flex items-center gap-2 p-2">
              <Avatar className="h-8 w-8 rounded-full">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || 'User'} />
                <AvatarFallback className="rounded-full bg-primary/10 text-brand-soft text-xs font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{profile?.display_name || 'User'}</span>
                <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/app/profile" className="flex items-center gap-2">
                <User className="size-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/app/settings" className="flex items-center gap-2">
                <Settings className="size-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="size-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-ground/90 backdrop-blur-md border-t border-white/[0.07] pb-safe" role="navigation" aria-label="Mobile navigation">
      <div className="flex items-center justify-around h-16 px-2">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/app' && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
              className={`flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[48px] px-3 py-2 rounded-xl transition-all active:scale-95 ${
                isActive
                  ? 'text-brand-soft bg-primary/[0.08]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="size-5" aria-hidden="true" />
              <span className="font-sans font-medium text-[10px] uppercase tracking-[0.14em]">{item.label}</span>
            </Link>
          )
        })}

        {/* More menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[48px] px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground transition-all active:scale-95"
              aria-label="More options"
            >
              <MoreHorizontal className="size-5" aria-hidden="true" />
              <span className="font-sans font-medium text-[10px] uppercase tracking-[0.14em]">More</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 mb-2 rounded-xl">
            <DropdownMenuItem asChild>
              <Link href="/app/relationships" className="flex items-center gap-2">
                <Heart className="size-4" />
                Relationships
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/app/groups" className="flex items-center gap-2">
                <UsersRound className="size-4" />
                Groups
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/app/graph" className="flex items-center gap-2">
                <Network className="size-4" />
                Relationship Map
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/app/cards" className="flex items-center gap-2">
                <CreditCard className="size-4" />
                Cards
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/app/profile" className="flex items-center gap-2">
                <User className="size-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/app/settings" className="flex items-center gap-2">
                <Settings className="size-4" />
                Settings
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}

/** Mono control-chrome breadcrumb — the hero product surface convention
    (landing-v2/hero-v2.tsx): `pleiad / your-map / <section>`. */
function HeaderBreadcrumb() {
  const pathname = usePathname()
  const section = pathname.split('/')[2] || 'home'
  return (
    <span className="hidden md:flex items-center gap-2 font-sans font-medium text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
      <span className="inline-block size-1.5 rounded-full bg-brand" aria-hidden />
      pleiad / your-map / {section.replace(/-/g, ' ')}
    </span>
  )
}

function AppHeader() {
  const [isMac, setIsMac] = useState(true)
  useEffect(() => {
    setIsMac(/mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent))
  }, [])

  const openCommandPalette = () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
  }

  return (
    <header
      className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-white/[0.07] bg-ground/80 px-4 backdrop-blur-md"
      role="banner"
    >
      <SidebarTrigger className="-ml-1" aria-label="Toggle sidebar" />
      <HeaderBreadcrumb />

      {/* Search / Command Palette trigger - Desktop */}
      <button
        onClick={openCommandPalette}
        className="hidden sm:flex items-center gap-3 h-9 px-4 rounded-full bg-surface/80 border border-white/[0.07] text-muted-foreground text-sm hover:border-white/[0.12] transition-colors ml-auto focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98]"
        aria-label="Search and navigate (Command+K)"
      >
        <Search className="size-4" aria-hidden="true" />
        <span>Search...</span>
        <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border border-white/[0.07] bg-ground px-1.5 font-mono text-[10px] text-muted-foreground" aria-hidden="true">
          {isMac ? '⌘' : 'Ctrl'} K
        </kbd>
      </button>

      {/* Search button - Mobile only */}
      <button
        onClick={openCommandPalette}
        className="sm:hidden ml-auto flex items-center justify-center w-9 h-9 rounded-full bg-surface/80 border border-white/[0.07] text-muted-foreground hover:border-white/[0.12] transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98]"
        aria-label="Search"
      >
        <Search className="size-4" aria-hidden="true" />
      </button>
    </header>
  )
}

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-5 animate-fade-up">
        {/* Animated logo */}
        <div className="relative w-16 h-16">
          <svg viewBox="0 0 64 64" className="w-full h-full animate-breathe">
            <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.15" />
            <circle cx="32" cy="32" r="18" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.3" />
            <circle cx="32" cy="32" r="8" fill="hsl(var(--primary))" />
          </svg>
          <div className="absolute inset-0 rounded-full border-2 border-primary/15 border-t-primary animate-spin" style={{ animationDuration: '1.2s' }} />
        </div>
        <p className="text-muted-foreground text-sm animate-gentle-pulse">Loading your dashboard...</p>
      </div>
    </div>
  )
}

function ErrorState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-5 text-center max-w-sm px-6">
        <div className="w-16 h-16 flex items-center justify-center">
          <svg viewBox="0 0 64 64" className="w-full h-full">
            <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--destructive))" strokeWidth="1" opacity="0.2" />
            <circle cx="32" cy="32" r="18" fill="none" stroke="hsl(var(--destructive))" strokeWidth="1" opacity="0.3" />
            <circle cx="32" cy="32" r="8" fill="hsl(var(--destructive))" opacity="0.5" />
          </svg>
        </div>
        <h2 className="font-display text-lg font-medium text-foreground">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">
          The dashboard took too long to load. This might be a network issue.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-6 h-10 bg-primary text-primary-foreground text-sm font-medium rounded-lg transition-colors duration-200 hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const [timedOut, setTimedOut] = useState(false)

  // New-user onboarding gate. GET /api/profile bootstraps a profile row on
  // first load (ensureUserAndProfile), so a loaded profile with
  // onboarding_completed === false is a reliable "new user" signal. We
  // require a non-null profile so a transient fetch failure never bounces an
  // established user into onboarding.
  const needsOnboarding = !loading && !!user && !!profile && !profile.onboarding_completed

  // Dashboard ground theme — landing palette mapped onto the shadcn vars
  // (dashboard.css). Scoped to <html> while the authed app is mounted so
  // portaled surfaces (dropdowns, dialogs, toasts) pick it up too.
  useEffect(() => {
    document.documentElement.classList.add('dash-theme', 'dark')
    return () => {
      document.documentElement.classList.remove('dash-theme', 'dark')
    }
  }, [])

  // Timeout: show error state after 12s of loading
  useEffect(() => {
    if (!loading) return
    const timeout = setTimeout(() => setTimedOut(true), 12_000)
    return () => clearTimeout(timeout)
  }, [loading])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, user, router])

  // Route new users through onboarding before they see the app.
  useEffect(() => {
    if (needsOnboarding) {
      router.replace('/onboarding')
    }
  }, [needsOnboarding, router])

  if (timedOut && loading) {
    return <ErrorState />
  }

  if (loading || !user || needsOnboarding) {
    return <LoadingState />
  }

  return (
    <ConfirmProvider>
      <SidebarProvider>
        {/* Command Palette */}
        <CommandPalette />

        {/* Toast notifications */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: '!bg-card !border-border !text-foreground',
            duration: 4000,
          }}
        />

        <AppSidebar />

        <SidebarInset>
          <AppHeader />

          {/* Main content */}
          <main className="flex-1 p-5 lg:p-10 pb-24 md:pb-10">
            <div className="max-w-content mx-auto page-enter">
              {children}
            </div>
          </main>
        </SidebarInset>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </SidebarProvider>
    </ConfirmProvider>
  )
}
