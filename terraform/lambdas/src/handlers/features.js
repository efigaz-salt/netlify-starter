/**
 * Features API Handler - Mock LaunchDarkly-like Feature Flag Service
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

// Mock feature flags
const featureFlags = [
  {
    key: 'dark-mode',
    name: 'Dark Mode',
    description: 'Enable dark mode theme across the application',
    enabled: true,
    rolloutPercentage: 100,
    variants: [
      { key: 'control', name: 'Light Mode', weight: 0 },
      { key: 'dark', name: 'Dark Mode', weight: 100 },
    ],
    targeting: {
      rules: [],
      defaultVariant: 'dark',
    },
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-06-15T12:00:00Z',
  },
  {
    key: 'new-checkout',
    name: 'New Checkout Flow',
    description: 'Streamlined checkout experience with fewer steps',
    enabled: true,
    rolloutPercentage: 25,
    variants: [
      { key: 'control', name: 'Original Checkout', weight: 75 },
      { key: 'streamlined', name: 'Streamlined Checkout', weight: 25 },
    ],
    targeting: {
      rules: [
        { attribute: 'country', operator: 'in', values: ['US', 'CA'], variant: 'streamlined' },
      ],
      defaultVariant: 'control',
    },
    createdAt: '2024-03-20T00:00:00Z',
    updatedAt: '2024-07-01T09:30:00Z',
  },
  {
    key: 'analytics-v2',
    name: 'Analytics V2',
    description: 'New analytics dashboard with enhanced visualizations',
    enabled: false,
    rolloutPercentage: 0,
    variants: [
      { key: 'v1', name: 'Analytics V1', weight: 100 },
      { key: 'v2', name: 'Analytics V2', weight: 0 },
    ],
    targeting: {
      rules: [],
      defaultVariant: 'v1',
    },
    createdAt: '2024-05-01T00:00:00Z',
    updatedAt: '2024-05-01T00:00:00Z',
  },
  {
    key: 'mobile-app-banner',
    name: 'Mobile App Banner',
    description: 'Promotional banner for mobile app download',
    enabled: true,
    rolloutPercentage: 50,
    variants: [
      { key: 'control', name: 'No Banner', weight: 50 },
      { key: 'banner-a', name: 'Banner Design A', weight: 25 },
      { key: 'banner-b', name: 'Banner Design B', weight: 25 },
    ],
    targeting: {
      rules: [
        { attribute: 'device', operator: 'equals', values: ['mobile'], variant: 'banner-a' },
      ],
      defaultVariant: 'control',
    },
    createdAt: '2024-04-15T00:00:00Z',
    updatedAt: '2024-08-10T14:45:00Z',
  },
  {
    key: 'ai-recommendations',
    name: 'AI Product Recommendations',
    description: 'ML-powered product recommendations',
    enabled: true,
    rolloutPercentage: 10,
    variants: [
      { key: 'control', name: 'Rule-based', weight: 90 },
      { key: 'ml-v1', name: 'ML Model V1', weight: 10 },
    ],
    targeting: {
      rules: [
        { attribute: 'userTier', operator: 'equals', values: ['premium'], variant: 'ml-v1' },
      ],
      defaultVariant: 'control',
    },
    createdAt: '2024-06-01T00:00:00Z',
    updatedAt: '2024-09-20T11:00:00Z',
  },
];

// User segments
const segments = [
  { key: 'beta-users', name: 'Beta Users', description: 'Users opted into beta features', userCount: 1250 },
  { key: 'premium-users', name: 'Premium Users', description: 'Paid subscription users', userCount: 5600 },
  { key: 'us-users', name: 'US Users', description: 'Users from United States', userCount: 45000 },
  { key: 'mobile-users', name: 'Mobile Users', description: 'Users on mobile devices', userCount: 32000 },
];

// Mock experiments
const experiments = [
  {
    id: 1,
    key: 'button-color-test',
    name: 'Button Color Test',
    description: 'Testing blue vs green primary buttons for conversion rates',
    status: 'running',
    trafficPercentage: 50,
    conversionRate: 12.4,
    variants: [
      { key: 'control', name: 'Blue Button', weight: 50 },
      { key: 'variant-a', name: 'Green Button', weight: 50 },
    ],
    startDate: '2024-11-01T00:00:00Z',
    endDate: null,
  },
  {
    id: 2,
    key: 'homepage-layout',
    name: 'Homepage Layout',
    description: 'Comparing hero section layouts for engagement',
    status: 'completed',
    trafficPercentage: 100,
    conversionRate: 8.7,
    variants: [
      { key: 'control', name: 'Original Layout', weight: 50 },
      { key: 'variant-a', name: 'New Hero Layout', weight: 50 },
    ],
    startDate: '2024-09-15T00:00:00Z',
    endDate: '2024-10-15T00:00:00Z',
  },
  {
    id: 3,
    key: 'pricing-page',
    name: 'Pricing Page',
    description: 'Testing different pricing table designs',
    status: 'paused',
    trafficPercentage: 25,
    conversionRate: 5.2,
    variants: [
      { key: 'control', name: 'Current Pricing', weight: 50 },
      { key: 'variant-a', name: 'Simplified Pricing', weight: 50 },
    ],
    startDate: '2024-10-20T00:00:00Z',
    endDate: null,
  },
];

// Evaluate a flag for a user
const evaluateFlag = (flag, userContext) => {
  if (!flag.enabled) {
    return { key: flag.key, enabled: false, variant: flag.variants[0].key, reason: 'FLAG_DISABLED' };
  }

  // Check targeting rules
  for (const rule of flag.targeting.rules) {
    const userValue = userContext[rule.attribute];
    if (rule.operator === 'equals' && rule.values.includes(userValue)) {
      return { key: flag.key, enabled: true, variant: rule.variant, reason: 'RULE_MATCH' };
    }
    if (rule.operator === 'in' && rule.values.includes(userValue)) {
      return { key: flag.key, enabled: true, variant: rule.variant, reason: 'RULE_MATCH' };
    }
  }

  // Percentage rollout
  const hash = (userContext.userId || 'anonymous').split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
  const bucket = Math.abs(hash) % 100;

  if (bucket < flag.rolloutPercentage) {
    // Select variant based on weights
    let cumWeight = 0;
    const variantBucket = Math.abs(hash * 31) % 100;
    for (const variant of flag.variants) {
      cumWeight += variant.weight;
      if (variantBucket < cumWeight) {
        return { key: flag.key, enabled: true, variant: variant.key, reason: 'ROLLOUT' };
      }
    }
  }

  return { key: flag.key, enabled: false, variant: flag.targeting.defaultVariant, reason: 'ROLLOUT_EXCLUDED' };
};

// Handler
exports.handle = async (ctx) => {
  const { method, path, query, body } = ctx;

  // GET /features/flags - List all flags
  if (path === '/features/flags' && method === 'GET') {
    let flags = [...featureFlags];

    // Filter by enabled status
    if (query.enabled !== undefined) {
      const enabledFilter = query.enabled === 'true';
      flags = flags.filter(f => f.enabled === enabledFilter);
    }

    // Calculate targeting labels
    const getTargetingLabel = (flag) => {
      if (!flag.enabled) return 'None';
      if (flag.rolloutPercentage === 100) return 'All Users';
      if (flag.targeting.rules.length > 0) {
        const rule = flag.targeting.rules[0];
        if (rule.attribute === 'userTier' && rule.values.includes('premium')) return 'Premium Users';
        if (rule.attribute === 'device' && rule.values.includes('mobile')) return 'Mobile Users';
        if (rule.attribute === 'country') return 'Geo-targeted';
        return 'Beta Users';
      }
      return `${flag.rolloutPercentage}% Rollout`;
    };

    return response(200, {
      flags: flags.map((f, index) => ({
        id: index + 1,
        key: f.key,
        name: f.name,
        description: f.description,
        enabled: f.enabled,
        rolloutPercentage: f.rolloutPercentage,
        targeting: getTargetingLabel(f),
        variants: f.variants,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      })),
      total: flags.length,
      stats: {
        totalUsers: 15420,
        flaggedUsers: 8934,
      },
    });
  }

  // GET /features/experiments - List all experiments
  if (path === '/features/experiments' && method === 'GET') {
    return response(200, {
      experiments,
      total: experiments.length,
    });
  }

  // GET /features/flags/:key - Get single flag
  const flagKeyMatch = path.match(/^\/features\/flags\/([a-z0-9-]+)$/);
  if (flagKeyMatch && method === 'GET') {
    const flagKey = flagKeyMatch[1];
    const flag = featureFlags.find(f => f.key === flagKey);

    if (!flag) {
      return response(404, { error: 'Not Found', message: `Flag ${flagKey} not found` });
    }

    return response(200, flag);
  }

  // POST /features/evaluate - Evaluate flags for user
  if (path === '/features/evaluate' && method === 'POST') {
    const userContext = body || {};

    // Evaluate all enabled flags
    const evaluated = featureFlags.map(flag => evaluateFlag(flag, userContext));

    return response(200, {
      evaluated,
      userContext: {
        userId: userContext.userId || 'anonymous',
        country: userContext.country,
        device: userContext.device,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // POST /features/evaluate/:key - Evaluate single flag
  const evalKeyMatch = path.match(/^\/features\/evaluate\/([a-z0-9-]+)$/);
  if (evalKeyMatch && method === 'POST') {
    const flagKey = evalKeyMatch[1];
    const flag = featureFlags.find(f => f.key === flagKey);

    if (!flag) {
      return response(404, { error: 'Not Found', message: `Flag ${flagKey} not found` });
    }

    const userContext = body || {};
    const result = evaluateFlag(flag, userContext);

    return response(200, {
      ...result,
      flagDetails: {
        name: flag.name,
        description: flag.description,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // GET /features/segments - List segments
  if (path === '/features/segments' && method === 'GET') {
    return response(200, { segments, total: segments.length });
  }

  return response(404, { error: 'Not Found', message: 'Features endpoint not found' });
};
