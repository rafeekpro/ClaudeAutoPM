---
section: "Success Criteria"
description: "Measurable outcomes that define feature success"
required: true
dependencies: ["problem-statement"]
ai_prompts:
  opening: "Now let's define Success Criteria. Based on the problem described, what measurable outcomes would show this feature succeeded?"
  follow_up:
    - "What specific metrics would improve? (conversion rates, support tickets, user satisfaction)"
    - "What target numbers are realistic? (% improvement, absolute values)"
    - "What timeline are we aiming for? (30 days, quarter, etc.)"
    - "How will we measure user satisfaction or experience improvements?"
validation:
  required_elements:
    - "measurable metrics"
    - "target values"
    - "timeframe"
  quality_checks:
    - "Metrics are specific and measurable"
    - "Targets are realistic"
    - "Relates back to stated problem"
    - "Includes both business and user metrics"
examples:
  - "Reduce failed authentication attempts from 30% to <10% within 30 days"
  - "Achieve >90% password reset completion rate on first attempt"
  - "25% reduction in auth-related support tickets within first quarter"
---

## Success Criteria

<!-- This section will be filled by AI during conversation -->