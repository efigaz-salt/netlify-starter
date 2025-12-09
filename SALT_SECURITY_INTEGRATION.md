# Salt Security Integration

This document explains how the Salt Security collector is integrated into the Netlify Edge Functions to capture and analyze API traffic.

## Overview

The Salt Security collector is integrated as a Netlify Edge Function that runs on all `/api/*` requests, capturing traffic data and sending it to the Salt Security platform for analysis and threat detection.

## Architecture

### Traffic Flow with Salt Security

```
Client Request
    ↓
┌─────────────────────────────────────────┐
│ Edge Function 1: security.ts            │
│ - CORS validation                       │
│ - Rate limiting                         │
│ - Security headers                      │
│ - Trace ID generation                   │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ Edge Function 2: salt-collector.ts      │  ← Salt Security Integration
│ - Captures request/response             │
│ - Sends to Salt Security platform       │
│ - Non-blocking (fire-and-forget)        │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ Edge Function 3: api-router.ts          │
│ - Routes to API Gateway or Lambda       │
│ - Retry logic                           │
│ - Error handling                        │
└────────────────┬────────────────────────┘
                 ↓
           Backend (AWS)
```

### Edge Function Order

The edge functions are executed in the order defined in `netlify.toml`:

1. **security.ts** (`/*`) - Global security layer
2. **salt-collector.ts** (`/api/*`) - Traffic collection for Salt Security
3. **api-router.ts** (`/api/*`) - Backend routing

This order ensures:
- Security checks happen first (rate limiting, CORS)
- Salt Security captures the complete request/response
- API routing happens last, after all processing

## Implementation

### Salt Collector Edge Function

Location: `netlify/edge-functions/salt-collector.ts`

```typescript
import { createCollector } from '@saltsecurity/netlify-collector';
import type { Context } from '@netlify/edge-functions';

const collector = createCollector({
  hybridUrl: Netlify.env.get('SALT_HYBRID_URL')!,
  hybridToken: Netlify.env.get('SALT_HYBRID_TOKEN')!,
  debug: Netlify.env.get('SALT_DEBUG') === 'true',

  collectorUuid: 'netlify-edge-001',
  collectorVersion: '0.1.0-efi-test-8',
  collectorPlatform: 'netlify',
  collectorLabels: {
    environment: Netlify.env.get('CONTEXT') || 'production',
    site: Netlify.env.get('SITE_NAME') || 'unknown',
  },
});

export default async (request: Request, context: Context) => {
  const response = await context.next();
  return await collector.collect(request, response);
};
```

### Key Features

1. **Non-Blocking**: The collector uses a fire-and-forget approach, not blocking the response to the client
2. **Metadata-Rich**: Includes environment, site name, and deployment context
3. **Path-Specific**: Only runs on `/api/*` paths to capture API traffic
4. **Debug Mode**: Optional debug logging for troubleshooting

## Configuration

### Environment Variables

Set these in the Netlify Dashboard under **Site Settings → Environment Variables**:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `SALT_HYBRID_URL` | Yes | Salt Security hybrid endpoint URL | `https://hybrid.saltsecurity.io` |
| `SALT_HYBRID_TOKEN` | Yes | Authentication token for Salt Security | `sk_prod_abc123...` |
| `SALT_DEBUG` | No | Enable debug logging (default: false) | `true` or `false` |
| `SALT_HYBRID_CA` | No | Custom CA certificate for HTTPS (PEM format, single-line with `\n`) | `-----BEGIN CERTIFICATE-----\n...` |

### Custom CA Certificate

If your Salt Security hybrid endpoint uses a custom or self-signed certificate, you need to provide the CA certificate:

**Format Requirements:**
- PEM format certificate
- Single-line string with literal `\n` for newlines
- Include both `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----`

**How to Format:**

1. Start with your multi-line PEM certificate:
   ```
   -----BEGIN CERTIFICATE-----
   MIIFhDCCA2wCCQCwefZ+P7exgzANBgkqhkiG9w0BAQsFADCBgzELMAkGA1UEBhMC
   VVMxEzARBgNVBAgMCkNhbGlmb3JuaWExEjAQBgNVBAcMCVBhbG8gQWx0bzEdMBsG
   ...
   -----END CERTIFICATE-----
   ```

2. Convert to single-line with `\n`:
   ```bash
   SALT_HYBRID_CA=-----BEGIN CERTIFICATE-----\nMIIFhDCCA2wCCQCwefZ+...\n-----END CERTIFICATE-----
   ```

3. Set in `.env` or Netlify environment variables

**Alternative: Using a File (for complex certificates):**

If you prefer, you can store the certificate in a file and read it in your code, but for Netlify environment variables, the single-line format is required.

### Local Development

For local testing with `netlify dev`:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your Salt Security credentials:
   ```bash
   SALT_HYBRID_URL=https://your-hybrid-url.saltsecurity.io
   SALT_HYBRID_TOKEN=your-hybrid-token-here
   SALT_DEBUG=true  # Optional: enable for local debugging
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```

### Production Deployment

For production deployments:

1. Go to **Netlify Dashboard → Site Settings → Environment Variables**
2. Add the three Salt Security variables
3. Deploy your site - the edge function will automatically use these values

### Environment-Specific Configuration

You can set different values per environment:

```toml
# netlify.toml
[context.production.environment]
  SALT_DEBUG = "false"

[context.staging.environment]
  SALT_DEBUG = "true"

[context.development.environment]
  SALT_DEBUG = "true"
```

## What Gets Captured

The Salt Security collector captures:

### Request Data
- HTTP method (GET, POST, PUT, DELETE, etc.)
- URL path and query parameters
- Request headers
- Request body (for POST/PUT/PATCH requests)
- Client IP address (from edge function context)
- Timestamp

### Response Data
- HTTP status code
- Response headers
- Response body
- Response timing

### Metadata
- Collector UUID: `netlify-edge-001`
- Collector version: `0.1.0-efi-test-8`
- Platform: `netlify`
- Environment context (production, staging, development)
- Site name
- Deployment URL/region

## Testing

### Test the Integration

1. **Make an API request**:
   ```bash
   curl https://your-site.netlify.app/api/health
   ```

2. **Check Salt Security Dashboard**:
   - Log into your Salt Security dashboard
   - Verify that traffic is being captured
   - Check for any detected anomalies or threats

3. **Enable debug mode** (development only):
   ```bash
   # In .env
   SALT_DEBUG=true
   ```

   Then check the Netlify Functions logs for debug output.

### Verify Edge Function Execution

Check the Netlify Functions logs:

```bash
netlify functions:log
```

Look for logs from `salt-collector` to verify it's running.

## Traffic Analysis

The Salt Security platform will analyze captured traffic for:

- **API Security Threats**: Injection attacks, authentication bypasses, etc.
- **Data Leakage**: Sensitive data exposure in responses
- **Anomalous Behavior**: Unusual patterns in API usage
- **Business Logic Flaws**: Attacks on application logic
- **OWASP API Top 10**: Detection of common API vulnerabilities

## Performance Impact

The Salt Security collector is designed for minimal performance impact:

- **Non-blocking**: Uses fire-and-forget pattern
- **Async processing**: Doesn't wait for Salt Security response
- **Edge-native**: Runs at Netlify's global edge locations
- **Lightweight**: Minimal CPU and memory overhead

**Expected Latency**: < 5ms added to response time

## Troubleshooting

### Collector Not Sending Data

1. **Check environment variables**:
   ```bash
   netlify env:list
   ```
   Verify `SALT_HYBRID_URL` and `SALT_HYBRID_TOKEN` are set.

2. **Enable debug mode**:
   Set `SALT_DEBUG=true` and check logs for errors.

3. **Verify edge function is deployed**:
   Check `netlify.toml` includes the `salt-collector` edge function.

4. **Check network connectivity**:
   Ensure your Netlify site can reach the Salt Security endpoint.

### Debug Mode Not Working

- Debug mode only works in development/staging contexts
- Check that `SALT_DEBUG=true` is set in your environment
- View logs with `netlify dev` or in the Netlify dashboard

### Traffic Not Appearing in Salt Dashboard

1. Verify the `SALT_HYBRID_TOKEN` is correct
2. Check that the `SALT_HYBRID_URL` endpoint is reachable
3. Ensure the edge function is running on the correct paths (`/api/*`)
4. Check Salt Security dashboard for any connection errors

## Security Considerations

### Credentials Management

- **Never commit** `.env` file to version control (already in `.gitignore`)
- Store credentials in Netlify's secure environment variables
- Rotate `SALT_HYBRID_TOKEN` regularly
- Use different tokens for staging and production

### Data Privacy

The collector captures:
- ✅ Request/response data for security analysis
- ✅ Headers (may contain sensitive tokens - filtered by Salt Security)
- ✅ Request bodies (may contain PII - handled according to your Salt Security policy)

Ensure compliance with:
- GDPR (if applicable)
- Your organization's data privacy policies
- Salt Security's data handling agreements

### Network Security

- All traffic to Salt Security is sent over HTTPS
- Edge functions run in Netlify's secure environment
- No data is stored locally on edge nodes

## Package Information

**Package**: `@saltsecurity/netlify-collector`
**Version**: `0.1.0-efi-test-8`
**Source**: `https://efi-test-pulic-read-salt-cng.s3.amazonaws.com/netlify/netlify-collector/latest/saltsecurity-netlify-collector.tgz`

### Installation

The package is installed via npm from the S3 bucket:

```json
{
  "dependencies": {
    "@saltsecurity/netlify-collector": "https://efi-test-pulic-read-salt-cng.s3.amazonaws.com/netlify/netlify-collector/latest/saltsecurity-netlify-collector.tgz"
  }
}
```

### Updates

To update to the latest version:

```bash
npm install @saltsecurity/netlify-collector@https://efi-test-pulic-read-salt-cng.s3.amazonaws.com/netlify/netlify-collector/latest/saltsecurity-netlify-collector.tgz
```

## Monitoring

### Key Metrics to Monitor

1. **Collection Success Rate**: Percentage of requests successfully sent to Salt Security
2. **Edge Function Errors**: Check Netlify Functions logs for any errors
3. **Performance Impact**: Monitor response times before/after integration
4. **Salt Security Dashboard**: Check for captured traffic and detected threats

### Health Checks

The collector doesn't affect health check endpoints - if Salt Security is unreachable, requests still complete successfully.

## Support

For issues or questions:

- **Netlify Edge Functions**: [Netlify Support](https://www.netlify.com/support/)
- **Salt Security Collector**: Contact your Salt Security support team
- **This Integration**: Check project documentation or contact the dev team

## Further Reading

- [Netlify Edge Functions Documentation](https://docs.netlify.com/edge-functions/overview/)
- [Salt Security Platform Documentation](https://docs.saltsecurity.com/)
- [API Request Types Documentation](./API_REQUEST_TYPES.md)
- [Project Plan](./plan.md)
