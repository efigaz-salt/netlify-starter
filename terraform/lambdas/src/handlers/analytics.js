/**
 * Analytics API Handler - Mock Analytics Service
 */

// Response helper
const response = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
  body: JSON.stringify(body),
});

// Generate random data within range
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max, decimals = 2) => parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

// Generate time series data
const generateTimeSeries = (days, valueRange) => {
  const data = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      value: randomInt(valueRange[0], valueRange[1]),
    });
  }
  return data;
};

// Mock analytics data
const getOverviewData = () => ({
  sessions: randomInt(14000, 16000),
  pageViews: randomInt(40000, 50000),
  users: randomInt(8000, 10000),
  newUsers: randomInt(1000, 2000),
  bounceRate: randomFloat(28, 38),
  avgSessionDuration: randomInt(180, 320),
  pagesPerSession: randomFloat(2.5, 4.5),
  timestamp: new Date().toISOString(),
});

const getTrafficSources = () => [
  { source: 'organic', sessions: randomInt(5000, 7000), percentage: randomFloat(40, 50) },
  { source: 'direct', sessions: randomInt(3000, 5000), percentage: randomFloat(25, 35) },
  { source: 'referral', sessions: randomInt(1500, 2500), percentage: randomFloat(10, 18) },
  { source: 'social', sessions: randomInt(800, 1500), percentage: randomFloat(6, 12) },
  { source: 'email', sessions: randomInt(300, 800), percentage: randomFloat(2, 6) },
];

const getTopPages = () => [
  { path: '/', title: 'Home', pageViews: randomInt(10000, 15000), avgTimeOnPage: randomInt(30, 90) },
  { path: '/products', title: 'Products', pageViews: randomInt(6000, 10000), avgTimeOnPage: randomInt(60, 180) },
  { path: '/about', title: 'About Us', pageViews: randomInt(2000, 4000), avgTimeOnPage: randomInt(45, 120) },
  { path: '/contact', title: 'Contact', pageViews: randomInt(1500, 3000), avgTimeOnPage: randomInt(20, 60) },
  { path: '/blog', title: 'Blog', pageViews: randomInt(3000, 6000), avgTimeOnPage: randomInt(120, 300) },
];

const getDeviceBreakdown = () => [
  { device: 'desktop', sessions: randomInt(8000, 10000), percentage: randomFloat(55, 65) },
  { device: 'mobile', sessions: randomInt(4000, 6000), percentage: randomFloat(28, 38) },
  { device: 'tablet', sessions: randomInt(500, 1500), percentage: randomFloat(4, 10) },
];

const getGeographicData = () => [
  { country: 'United States', code: 'US', sessions: randomInt(6000, 8000), percentage: randomFloat(40, 50) },
  { country: 'United Kingdom', code: 'GB', sessions: randomInt(1500, 2500), percentage: randomFloat(10, 16) },
  { country: 'Germany', code: 'DE', sessions: randomInt(1000, 2000), percentage: randomFloat(7, 12) },
  { country: 'France', code: 'FR', sessions: randomInt(800, 1500), percentage: randomFloat(5, 10) },
  { country: 'Canada', code: 'CA', sessions: randomInt(600, 1200), percentage: randomFloat(4, 8) },
];

// Handler
exports.handle = async (ctx) => {
  const { method, path, query } = ctx;

  if (method !== 'GET') {
    return response(405, { error: 'Method Not Allowed', message: 'Only GET is supported' });
  }

  // GET /analytics - Overview
  if (path === '/analytics') {
    return response(200, {
      overview: getOverviewData(),
      trafficSources: getTrafficSources(),
      topPages: getTopPages(),
      devices: getDeviceBreakdown(),
      geography: getGeographicData(),
    });
  }

  // GET /analytics/sessions - Session data with time series
  if (path === '/analytics/sessions') {
    const days = parseInt(query.days) || 30;
    return response(200, {
      current: randomInt(14000, 16000),
      previous: randomInt(13000, 15000),
      trend: randomFloat(-5, 10),
      timeSeries: generateTimeSeries(days, [400, 600]),
    });
  }

  // GET /analytics/pageviews - Page view data
  if (path === '/analytics/pageviews') {
    const days = parseInt(query.days) || 30;
    return response(200, {
      current: randomInt(40000, 50000),
      previous: randomInt(38000, 48000),
      trend: randomFloat(-3, 8),
      timeSeries: generateTimeSeries(days, [1200, 1800]),
    });
  }

  // GET /analytics/events - Custom events
  if (path === '/analytics/events') {
    return response(200, {
      events: [
        { name: 'page_view', count: randomInt(40000, 50000), category: 'engagement' },
        { name: 'button_click', count: randomInt(10000, 15000), category: 'interaction' },
        { name: 'form_submit', count: randomInt(2000, 4000), category: 'conversion' },
        { name: 'video_play', count: randomInt(1500, 3000), category: 'engagement' },
        { name: 'file_download', count: randomInt(500, 1500), category: 'conversion' },
        { name: 'add_to_cart', count: randomInt(3000, 5000), category: 'ecommerce' },
        { name: 'purchase', count: randomInt(500, 1200), category: 'ecommerce' },
      ],
      period: query.period || 'last_30_days',
    });
  }

  // GET /analytics/realtime - Real-time data
  if (path === '/analytics/realtime') {
    return response(200, {
      activeUsers: randomInt(50, 200),
      pageViewsPerMinute: randomInt(10, 50),
      topActivePages: [
        { path: '/', activeUsers: randomInt(20, 80) },
        { path: '/products', activeUsers: randomInt(10, 40) },
        { path: '/checkout', activeUsers: randomInt(5, 20) },
      ],
      topLocations: [
        { city: 'New York', country: 'US', activeUsers: randomInt(10, 30) },
        { city: 'London', country: 'GB', activeUsers: randomInt(5, 20) },
        { city: 'San Francisco', country: 'US', activeUsers: randomInt(5, 15) },
      ],
      timestamp: new Date().toISOString(),
    });
  }

  // GET /analytics/conversions - Conversion data
  if (path === '/analytics/conversions') {
    return response(200, {
      goals: [
        { name: 'Sign Up', completions: randomInt(500, 1000), conversionRate: randomFloat(2, 5) },
        { name: 'Purchase', completions: randomInt(200, 500), conversionRate: randomFloat(1, 3) },
        { name: 'Newsletter Subscribe', completions: randomInt(300, 700), conversionRate: randomFloat(1.5, 4) },
      ],
      funnel: {
        steps: [
          { name: 'Visit', users: randomInt(10000, 15000), dropoff: 0 },
          { name: 'View Product', users: randomInt(5000, 8000), dropoff: randomFloat(40, 50) },
          { name: 'Add to Cart', users: randomInt(2000, 4000), dropoff: randomFloat(45, 55) },
          { name: 'Checkout', users: randomInt(800, 1500), dropoff: randomFloat(55, 65) },
          { name: 'Purchase', users: randomInt(400, 800), dropoff: randomFloat(40, 50) },
        ],
      },
    });
  }

  return response(404, { error: 'Not Found', message: 'Analytics endpoint not found' });
};
