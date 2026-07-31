/**
 * The Material 3 component set.
 *
 * Everything the app draws comes from here or from `@/theme/m3`. If a screen
 * reaches for a raw `View` with a hand-picked colour, that's the signal a
 * component is missing — add it here rather than styling in place.
 */

export { BottomSheet, type BottomSheetProps } from './bottom-sheet'
export { Button, type ButtonProps, type ButtonVariant } from './button'
export { Card, type CardProps, type CardVariant } from './card'
export { Chip, type ChipProps, type ChipVariant } from './chip'
export { Divider } from './divider'
export { Fab, type FabProps, type FabColor, type FabSize } from './fab'
export { IconButton, type IconButtonProps, type IconButtonVariant } from './icon-button'
export { ListItem, type ListItemProps } from './list-item'
export {
  NavigationBar,
  NavItem,
  NAVIGATION_BAR_HEIGHT,
  type NavItemProps,
} from './navigation-bar'
export {
  CircularProgress,
  LinearProgress,
  type CircularProgressProps,
  type LinearProgressProps,
} from './progress'
export { Slider } from './slider'
export { SurfaceColorProvider, useSurfaceColor } from './surface-context'
export { SegmentedButton, type Segment, type SegmentedButtonProps } from './segmented-button'
export { SnackbarHost } from './snackbar'
export { Surface, type SurfaceProps } from './surface'
export { Text, type TextProps } from './text'
export { TextField, type TextFieldProps } from './text-field'
export { TopAppBar, LARGE_TITLE_COLLAPSE_DISTANCE, type TopAppBarProps } from './top-app-bar'
export { Touchable, type TouchableProps } from './touchable'
export { useScrollProgress } from './use-scroll-progress'
