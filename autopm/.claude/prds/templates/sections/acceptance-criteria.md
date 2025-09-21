---
section: "Acceptance Criteria"
description: "Testable requirements that define when user stories are complete"
required: true
dependencies: ["user-stories", "success-criteria"]
ai_prompts:
  opening: "Let's create Acceptance Criteria based on the user stories. What specific, testable requirements define when each story is complete?"
  follow_up:
    - "What are the happy path scenarios for each user story?"
    - "What error conditions need to be handled?"
    - "What validation rules should be in place?"
    - "How should the system behave in edge cases?"
    - "What feedback should users receive for each action?"
validation:
  required_elements:
    - "testable conditions"
    - "error handling"
    - "user feedback scenarios"
  quality_checks:
    - "Criteria are specific and testable"
    - "Covers both positive and negative scenarios"
    - "Maps to user stories"
    - "Includes validation and error handling"
examples:
  - "Given a user requests password reset, When they click the reset link within 24 hours, Then they should be taken to password reset form"
  - "Given a reset link has expired, When user clicks it, Then they see clear error message with option to request new link"
---

## Acceptance Criteria

<!-- This section will be filled by AI during conversation -->