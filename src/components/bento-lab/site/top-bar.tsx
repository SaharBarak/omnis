import Link from 'next/link'
import type { ReactNode } from 'react'
import { ChevronDown, Menu } from 'lucide-react'
import { Disclosure } from './disclosure'
import { NavLinks, type NavItem } from './nav-links'
import s from './site.module.css'
import kit from '../kit.module.css'
import { MotionToggle } from '../motion-toggle'
import { PaletteSwitch } from '../palette-switch'
import { ThemeToggle } from '../theme-toggle'
import { BrandMark } from '@/components/brand-mark'

/** A titled set of links that opens from the bar, e.g. the app's system pages. */
export interface NavMenu {
  readonly label: string
  readonly items: readonly NavItem[]
}

export interface TopBarProps {
  /** Where the brand goes. */
  readonly home: string
  /** Main links, centred in the bar. */
  readonly links: readonly NavItem[]
  /** Menus after the links. */
  readonly menus?: readonly NavMenu[]
  /** Shown beside the palette, theme and motion controls on wide screens. */
  readonly actions?: ReactNode
  /** The one call to action, shown at every width. */
  readonly primary?: ReactNode
  /** The menu panel's last row on narrow screens, e.g. sign in or sign out. */
  readonly narrowFooter?: ReactNode
  /** Accessible name of the navigation landmark. */
  readonly label?: string
}

/**
 * The glass bar every page of the site and the app sits under (BENTO_SITE.md
 * "Shell"): brand, centred links and menus, palette, theme and motion, then
 * the call to action. Narrow screens fold the links and menus into one panel.
 */
export function TopBar({ home, links, menus = [], actions, primary, narrowFooter, label = 'Main' }: TopBarProps) {
  return (
    <div className={`${s.page} ${s.navWrap}`}>
      <a href="#main" className={kit.skip}>
        Skip to content
      </a>
      <nav className={`${s.nav} ${kit.glass}`} aria-label={label}>
        <Link href={home} className={s.brand}>
          <BrandMark size={28} />
          Pleiad
        </Link>
        <div className={s.navCentre}>
          <NavLinks items={links} className={s.navLinks} />
          {menus.map((menu) => (
            <Disclosure
              key={menu.label}
              className={s.navMenu}
              summaryClassName={s.navLink}
              panelClassName={`${s.navMenuPanel} ${kit.glass}`}
              summary={
                <>
                  {menu.label}
                  <ChevronDown size={14} aria-hidden className={s.navMenuChevron} />
                </>
              }
            >
              <NavLinks items={menu.items} className={s.navMenuList} linkClassName={s.navMenuLink} />
            </Disclosure>
          ))}
        </div>
        <div className={s.navActions}>
          <PaletteSwitch className={`${kit.iconButton} ${s.hideNarrow}`} />
          <ThemeToggle className={`${kit.iconButton} ${s.hideNarrow}`} />
          <MotionToggle className={`${kit.iconButton} ${s.hideNarrow}`} />
          {actions && <div className={`${s.navActionsWide} ${s.hideNarrow}`}>{actions}</div>}
          {primary}
          <Disclosure className={s.menu} summaryClassName={kit.iconButton} panelClassName={`${s.menuPanel} ${kit.glass}`} label="Menu" summary={<Menu size={16} aria-hidden />}>
            <NavLinks items={links} className={s.menuList} linkClassName={s.menuLink} />
            {menus.map((menu) => (
              <div key={menu.label} className={s.menuGroup}>
                <span className={s.menuGroupTitle}>{menu.label}</span>
                <NavLinks items={menu.items} className={s.menuList} linkClassName={s.menuLink} />
              </div>
            ))}
            {narrowFooter}
            <div className={s.menuControls}>
              <PaletteSwitch className={kit.iconButton} />
              <ThemeToggle className={kit.iconButton} />
              <MotionToggle className={kit.iconButton} />
            </div>
          </Disclosure>
        </div>
      </nav>
    </div>
  )
}
