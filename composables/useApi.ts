/**
 * Base API composable for making requests through the edge function proxy
 * All requests go through /api/* which routes to AWS API Gateway
 */

import type { NitroFetchOptions } from 'nitropack'

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  loading: boolean
}

export interface ApiOptions {
  immediate?: boolean
  watchSources?: WatchSource[]
}

/**
 * Base fetch function for API calls
 * Uses Nuxt's $fetch for SSR compatibility
 */
export async function apiFetch<T>(
  endpoint: string,
  options: NitroFetchOptions<string> = {}
): Promise<T> {
  const url = `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  return $fetch<T>(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    },
  })
}

/**
 * Composable for making API requests with reactive state
 */
export function useApi<T>(
  endpoint: string | (() => string),
  options: ApiOptions = {}
) {
  const { immediate = true, watchSources = [] } = options

  const data = ref<T | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)

  const execute = async () => {
    loading.value = true
    error.value = null

    try {
      const url = typeof endpoint === 'function' ? endpoint() : endpoint
      data.value = await apiFetch<T>(url)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      console.error('API Error:', e)
    } finally {
      loading.value = false
    }
  }

  if (immediate) {
    execute()
  }

  if (watchSources.length > 0) {
    watch(watchSources, () => execute())
  }

  return {
    data,
    error,
    loading,
    refresh: execute,
  }
}

/**
 * POST request helper
 */
export async function apiPost<T>(endpoint: string, body: unknown): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: 'POST',
    body: body as any,
  })
}

/**
 * PUT request helper
 */
export async function apiPut<T>(endpoint: string, body: unknown): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: 'PUT',
    body: body as any,
  })
}

/**
 * DELETE request helper
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: 'DELETE',
  })
}
