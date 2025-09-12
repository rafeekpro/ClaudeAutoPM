# UX Design Rules

## MANDATORY PRINCIPLES

### 1. User-First Approach
- ALWAYS validate designs with user research or testing
- NEVER assume user behavior without data
- ALWAYS consider edge cases and error states
- NEVER sacrifice usability for aesthetics

### 2. Accessibility is Non-Negotiable
- WCAG 2.1 AA is the minimum standard
- Every interaction must be keyboard accessible
- Color must never be the only indicator
- Alt text and ARIA labels are mandatory
- Test with screen readers

### 3. Performance is UX
- 3-second rule for initial load
- 100ms response for user interactions
- Optimize images and assets
- Implement progressive loading
- Monitor Core Web Vitals

### 4. Mobile-First Design
- Start with mobile constraints
- Touch targets minimum 44x44px (iOS) or 48x48px (Android)
- Consider thumb reach zones
- Account for various screen sizes
- Test on real devices

### 5. Consistency Over Creativity
- Follow established patterns in the system
- Maintain consistent spacing, colors, typography
- Reuse components before creating new ones
- Document any new patterns introduced

## PROHIBITED PRACTICES

### Never:
- Use placeholder text as labels
- Disable browser zoom
- Hide important content behind hover
- Use auto-playing media with sound
- Create custom scrollbars without necessity
- Implement infinite scroll without alternatives
- Use justified text alignment for body content
- Create forms without validation feedback
- Implement dark patterns or deceptive UX
- Ignore browser back button behavior

## DESIGN EVALUATION CRITERIA

### Before Implementation
1. **Purpose Clear**: Can users understand the purpose within 5 seconds?
2. **Task Completion**: Can users complete primary tasks without help?
3. **Error Recovery**: Can users recover from mistakes easily?
4. **Accessibility**: Does it pass automated accessibility checks?
5. **Performance**: Will it meet performance budgets?

### After Implementation
1. **Usability Testing**: Has it been tested with real users?
2. **Analytics Review**: Are success metrics improving?
3. **Accessibility Audit**: Manual testing completed?
4. **Device Testing**: Verified on target devices?
5. **A/B Testing**: Validated against alternatives?

## INFORMATION HIERARCHY

### Content Organization
- F-pattern for text-heavy pages
- Z-pattern for landing pages
- Progressive disclosure for complex information
- Chunking for better comprehension
- Visual hierarchy through size, color, spacing

### Navigation Rules
- Maximum 7±2 items in primary navigation
- Breadcrumbs for deep hierarchies
- Search for content-heavy sites
- Clear active states
- Predictable placement

## INTERACTION DESIGN RULES

### Feedback & Response
- Immediate feedback for all interactions (<100ms)
- Loading indicators for operations >1 second
- Success/error messages clearly visible
- Progress indicators for multi-step processes
- Confirmation for destructive actions

### Form Design
- One column layout for better completion
- Inline validation where possible
- Clear error messages with solutions
- Optional fields clearly marked
- Smart defaults and auto-complete
- Progress save for long forms

## VISUAL DESIGN STANDARDS

### Typography
- Maximum 2-3 typefaces
- 16px minimum for body text
- 45-75 characters per line for readability
- 1.5x line height for body text
- Sufficient contrast (4.5:1 for normal text)

### Color Usage
- Maximum 3-4 primary colors
- 60-30-10 rule for color distribution
- Consider color blindness (8% of men)
- Test in grayscale
- Maintain brand consistency

### Spacing & Layout
- 8-point grid system
- Consistent padding and margins
- Adequate white space (30-40% minimum)
- Logical grouping with proximity
- Responsive breakpoints at standard sizes

## CONVERSION OPTIMIZATION

### Call-to-Action
- One primary CTA per view
- Action-oriented text
- Contrasting colors
- Adequate size and padding
- Above the fold placement for critical CTAs

### Trust Signals
- Security badges for payments
- Customer testimonials
- Clear return policies
- Contact information visible
- Professional design quality

## TESTING REQUIREMENTS

### Usability Testing
- 5 users minimum for qualitative insights
- Task-based scenarios
- Think-aloud protocol
- Success rate measurement
- Time-on-task tracking

### A/B Testing
- Statistical significance required
- Test one variable at a time
- Run for complete business cycles
- Consider seasonal variations
- Document learnings

## DOCUMENTATION STANDARDS

### Design Specifications
- Exact measurements and spacing
- Color codes and opacity values
- Font sizes and weights
- Animation durations and easing
- Interaction states (hover, active, focus, disabled)

### Handoff Requirements
- Exported assets in required formats
- Design tokens documented
- Component behavior described
- Edge cases specified
- Accessibility requirements noted

## CONTEXT OPTIMIZATION

### When Analyzing Designs
- Return key issues and recommendations only
- Prioritize problems by impact
- Provide specific, actionable feedback
- Reference established principles
- Include quick wins and long-term improvements

### When Implementing Designs
- Focus on changed elements only
- Reference existing patterns
- Document new patterns created
- Note accessibility implementations
- Track performance impacts