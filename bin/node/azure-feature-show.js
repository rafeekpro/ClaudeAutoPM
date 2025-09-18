#!/usr/bin/env node
const featureId = process.argv[2];
if (!featureId) {
  console.log('Usage: azure-feature-show <feature-id>');
  process.exit(1);
}
console.log('Feature ID:', featureId);
