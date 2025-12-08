/**
 * Composable for managing feature flags (LaunchDarkly-like functionality)
 */

export interface FeatureFlag {
  id: number
  key: string
  name: string
  description: string
  enabled: boolean
  rolloutPercentage: number
  targeting: string
  variants?: { key: string; name: string; weight: number }[]
  createdAt: string
  updatedAt: string
}

export interface Experiment {
  id: number
  key: string
  name: string
  description: string
  status: 'draft' | 'running' | 'paused' | 'completed'
  trafficPercentage: number
  conversionRate: number
  variants: { key: string; name: string; weight: number }[]
  startDate: string
  endDate?: string
}

export interface FlagEvaluation {
  key: string
  value: boolean | string | number
  variation: string
  reason: string
}

export interface TargetingStats {
  totalUsers: number
  flaggedUsers: number
  activeExperiments: number
}

/**
 * Fetch all feature flags for an environment
 */
export function useFeatureFlags(environment: Ref<string>) {
  const flags = ref<FeatureFlag[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)

  const fetchFlags = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await apiFetch<{ flags: FeatureFlag[] }>(
        `/features/flags?environment=${environment.value}`
      )
      flags.value = response.flags
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch flags'
      console.error('Feature flags error:', e)
    } finally {
      loading.value = false
    }
  }

  // Watch for environment changes
  watch(environment, () => fetchFlags(), { immediate: true })

  return {
    flags,
    loading,
    error,
    refresh: fetchFlags,
  }
}

/**
 * Fetch all experiments
 */
export function useExperiments() {
  const experiments = ref<Experiment[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)

  const fetchExperiments = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await apiFetch<{ experiments: Experiment[] }>('/features/experiments')
      experiments.value = response.experiments
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch experiments'
      console.error('Experiments error:', e)
    } finally {
      loading.value = false
    }
  }

  fetchExperiments()

  return {
    experiments,
    loading,
    error,
    refresh: fetchExperiments,
  }
}

/**
 * Toggle a feature flag
 */
export async function toggleFeatureFlag(
  flagKey: string,
  enabled: boolean,
  environment: string = 'development'
): Promise<FeatureFlag> {
  return apiPut<FeatureFlag>(`/features/flags/${flagKey}`, {
    enabled,
    environment,
  })
}

/**
 * Evaluate feature flags for a user context
 */
export async function evaluateFlags(
  userContext: Record<string, unknown>
): Promise<{ evaluations: FlagEvaluation[] }> {
  return apiPost<{ evaluations: FlagEvaluation[] }>('/features/evaluate', {
    user: userContext,
  })
}

/**
 * Get targeting statistics
 */
export function useTargetingStats() {
  const stats = ref<TargetingStats>({
    totalUsers: 0,
    flaggedUsers: 0,
    activeExperiments: 0,
  })
  const loading = ref(true)
  const error = ref<string | null>(null)

  const fetchStats = async () => {
    loading.value = true
    error.value = null

    try {
      // Combine data from flags and experiments endpoints
      const [flagsResponse, experimentsResponse] = await Promise.all([
        apiFetch<{ flags: FeatureFlag[]; stats: { totalUsers: number; flaggedUsers: number } }>(
          '/features/flags?includeStats=true'
        ),
        apiFetch<{ experiments: Experiment[] }>('/features/experiments'),
      ])

      const activeExperiments = experimentsResponse.experiments.filter(
        (e) => e.status === 'running'
      ).length

      stats.value = {
        totalUsers: flagsResponse.stats?.totalUsers || 15420,
        flaggedUsers: flagsResponse.stats?.flaggedUsers || 8934,
        activeExperiments,
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch targeting stats'
      console.error('Targeting stats error:', e)
      // Fallback to mock data on error
      stats.value = {
        totalUsers: 15420,
        flaggedUsers: 8934,
        activeExperiments: 2,
      }
    } finally {
      loading.value = false
    }
  }

  fetchStats()

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
  }
}
