import { Tabs } from 'expo-router'
import {
  BooksIcon,
  CirclesThreeIcon,
  SunIcon,
  UsersThreeIcon,
} from 'phosphor-react-native'
import { StyleSheet, View } from 'react-native'

import { BrandMark } from '@/components/brand-mark'
import { COLORS, FONTS } from '@/theme/tokens'

/**
 * Five tabs, Map center and raised — MOBILE_APP_SPEC §4. The asterism marks
 * the hero feature.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: 'transparent' },
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.brandSoft,
        tabBarInactiveTintColor: COLORS.text35,
        tabBarLabelStyle: styles.label,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => <SunIcon color={String(color)} size={size} />,
        }}
      />
      <Tabs.Screen
        name="people"
        options={{
          title: 'People',
          tabBarIcon: ({ color, size }) => (
            <UsersThreeIcon color={String(color)} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.mapTab, focused && styles.mapTabActive]}>
              <BrandMark size={26} mono={focused ? '#FFFFFF' : undefined} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="circles"
        options={{
          title: 'Circles',
          tabBarIcon: ({ color, size }) => (
            <CirclesThreeIcon color={String(color)} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, size }) => <BooksIcon color={String(color)} size={size} />,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  label: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  mapTab: {
    marginTop: -18,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mapTabActive: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brandSoft,
  },
})
