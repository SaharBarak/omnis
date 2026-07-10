import { Stack } from 'expo-router'

/** Unauthenticated group: login + onboarding ritual. */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        animation: 'fade',
      }}
    />
  )
}
