/**
 * Composable for fetching analytics data from the API
 */

export interface AnalyticsRealtime {
  activeUsers: number
  activePages: { path: string; users: number }[]
  eventsPerMinute: number
  topCountries: { country: string; users: number }[]
}

export interface AnalyticsSummary {
  overview: {
    sessions: number
    pageViews: number
    users: number
    newUsers: number
    bounceRate: number
    avgSessionDuration: number
    pagesPerSession: number
  }
  topPages: { path: string; title: string; pageViews: number; avgTimeOnPage: number }[]
}

export interface AnalyticsSessions {
  total: number
  period: string
  sessions: {
    id: string
    userId: string
    startTime: string
    duration: string
    pageViews: number
    device: string
    country: string
  }[]
}

export interface AnalyticsEvents {
  events: {
    id: string
    name: string
    properties: Record<string, unknown>
    timestamp: string
    userId: string
  }[]
  total: number
}

export interface DashboardStats {
  pageViews: number
  users: number
  edgeFunctions: number
  apiCalls: number
}

/**
 * Fetch realtime analytics data
 */
export function useAnalyticsRealtime() {
  return useApi<AnalyticsRealtime>('/analytics/realtime')
}

/**
 * Fetch analytics summary with optional period filter
 */
export function useAnalyticsSummary(period: string = '7d') {
  return useApi<AnalyticsSummary>(`/analytics?period=${period}`)
}

/**
 * Fetch session data
 */
export function useAnalyticsSessions(limit: number = 20) {
  return useApi<AnalyticsSessions>(`/analytics/sessions?limit=${limit}`)
}

/**
 * Fetch events data
 */
export function useAnalyticsEvents(limit: number = 50) {
  return useApi<AnalyticsEvents>(`/analytics/events?limit=${limit}`)
}

/**
 * Fetch dashboard stats (combines multiple API calls)
 */
export function useDashboardStats() {
  const stats = ref<DashboardStats>({
    pageViews: 0,
    users: 0,
    edgeFunctions: 4, // Static for now
    apiCalls: 0,
  })
  const loading = ref(true)
  const error = ref<string | null>(null)

  const fetchStats = async () => {
    loading.value = true
    error.value = null

    try {
      // Fetch analytics summary
      const summary = await apiFetch<AnalyticsSummary>('/analytics?period=7d')

      stats.value = {
        pageViews: summary.overview.pageViews,
        users: summary.overview.users,
        edgeFunctions: 4, // Could be fetched from a separate endpoint
        apiCalls: Math.floor(summary.overview.pageViews * 2.5), // Estimated based on page views
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch stats'
      console.error('Dashboard stats error:', e)
    } finally {
      loading.value = false
    }
  }

  // Fetch immediately
  fetchStats()

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
  }
}

/**
 * Fetch recent activity for dashboard
 */
export function useRecentActivity() {
  const activity = ref<{ id: number; message: string; timestamp: string }[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)

  const fetchActivity = async () => {
    loading.value = true
    error.value = null

    try {
      const events = await apiFetch<AnalyticsEvents>('/analytics/events?limit=5')

      activity.value = events.events.map((event, index) => ({
        id: index + 1,
        message: formatEventMessage(event.name, event.properties),
        timestamp: formatTimestamp(event.timestamp),
      }))
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch activity'
      console.error('Recent activity error:', e)
    } finally {
      loading.value = false
    }
  }

  fetchActivity()

  return {
    activity,
    loading,
    error,
    refresh: fetchActivity,
  }
}

function formatEventMessage(name: string, properties: Record<string, unknown>): string {
  switch (name) {
    case 'page_view':
      return `Page view on ${properties.path || '/'}`
    case 'button_click':
      return `Button "${properties.buttonId}" clicked`
    case 'form_submit':
      return `Form "${properties.formId}" submitted`
    case 'purchase':
      return `Purchase completed - $${properties.amount}`
    case 'user_signup':
      return `New user signup from ${properties.source || 'direct'}`
    default:
      return `Event: ${name}`
  }
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}
