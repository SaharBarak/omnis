import { QueryClient } from '@tanstack/react-query'

/**
 * Single app-wide query client — module-scoped so non-React code (the auth
 * store's sign-out cache purge, F12) can reach it without a provider.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 2,
    },
  },
})
