export default defineNuxtPlugin(() => {
  // This plugin suppresses Vue Router warnings for /api/* paths
  // These paths are handled by Netlify Edge Functions, not Vue Router

  if (process.client) {
    const router = useRouter()

    // Override router.resolve to prevent warnings for API paths
    const originalResolve = router.resolve.bind(router)
    router.resolve = (to: any) => {
      const path = typeof to === 'string' ? to : to?.path

      // Check if it's an API path
      if (path && typeof path === 'string' && path.startsWith('/api/')) {
        // Return a valid route object to prevent warning
        return {
          path: path,
          name: undefined,
          matched: [],
          meta: {},
          params: {},
          query: {},
          hash: '',
          redirectedFrom: undefined,
          fullPath: path,
          href: path
        } as any
      }

      return originalResolve(to)
    }

    // Also intercept hasRoute to prevent warnings
    const originalHasRoute = router.hasRoute.bind(router)
    router.hasRoute = (name: any) => {
      if (typeof name === 'string' && name.startsWith('/api/')) {
        return true
      }
      return originalHasRoute(name)
    }
  }
})
