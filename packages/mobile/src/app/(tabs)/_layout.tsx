import { Tabs, TabList, TabSlot, TabTrigger } from 'expo-router/ui'
import {
  BooksIcon,
  CirclesThreeIcon,
  SunIcon,
  UsersThreeIcon,
} from 'phosphor-react-native'

import { BrandMark } from '@/components/brand-mark'
import { NavItem, NavigationBar } from '@/components/m3'
import { PushPromptHost } from '@/components/notifications/push-prompt-sheet'

/**
 * Five destinations in an M3 navigation bar.
 *
 * Two Material conventions do the work here. The active destination's icon
 * switches to its *filled* weight — Phosphor's `fill` — while the inactive ones
 * stay regular; and the active one sits on a `secondaryContainer` pill. Between
 * them a user can tell where they are without reading a label, which is the
 * whole job of a nav bar.
 *
 * The map keeps the asterism rather than a generic icon, because it is the
 * product's one hero surface. It no longer sits raised above the bar: a
 * protruding centre tab is an iOS idiom, and M3 gives every destination equal
 * standing.
 */

const ICON_SIZE = 24

export default function TabsLayout() {
  return (
    <>
      <Tabs>
        <TabSlot />
        <TabList asChild>
          <NavigationBar>
            <TabTrigger name="index" href="/" asChild>
              <NavItem
                label="Today"
                icon={(color, focused) => (
                  <SunIcon
                    color={color}
                    size={ICON_SIZE}
                    weight={focused ? 'fill' : 'regular'}
                  />
                )}
              />
            </TabTrigger>

            <TabTrigger name="people" href="/people" asChild>
              <NavItem
                label="People"
                icon={(color, focused) => (
                  <UsersThreeIcon
                    color={color}
                    size={ICON_SIZE}
                    weight={focused ? 'fill' : 'regular'}
                  />
                )}
              />
            </TabTrigger>

            <TabTrigger name="map" href="/map" asChild>
              <NavItem
                label="Map"
                icon={(color) => <BrandMark size={ICON_SIZE} mono={color} />}
              />
            </TabTrigger>

            <TabTrigger name="circles" href="/circles" asChild>
              <NavItem
                label="Circles"
                icon={(color, focused) => (
                  <CirclesThreeIcon
                    color={color}
                    size={ICON_SIZE}
                    weight={focused ? 'fill' : 'regular'}
                  />
                )}
              />
            </TabTrigger>

            <TabTrigger name="library" href="/library" asChild>
              <NavItem
                label="Library"
                icon={(color, focused) => (
                  <BooksIcon
                    color={color}
                    size={ICON_SIZE}
                    weight={focused ? 'fill' : 'regular'}
                  />
                )}
              />
            </TabTrigger>
          </NavigationBar>
        </TabList>
      </Tabs>

      <PushPromptHost />
    </>
  )
}
