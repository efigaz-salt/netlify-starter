#!/bin/bash

# Load test script - makes 10K parallel requests to the API endpoint
# Each request has a unique timestamp and collects detailed statistics

TOTAL_REQUESTS=350
CONCURRENT_JOBS=100  # Number of parallel background processes
URL="https://efi-ts.netlify.app/api/akamai/api/simple"
RESULTS_FILE="/tmp/load-test-results-$$.txt"

echo "Starting load test: $TOTAL_REQUESTS requests with $CONCURRENT_JOBS concurrent jobs"
echo "Target: $URL"
echo "Start time: $(date)"
echo "Results file: $RESULTS_FILE"
echo ""

# Clean up old results file
> "$RESULTS_FILE"

# Function to make a single curl request and log results
make_request() {
  local request_num=$1
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")

  # Use curl to get detailed timing information
  local result=$(curl -s -w "%{http_code}|%{time_total}|%{time_connect}|%{time_starttransfer}" -o /dev/null \
    "$URL" \
    -H 'accept: application/json' \
    -H 'accept-language: en-GB,en-US;q=0.9,en;q=0.8' \
    -H 'content-type: application/json' \
    -H 'origin: https://efi-ts.netlify.app' \
    -H 'priority: u=1, i' \
    -H 'referer: https://efi-ts.netlify.app/akamai-test' \
    -H 'sec-ch-ua: "Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"' \
    -H 'sec-ch-ua-mobile: ?0' \
    -H 'sec-ch-ua-platform: "macOS"' \
    -H 'sec-fetch-dest: empty' \
    -H 'sec-fetch-mode: cors' \
    -H 'sec-fetch-site: same-origin' \
    -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36' \
    --data-raw "{\"test\":\"data\",\"timestamp\":\"$timestamp\",\"request_num\":$request_num}")

  # Parse the result
  IFS='|' read -r http_code time_total time_connect time_starttransfer <<< "$result"

  # Log to results file (thread-safe append)
  echo "$request_num|$http_code|$time_total|$time_connect|$time_starttransfer" >> "$RESULTS_FILE"

  # Print progress
  echo "Request $request_num: HTTP $http_code in ${time_total}s"
}

export -f make_request
export URL
export RESULTS_FILE

# Record start time
TEST_START=$(date +%s)

# Use GNU parallel if available, otherwise use xargs with background jobs
if command -v parallel &> /dev/null; then
  echo "Using GNU parallel for optimal performance"
  seq 1 $TOTAL_REQUESTS | parallel -j $CONCURRENT_JOBS make_request {}
else
  echo "Using xargs (install GNU parallel for better performance: brew install parallel)"
  seq 1 $TOTAL_REQUESTS | xargs -P $CONCURRENT_JOBS -I {} bash -c 'make_request "$@"' _ {}
fi

# Record end time
TEST_END=$(date +%s)
TEST_DURATION=$((TEST_END - TEST_START))

echo ""
echo "Load test completed at: $(date)"
echo "Total duration: ${TEST_DURATION}s"
echo ""
echo "========================================"
echo "           STATISTICS"
echo "========================================"

# Calculate basic statistics using awk
awk -F'|' '
BEGIN {
  total = 0
  success = 0
  failed = 0
  min_time = 999999
  max_time = 0
  sum_time = 0
  sum_connect = 0
  sum_ttfb = 0
}
{
  total++
  http_code = $2
  time_total = $3
  time_connect = $4
  time_ttfb = $5

  # Count success/failure
  if (http_code >= 200 && http_code < 300) {
    success++
  } else {
    failed++
    status_codes[http_code]++
  }

  # Sum for averages
  sum_time += time_total
  sum_connect += time_connect
  sum_ttfb += time_ttfb

  # Track min/max
  if (time_total < min_time) min_time = time_total
  if (time_total > max_time) max_time = time_total
}
END {
  if (total == 0) {
    print "No results to analyze"
    exit
  }

  avg_time = sum_time / total
  avg_connect = sum_connect / total
  avg_ttfb = sum_ttfb / total

  success_rate = (success / total) * 100

  # Print results
  printf "Total Requests:      %d\n", total
  printf "Successful (2xx):    %d (%.2f%%)\n", success, success_rate
  printf "Failed:              %d (%.2f%%)\n", failed, (failed/total)*100
  print ""
  printf "Response Times (seconds):\n"
  printf "  Min:               %.3fs\n", min_time
  printf "  Max:               %.3fs\n", max_time
  printf "  Average:           %.3fs\n", avg_time
  print ""
  printf "Average Connect Time:  %.3fs\n", avg_connect
  printf "Average TTFB:          %.3fs\n", avg_ttfb
  print ""

  # Calculate throughput
  printf "Throughput:            %.2f req/sec\n", total / '"$TEST_DURATION"'

  # Show error distribution if any
  if (failed > 0) {
    print ""
    print "Error Distribution:"
    for (code in status_codes) {
      printf "  HTTP %s: %d requests\n", code, status_codes[code]
    }
  }
}
' "$RESULTS_FILE"

# Calculate percentiles using sort (works on macOS)
echo ""
echo "Percentiles:"
SORTED_TIMES=$(awk -F'|' '{print $3}' "$RESULTS_FILE" | sort -n)
TOTAL_COUNT=$(echo "$SORTED_TIMES" | wc -l | tr -d ' ')

if [ "$TOTAL_COUNT" -gt 0 ]; then
  P50_LINE=$(awk "BEGIN {print int($TOTAL_COUNT * 0.50)}")
  P90_LINE=$(awk "BEGIN {print int($TOTAL_COUNT * 0.90)}")
  P95_LINE=$(awk "BEGIN {print int($TOTAL_COUNT * 0.95)}")
  P99_LINE=$(awk "BEGIN {print int($TOTAL_COUNT * 0.99)}")

  [ "$P50_LINE" -lt 1 ] && P50_LINE=1
  [ "$P90_LINE" -lt 1 ] && P90_LINE=1
  [ "$P95_LINE" -lt 1 ] && P95_LINE=1
  [ "$P99_LINE" -lt 1 ] && P99_LINE=1

  P50=$(echo "$SORTED_TIMES" | sed -n "${P50_LINE}p")
  P90=$(echo "$SORTED_TIMES" | sed -n "${P90_LINE}p")
  P95=$(echo "$SORTED_TIMES" | sed -n "${P95_LINE}p")
  P99=$(echo "$SORTED_TIMES" | sed -n "${P99_LINE}p")

  printf "  Median (p50):      %.3fs\n" "$P50"
  printf "  p90:               %.3fs\n" "$P90"
  printf "  p95:               %.3fs\n" "$P95"
  printf "  p99:               %.3fs\n" "$P99"
fi

echo ""
echo "========================================"
echo ""
echo "Raw results saved to: $RESULTS_FILE"
echo "To analyze later: awk -F'|' '{print \$3}' $RESULTS_FILE | sort -n"
