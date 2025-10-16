#!/usr/bin/env bash
# Prometheus health and metrics check
# Usage: ./prometheus-health-check.sh [prometheus-url]

set -euo pipefail

PROMETHEUS_URL="${1:-http://localhost:9090}"

echo "📊 Checking Prometheus health at ${PROMETHEUS_URL}..."

# Check Prometheus is reachable
if ! curl -sf "${PROMETHEUS_URL}/-/healthy" > /dev/null; then
    echo "❌ Prometheus is not healthy or not reachable"
    exit 1
fi

echo "✅ Prometheus is healthy"

# Check readiness
if curl -sf "${PROMETHEUS_URL}/-/ready" > /dev/null; then
    echo "✅ Prometheus is ready"
else
    echo "⚠️  Prometheus is not ready yet"
fi

# Get Prometheus version
echo ""
echo "📋 Prometheus build info:"
curl -s "${PROMETHEUS_URL}/api/v1/status/buildinfo" | jq -r '.data'

# Check targets
echo ""
echo "🎯 Checking scrape targets..."
TARGETS=$(curl -s "${PROMETHEUS_URL}/api/v1/targets" | jq -r '.data.activeTargets | length')
echo "  Active targets: ${TARGETS}"

# Check alerting rules
echo ""
echo "🚨 Checking alert rules..."
ALERT_GROUPS=$(curl -s "${PROMETHEUS_URL}/api/v1/rules" | jq -r '.data.groups | length')
echo "  Alert rule groups: ${ALERT_GROUPS}"

# Check active alerts
ACTIVE_ALERTS=$(curl -s "${PROMETHEUS_URL}/api/v1/alerts" | jq -r '.data.alerts | map(select(.state == "firing")) | length')
if [ "$ACTIVE_ALERTS" -gt 0 ]; then
    echo "  ⚠️  Active firing alerts: ${ACTIVE_ALERTS}"
    curl -s "${PROMETHEUS_URL}/api/v1/alerts" | jq -r '.data.alerts[] | select(.state == "firing") | "    - " + .labels.alertname + ": " + .annotations.summary'
else
    echo "  ✅ No firing alerts"
fi

# Check TSDB status
echo ""
echo "💾 TSDB status:"
curl -s "${PROMETHEUS_URL}/api/v1/status/tsdb" | jq -r '.data'

echo ""
echo "✅ Prometheus health check complete"
