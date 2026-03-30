# XML Prompt Templates Registry

Staged workflow templates for structured prompt generation via `lib/xml-prompt-builder.js`.

## Stages

| Stage | File | Purpose |
|-------|------|---------|
| 1 - Architecture | `arch/stage1-architectural-planning.xml` | System design, component layout, data flow |
| 1 - PRD to Epic | `arch/prd-to-epic.xml` | Convert PRD to technical epic with task breakdown |
| 2 - Code Gen | `dev/stage2-code-generation.xml` | Implementation from architectural plan |
| 2 - API Endpoint | `dev/api-endpoint.xml` | Specific API endpoint implementation |
| 3 - Testing | `test/stage3-test-creation.xml` | Test suite creation from implementation |
| 3 - Test Suite | `test/test-suite.xml` | Comprehensive test suite template |
| 4 - Refactor | `refactor/stage4-refactoring.xml` | Code improvement post-tests |
| 5 - Documentation | `doc/stage5-documentation.xml` | Documentation generation |

## Usage

```javascript
const { XMLPromptBuilder } = require('.claude/lib/xml-prompt-builder');
const builder = new XMLPromptBuilder();

const prompt = builder.build('arch/prd-to-epic.xml', {
  task: 'Convert authentication PRD',
  context: 'FastAPI backend with React frontend',
  requirements: ['JWT auth', 'OAuth2', 'Rate limiting']
});
```

## Template Variables

Templates use Handlebars-like syntax:
- `{{variable}}` — simple substitution
- `{{#each items}}...{{/each}}` — array iteration
- `{{#if condition}}...{{/if}}` — conditional blocks

## Relationship to Issue Decomposition

YAML templates in `issue-decomposition/` define team composition (which agents work on what).
XML templates here define the prompt structure for each development stage.

- `api.yaml` uses: `arch/stage1-architectural-planning.xml`, `dev/api-endpoint.xml`, `test/test-suite.xml`
- `crud.yaml` uses: `arch/stage1-architectural-planning.xml`, `dev/stage2-code-generation.xml`, `test/stage3-test-creation.xml`
- `ui-feature.yaml` uses: `dev/stage2-code-generation.xml`, `test/stage3-test-creation.xml`
- `auth.yaml` uses: `arch/prd-to-epic.xml`, `dev/stage2-code-generation.xml`, `test/test-suite.xml`
- `default.yaml` uses: `arch/stage1-architectural-planning.xml`, `dev/stage2-code-generation.xml`, `test/stage3-test-creation.xml`
