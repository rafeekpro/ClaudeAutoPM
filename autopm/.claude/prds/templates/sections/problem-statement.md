---
section: "Problem Statement"
description: "Describes the core user/business problem this feature solves"
required: true
dependencies: []
ai_prompts:
  opening: "Let's work on the Problem Statement. What specific user or business problem are we solving with this feature?"
  follow_up:
    - "Can you describe how users currently work around this problem?"
    - "What's the business impact? (support load, lost revenue, user frustration)"
    - "Do you have any data or metrics that show the scope of this problem?"
    - "How frequently does this problem occur?"
validation:
  required_elements:
    - "specific user pain point"
    - "business impact"
    - "current state description"
  quality_checks:
    - "Problem is clearly defined"
    - "Impact is quantified where possible"
    - "Avoids solution language"
examples:
  - "Users currently experience frequent authentication failures due to overly strict password policies..."
  - "Customer support receives 40% more tickets related to account access issues..."
---

## Problem Statement

<!-- This section will be filled by AI during conversation -->