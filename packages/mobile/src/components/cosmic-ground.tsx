import { StyleSheet, View } from 'react-native'

import { COLORS } from '@/theme/tokens'

/**
 * Fixed background stack behind every authed screen — DESIGN_LANGUAGE §3.1.
 * Ground solid + two radial brand glows + sparse static star dots. Mounted
 * once behind the navigator; never re-renders (pure static views).
 */

const STARS: Array<{ top: string; left: string; size: number; alpha: number }> = [
  { top: '8%', left: '78%', size: 2, alpha: 0.16 },
  { top: '16%', left: '22%', size: 1.5, alpha: 0.12 },
  { top: '31%', left: '61%', size: 2, alpha: 0.09 },
  { top: '52%', left: '12%', size: 1.5, alpha: 0.14 },
  { top: '67%', left: '84%', size: 2, alpha: 0.11 },
  { top: '81%', left: '38%', size: 1.5, alpha: 0.1 },
  { top: '91%', left: '68%', size: 2, alpha: 0.13 },
]

export function CosmicGround() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.ground} />
      <View style={[styles.glow, styles.glowTopRight]} />
      <View style={[styles.glow, styles.glowBottomLeft]} />
      {STARS.map((star, index) => (
        <View
          key={index}
          style={{
            position: 'absolute',
            top: star.top as `${number}%`,
            left: star.left as `${number}%`,
            width: star.size,
            height: star.size,
            borderRadius: star.size / 2,
            backgroundColor: COLORS.brandBright,
            opacity: star.alpha,
          }}
        />
      ))}
    </View>
  )
}

const GLOW_SIZE = 480

const styles = StyleSheet.create({
  ground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.ground,
  },
  glow: {
    position: 'absolute',
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
  },
  glowTopRight: {
    top: -GLOW_SIZE / 3,
    right: -GLOW_SIZE / 3,
    backgroundColor: COLORS.brand,
    opacity: 0.07,
  },
  glowBottomLeft: {
    bottom: -GLOW_SIZE / 3,
    left: -GLOW_SIZE / 3,
    backgroundColor: COLORS.brandSoft,
    opacity: 0.045,
  },
})
