---
section: "User Stories"
description: "User-centered requirements in 'As a... I want... So that...' format"
required: true
dependencies: ["problem-statement"]
ai_prompts:
  opening: "Let's create User Stories based on the problem statement. Who are the main users affected by this problem?"
  follow_up:
    - "What specific actions do these users want to take?"
    - "What's the desired outcome for each user action?"
    - "Are there different user types with different needs? (admin, end-user, etc.)"
    - "What edge cases or error scenarios should we consider?"
validation:
  required_elements:
    - "As a... I want... So that... format"
    - "multiple user perspectives"
    - "clear user goals"
  quality_checks:
    - "Stories are user-focused, not feature-focused"
    - "Each story has clear value proposition"
    - "Stories cover main use cases from problem statement"
    - "Includes error/edge case scenarios"
examples:
  - "As a returning user, I want to receive a password reset link that doesn't expire quickly, so that I can reset my password at my convenience"
  - "As a user, I want clear feedback about link expiration, so that I know when I need to request a new link"
---

## User Stories

<!-- This section will be filled by AI during conversation -->