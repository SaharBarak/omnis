// Layout & Headers
export { PageHeader } from './page-header'

// Data Display
export { StatCard } from './stat-card'
export { TodayKin } from './today-kin'
export { PersonPreview } from './person-preview'
export { ProfileProgress } from './profile-progress'

// Actions & Navigation
export { QuickAction } from './quick-action'
export { WelcomeCard } from './welcome-card'

// Feedback & Dialogs
export { EmptyState } from './empty-state'
export { CommandPalette, useCommandPalette } from './command-palette'
export { ConfirmProvider, useConfirm } from './confirm-dialog'

// Skeletons
export {
  CardSkeleton,
  StatSkeleton,
  HeroSkeleton,
  PersonCardSkeleton,
  DashboardSkeleton,
  ListSkeleton,
} from './skeleton'

// Animation Utilities (keeping for backwards compatibility)
export {
  AnimatedCard,
  GlassCard,
  StatCard as AnimatedStatCard,
  AnimatedText,
  StaggerContainer,
  StaggerItem,
} from './animated-card'
export { AnimatedOracle } from './animated-oracle'
export { CosmicBackground } from './cosmic-background'
export { ThreeBackground } from './three-background'
export { OracleCanvas } from './oracle-canvas'
export { OracleWheel, OracleWheelMini } from './oracle-wheel'
