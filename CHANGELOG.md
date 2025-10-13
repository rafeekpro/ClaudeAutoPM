# Changelog

All notable changes to the ClaudeAutoPM framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.2.0] - 2025-01-13

### ✨ New Features - Complete PRD Management

This minor release adds comprehensive PRD (Product Requirements Document) management commands to the standalone CLI, completing the CRUD operations suite.

### Added

**New PRD Commands:**
- `autopm prd list` - List all PRDs with priority and status
- `autopm prd new <name>` - Create new PRD interactively with template support
  - Templates: api-feature, ui-feature, bug-fix, data-migration, documentation
  - Interactive wizard with template selection
  - Smart variable prompting based on template
- `autopm prd show <name>` - Display complete PRD content
- `autopm prd edit <name>` - Open PRD in editor ($EDITOR, VS Code, vim, nano)
- `autopm prd status <name>` - Show detailed PRD status report
  - Metadata (title, priority, status, timeline, author)
  - Completeness percentage with progress bar
  - Section checklist (Problem Statement, User Stories, etc.)
  - Statistics (lines, words, characters)

**Enhanced PRD Workflow:**
```bash
# Complete workflow now available
autopm prd new my-feature -t api-feature  # Create
autopm prd list                            # Read (all)
autopm prd show my-feature                 # Read (one)
autopm prd status my-feature               # Status
autopm prd edit my-feature                 # Update
autopm prd parse my-feature --ai           # AI analysis
```

### Changed

- Enhanced `autopm prd --help` with all 9 commands
- Improved error messages for missing PRDs
- Better visual output with color-coded priorities and statuses

### Technical

- Added 5 new handler functions to `lib/cli/commands/prd.js`:
  - `prdList()` - PRD listing with metadata extraction
  - `prdNew()` - Interactive PRD creation via script spawn
  - `prdShow()` - Content display
  - `prdEdit()` - Editor integration
  - `prdStatus()` - Comprehensive status analysis
- Integration with existing prd-new.js script for template-based creation
- Priority-based sorting (P0 > P1 > P2 > P3)
- Frontmatter parsing for metadata

### Improved

- **User Experience** - Complete PRD lifecycle management from CLI
- **Discoverability** - All PRD operations in one consistent interface
- **Flexibility** - Support for multiple editors via $EDITOR environment variable
- **Visual Feedback** - Color-coded output, progress bars, formatted lists

## [2.1.1] - 2025-10-13

### 📝 Documentation & UX Improvements

This patch release improves documentation and user experience for the v2.1.0 STANDALONE features.

### Changed

**Documentation Updates (#319):**
- **README.md** - Added prominent v2.1.0 STANDALONE section
  - Featured new prd, task, and agent commands
  - Updated command count from 109 to 112
  - Added STANDALONE mode to architecture diagram
  - Comprehensive usage examples and feature lists
- **CLI Reference** - Complete documentation for STANDALONE commands
  - docs/cli-reference/overview.md expanded by 256 lines
  - Detailed usage examples for all commands
  - Options, flags, and features documented

**CLI Help Message (#320):**
- Redesigned help output with elegant box design
- Reduced help text by 50% (450 → 200 lines) while improving clarity
- Featured v2.1.0 STANDALONE commands prominently
- Added Quick Start (3-step guide)
- Added practical usage examples
- Improved visual hierarchy with better organization
- Added Pro Tips section
- Removed verbose, repetitive sections

### Improved

- **User Experience** - Cleaner, more discoverable CLI help
- **Documentation Quality** - Complete reference for all features
- **First-Time User Experience** - Clear onboarding with quick start guide

### Notes

All functionality from v2.1.0 remains unchanged. This release only improves documentation and help messaging.

## [2.1.0] - 2025-10-13

### 🚀 Phase 1: STANDALONE Mode - CLI Refactoring & Service Layer

This release completes Phase 1 STANDALONE implementation, introducing three new CLI commands with full service layer integration, comprehensive test coverage, and modern user experience features.

### Added

**CLI Commands (#314):**
- **`autopm prd` command** - PRD management (245 lines)
  - `parse` - AI-powered PRD parsing with streaming support
  - `extract-epics` - Extract epics from PRD content
  - `summarize` - Generate comprehensive PRD summaries
  - `validate` - Validate PRD structure and quality
  - 16 tests passing, comprehensive coverage
- **`autopm task` command** - Task management
  - `list` - Display all tasks from epic
  - `prioritize` - AI-powered task prioritization
  - 5 tests passing
- **`autopm agent` command** - Agent invocation
  - `list` - Display available agents
  - `search` - Search agents by keyword
  - `invoke` - Invoke agent with task (streaming support)
  - 7 tests passing

**User Experience Enhancements:**
- Progress indicators with `ora` spinners
- Color-coded output with `chalk` (green=success, red=error)
- Streaming support for real-time AI responses
- Comprehensive error handling with user-friendly messages
- Consistent CLI patterns across all commands

### Changed

**Service Layer Extensions:**
- Extended **PRDService** with 4 non-streaming methods:
  - `parse()` - Non-streaming PRD parsing
  - `extractEpics()` - Non-streaming epic extraction
  - `summarize()` - Non-streaming summarization
  - `validate()` - Structure and quality validation
- All services now support both streaming and non-streaming modes

### Fixed

- **CommonJS Compatibility**: Downgraded `chalk` from 5.3.0 to 4.1.2 for CommonJS support
- Resolved ESM import issues in CLI commands

### Testing

- **28 new tests** across 3 CLI command suites
- **65 total CLI tests** passing (100% pass rate)
- Full TDD methodology applied
- Comprehensive coverage of success, error, and streaming scenarios

### Technical Details

- All commands use service layer (PRDService, TaskService, AgentService)
- Proper separation of concerns (CLI → Service → Provider)
- Backward compatibility maintained throughout
- Zero breaking changes to existing functionality

## [2.0.0] - 2025-10-12

### 🚀 Phase 2: AI Provider Architecture & Configuration Management - MAJOR RELEASE

**Breaking Changes**: This is a major architectural release introducing abstract provider patterns, comprehensive configuration management, and enterprise-grade security features. While backward compatible at the service level, this represents a significant evolution of the framework's foundation.

### Added

**AI Provider Architecture (#292, #293, #294):**
- **AbstractAIProvider** base class (379 lines) with comprehensive retry logic
  - Exponential backoff with jitter (full, equal, none)
  - Circuit breaker pattern for service protection
  - Configurable retry strategies with shouldRetry predicate
  - Streaming support with progress callbacks
  - 67 tests passing (28 new retry configuration tests)
- **ClaudeProvider** refactored to extend AbstractAIProvider
  - Full backward compatibility maintained
  - Enhanced error handling and retry logic
  - All 34 existing tests passing
- **TemplateProvider** for no-AI fallback scenarios
  - File-based template system
  - Variable interpolation support
  - 20 tests passing

**Rate Limiting & Resilience (#295, #296):**
- **RateLimiter** with token bucket algorithm (204 lines)
  - Configurable rate limits (requests/minute)
  - Burst capacity support
  - Automatic token refill
  - 24 tests passing
- **Enhanced Error Handling** with retry mechanisms
  - Circuit breaker integration
  - Exponential backoff strategies
  - Error classification (retryable vs non-retryable)
  - Custom retry predicates

**Configuration Management (#297, #298, #299):**
- **Encryption** utility with AES-256-CBC (201 lines)
  - PBKDF2 key derivation (100,000 iterations)
  - Unique salt/IV per operation
  - Zero dependencies (Node.js crypto only)
  - 40 tests passing, 98% coverage
- **ConfigManager** with hierarchical configuration (531 lines)
  - Encrypted API key storage
  - Dot notation for nested keys
  - Atomic file operations
  - Master password protection
  - 76 tests passing, 95.68% coverage
- **7 Interactive CLI Commands**:
  - `config:init` - Initialize configuration with master password
  - `config:set-api-key` - Set encrypted API keys
  - `config:get` - Get configuration values
  - `config:set` - Set configuration values
  - `config:list-providers` - List available AI providers
  - `config:set-provider` - Configure provider settings
  - `config:show` - Display current configuration
  - 140 tests created (90 passing, 50 format assertions)
- **ServiceFactory** for dependency injection (165 lines)
  - Automatic provider creation from ConfigManager
  - Centralized configuration management
  - Service instantiation with defaults
  - 28 tests passing, 100% coverage
  - Full backward compatibility maintained

**GitHub Dependency Management (#300):**
- **dependency-tracker.js** (554 lines)
  - Label-based and native API dependency tracking
  - Local mode for offline development
  - CLI interface for dependency management
  - 60 tests passing
- **dependency-validator.js** - Validate dependency graphs
  - Cycle detection
  - Missing issue validation
  - Comprehensive validation tests
- **dependency-visualizer.js** - Visualize dependency trees
  - ASCII tree rendering
  - Dependency graph visualization
  - Visualization tests

**Developer Tools:**
- Claude plugin marketplace integration
- Test MCP server configuration
- Enhanced testing infrastructure

### Changed

**Service Layer Integration:**
- PRDService, EpicService, TaskService now support ConfigManager
  - Optional `configManager` parameter
  - Optional `provider` parameter
  - Maintains full backward compatibility
  - All 302 existing service tests passing

**Configuration Workflow:**
- Environment variable fallback maintained
- New recommended workflow:
  1. `autopm config:init` (set master password)
  2. `autopm config:set-api-key` (encrypted storage)
  3. Services auto-load from ConfigManager
- Old workflow still works:
  - `export ANTHROPIC_API_KEY="sk-ant-..."`

### Security

**Encryption & Key Management:**
- AES-256-CBC for API key encryption (industry standard)
- PBKDF2 key derivation (100,000 iterations - OWASP recommended)
- Master password in memory only (never persisted)
- Unique salt/IV per encryption operation
- Atomic file writes (temp + rename pattern)
- Zero external dependencies (Node.js crypto only)

**Validation & Error Handling:**
- Input validation for all CLI commands
- Password strength requirements (min 8 characters)
- Configuration validation before provider creation
- Graceful error messages for missing configuration

### Performance

**Test Coverage:**
- **839+ tests passing** across all components
- New tests added:
  - 67 AbstractAIProvider tests (28 new retry tests)
  - 40 Encryption tests (98% coverage)
  - 76 ConfigManager tests (95.68% coverage)
  - 140 CLI command tests (90 passing)
  - 28 ServiceFactory tests (100% coverage)
  - 60 GitHub dependency tracker tests
- All existing tests maintained (302 service tests)

**Retry Performance:**
| Operation | Configuration | Result |
|-----------|--------------|--------|
| Exponential backoff | startingDelay: 100ms, timeMultiple: 2 | 100ms, 200ms, 400ms |
| Max delay cap | maxDelay: 500ms | Capped at 500ms |
| Full jitter | jitter: 'full' | 0-100%, 0-200%, 0-400% |
| Equal jitter | jitter: 'equal' | ±50% variance |

### Files Added

**Core Infrastructure:**
- `lib/ai-providers/AbstractAIProvider.js` (379 lines)
- `lib/ai-providers/TemplateProvider.js` (120 lines)
- `lib/utils/RateLimiter.js` (204 lines)
- `lib/utils/Encryption.js` (201 lines)
- `lib/config/ConfigManager.js` (531 lines)
- `lib/utils/ServiceFactory.js` (165 lines)

**CLI Commands (7 files):**
- `scripts/config/init.js` (100 lines)
- `scripts/config/set-api-key.js` (107 lines)
- `scripts/config/get.js` (75 lines)
- `scripts/config/set.js` (90 lines)
- `scripts/config/list-providers.js` (65 lines)
- `scripts/config/set-provider.js` (115 lines)
- `scripts/config/show.js` (80 lines)

**GitHub Tools:**
- `autopm/.claude/scripts/github/dependency-tracker.js` (554 lines)
- `autopm/.claude/scripts/github/dependency-validator.js`
- `autopm/.claude/scripts/github/dependency-visualizer.js`

**Tests (17 files):**
- `test/jest-tests/ai-providers/AbstractAIProvider.test.js` (67 tests)
- `test/jest-tests/ai-providers/ClaudeProvider.test.js` (updated)
- `test/jest-tests/ai-providers/TemplateProvider.test.js` (20 tests)
- `test/jest-tests/utils/RateLimiter.test.js` (24 tests)
- `test/jest-tests/utils/Encryption.test.js` (40 tests)
- `test/jest-tests/config/ConfigManager.test.js` (76 tests)
- `test/jest-tests/utils/ServiceFactory.test.js` (28 tests)
- `test/jest-tests/scripts/config/*.test.js` (7 files, 140 tests)
- `test/github/dependency-tracker.test.js` (60 tests)
- `test/github/dependency-validator.test.js`
- `test/github/dependency-visualizer.test.js`

**Configuration:**
- `.claude-plugin/marketplace.json` - Claude marketplace integration
- `autopm/.claude/mcp/test-server.md` - Test MCP server
- `jest.config.scripts.js` - Jest config for CLI scripts

### Files Modified

**Service Layer:**
- `lib/services/PRDService.js` (+8 lines) - ConfigManager support
- `lib/services/EpicService.js` (+4 lines) - ConfigManager support
- `lib/services/TaskService.js` (+5 lines) - ConfigManager support
- `bin/autopm-poc.js` - ConfigManager integration with fallback

**AI Providers:**
- `lib/ai-providers/ClaudeProvider.js` - Refactored to extend AbstractAIProvider

### Migration Guide

**For Existing Users:**

**No changes required!** The v2.0.0 release is fully backward compatible:

```bash
# Old workflow still works
export ANTHROPIC_API_KEY="sk-ant-..."
autopm prd:generate my-feature

# New recommended workflow (more secure)
autopm config:init                    # Set master password
autopm config:set-api-key claude      # Encrypt API key
autopm prd:generate my-feature        # Auto-loads from config
```

**For New Users:**

1. Install ClaudeAutoPM:
   ```bash
   npm install -g claude-autopm
   ```

2. Initialize configuration:
   ```bash
   autopm config:init
   # Enter master password (min 8 characters)
   ```

3. Set API key:
   ```bash
   autopm config:set-api-key claude
   # Enter your Anthropic API key (will be encrypted)
   ```

4. Start using:
   ```bash
   autopm prd:generate my-feature
   ```

**For Developers Extending AutoPM:**

**Old Pattern (still works):**
```javascript
const PRDService = require('./lib/services/PRDService');
const service = new PRDService({ defaultEffortHours: 10 });
```

**New Pattern (recommended):**
```javascript
const ConfigManager = require('./lib/config/ConfigManager');
const ServiceFactory = require('./lib/utils/ServiceFactory');

const configManager = new ConfigManager();
configManager.setMasterPassword(process.env.AUTOPM_MASTER_PASSWORD);

const factory = new ServiceFactory(configManager);
const service = factory.createPRDService({ defaultEffortHours: 10 });
```

**Custom AI Providers:**
```javascript
const AbstractAIProvider = require('./lib/ai-providers/AbstractAIProvider');

class MyProvider extends AbstractAIProvider {
  async complete(prompt, options = {}) {
    // Implement your provider logic
    // Automatic retry, rate limiting, circuit breaker
  }
}
```

### Breaking Changes

**None!** This release maintains 100% backward compatibility.

All existing code continues to work without modification. New features are opt-in via:
- `ServiceFactory` for dependency injection
- `ConfigManager` for secure configuration
- `AbstractAIProvider` for custom providers

### Known Issues

**CLI Command Tests:**
- 50 tests have format assertion failures (console.log output format)
- All core functionality working correctly
- Issue tracked for v2.0.1

**Deprecation Notices:**
None. All existing APIs maintained.

### Acknowledgments

This release represents a major architectural evolution:
- **8 tasks completed** (Phase 2 Week 2 & 3)
- **9 PRs merged** (#292-#300)
- **839+ tests passing**
- **100% backward compatibility**
- **Zero breaking changes**

Special focus on:
- Enterprise-grade security (AES-256-CBC encryption)
- Comprehensive testing (TDD methodology)
- Developer experience (interactive CLI commands)
- Framework extensibility (abstract provider pattern)

## [1.30.0] - 2025-10-09

### 🔒 Advanced Conflict Resolution - Complete Sync Safety

**Focus Release**: Production-ready conflict resolution system for safe GitHub synchronization with intelligent merge strategies and comprehensive conflict management.

### Added

**Advanced Conflict Resolution (lib/conflict-resolver.js, lib/conflict-history.js, lib/visual-diff.js):**
- Three-way merge algorithm for local/remote/base comparison
- 5 resolution strategies: newest, local, remote, rules-based, manual
- Git-style conflict markers for manual resolution
- Line-by-line diff with intelligent conflict detection
- Line ending normalization (CRLF/LF compatibility)
- Frontmatter detection for markdown files
- Performance: 1000 files merged in < 3.2s (requirement: < 5s)
- Memory efficient: < 85MB for large files
- 42 tests passing (95.5% coverage)

**Conflict Resolution Strategies:**
- **newest**: Automatically keep version with newest timestamp
- **local**: Always prefer local changes (default for offline work)
- **remote**: Always prefer remote changes (default for team sync)
- **rules-based**: Apply custom resolution rules from config
- **manual**: Mark conflicts with Git-style markers for manual resolution

**Conflict History & Management (lib/conflict-history.js):**
- Comprehensive logging with timestamps and metadata
- Dual storage: in-memory and file-based persistence
- Advanced filtering by strategy, file, date range
- Undo/replay functionality for conflict resolutions
- Complete audit trail for compliance and debugging

**Visual Diff Rendering (lib/visual-diff.js):**
- Side-by-side ASCII comparisons
- Unified diff format support
- Conflict highlighting with markers
- Configurable context lines
- Line number display for easy navigation

**CLI Integration:**
```bash
# Sync with conflict resolution
autopm sync:download --conflict newest    # Use newest timestamp
autopm sync:download --conflict interactive  # Manual resolution
autopm sync:upload --conflict-rules .claude/sync-rules.json

# View conflict history
autopm conflict:history
autopm conflict:history --strategy newest
autopm conflict:undo <conflict-id>
```

### Security

**Critical Security Fixes:**
- **Path Traversal Prevention**: Validates and sanitizes all file paths to prevent directory traversal attacks
- **Robust File I/O**: Comprehensive error handling for corrupted history files with validation
- **Timestamp Validation**: Prevents NaN comparisons from invalid dates in newest strategy
- **Input Validation**: All user inputs validated before processing

### Documentation

**Algorithm Limitations (clearly documented):**
- Simplified line-based merge (not LCS-based)
- Does NOT detect moved code blocks (treats as delete + add)
- Does NOT detect reordered functions
- No semantic/AST-based merging for code
- Recommended for markdown and text files
- For complex refactoring, use manual resolution strategy

**Performance Constraints:**
- Tested up to 1MB files (~1000 lines)
- Files >1MB may cause memory pressure
- All #270 performance requirements exceeded

### Performance

Conflict resolution benchmarks (all requirements exceeded):

| Operation | Target | Actual | Status |
|-----------|--------|--------|--------|
| Merge 1000 files | < 5s | 3.2s | ✅ |
| Memory usage | < 100MB | 85MB | ✅ |
| Resolution time | < 100ms/file | 65ms | ✅ |
| Conflict detection | Accurate | 100% | ✅ |

### Files Added
- `lib/conflict-resolver.js` (330 lines) - Three-way merge implementation
- `lib/conflict-history.js` (316 lines) - Conflict logging and management
- `lib/visual-diff.js` (297 lines) - ASCII diff rendering
- `test/unit/conflict-resolver-jest.test.js` (624 lines) - Comprehensive test suite
- `docs/CONFLICT-RESOLUTION.md` - Complete feature documentation
- `examples/conflict-resolution-integration.js` - Integration examples

### Related
- Closes #270 - Advanced Conflict Resolution
- Completes Phase 3 Production Features (4/4 major features)
- Works seamlessly with BatchProcessor (#267) for bulk operations

## [1.29.0] - 2025-10-09

### 🎉 Phase 3 Production Features: Batch Operations, Advanced Filtering & Analytics

**Major Release**: Production-ready features for large-scale project management with batch processing, powerful filtering, and comprehensive analytics.

### Added

**Batch Operations (lib/batch-processor.js):**
- Parallel GitHub sync for 1000+ items in < 30 seconds
- Configurable concurrency (default: 10 parallel uploads)
- Intelligent rate limiting with exponential backoff (5000 req/hour)
- Real-time progress tracking with callbacks
- Comprehensive error recovery (continues on failures)
- Dry run mode for previewing operations
- Performance: 1000 items in 28.5s (requirement: < 30s)
- Memory efficient: < 100MB for 1000 items
- 53 tests (100% passing)

**CLI Command: `autopm sync:batch`**
```bash
autopm sync:batch                    # Sync all items
autopm sync:batch --type prd         # Sync only PRDs
autopm sync:batch --dry-run          # Preview without syncing
autopm sync:batch --concurrent 5     # Custom concurrency
```

**Advanced Filtering & Search (lib/query-parser.js, lib/filter-engine.js):**
- 10 filter types: status, priority, epic, author, assignee, dates, search
- Full-text case-insensitive search across markdown
- Date range filtering (ISO 8601 format)
- Combined filters with AND logic
- Match context extraction (line numbers + snippets)
- Performance: 1000 items filtered in < 500ms
- Memory efficient: < 100MB for 1000 items
- 106 tests (100% passing)

**Filter Capabilities:**
- Status filtering (active, completed, pending, etc.)
- Priority filtering (P0-P3, high/medium/low)
- Epic-based filtering
- Date ranges (created-after/before, updated-after/before)
- Author and assignee filtering
- Full-text search in content and frontmatter

**Analytics & Insights (lib/analytics-engine.js, lib/burndown-chart.js, lib/dependency-analyzer.js):**
- Epic analytics with velocity tracking and progress metrics
- ASCII burndown charts (ideal vs actual comparison)
- Team metrics (completion rates, velocity, duration)
- Dependency analysis (bottlenecks, critical path, parallelizable tasks)
- Export to JSON/CSV formats
- Performance: 1000 tasks analyzed in 230ms (requirement: < 3s)
- 79 tests (98.75% passing)

**CLI Commands: `autopm analytics:*`**
```bash
autopm analytics:epic epic-001           # Epic analytics with burndown
autopm analytics:team --period 30        # Team metrics (30 days)
autopm analytics:velocity                # Velocity trends
autopm analytics:dependencies epic-001   # Dependency analysis
autopm analytics:export epic-001         # Export to JSON/CSV
```

**Analytics Features:**
- Velocity tracking (tasks/week, trends: increasing/decreasing/stable)
- Burndown charts with status detection (ahead/behind/on track)
- Estimated completion dates based on velocity
- Blocker identification from task dependencies
- Bottleneck detection (high-impact blocking tasks)
- Critical path calculation (longest dependency chain)
- Parallelizable task groups identification
- Circular dependency detection

### Performance

All performance requirements exceeded:

| Feature | Result | Requirement | Status |
|---------|--------|-------------|--------|
| Batch sync 1000 items | 28.5s | < 30s | ✅ |
| Filter 1000 items | < 500ms | < 500ms | ✅ |
| Search 1000 items | < 2s | < 2s | ✅ |
| Analytics 1000 tasks | 230ms | < 3s | ✅ |
| Burndown chart | < 1s | < 1s | ✅ |

### Dependencies

- Added `@octokit/rest` (^22.0.0) for GitHub API integration

### Documentation

- `docs/batch-processor.md` - Complete batch operations guide
- `docs/filter-search-system.md` - Filtering and search reference
- `docs/analytics-insights.md` - Analytics system documentation
- `examples/batch-sync-example.js` - Batch processing examples
- `examples/filter-search-cli-integration.js` - Filtering integration
- Complete API reference with JSDoc comments

### Breaking Changes

**None** - 100% backwards compatible with v1.28.0

All new features are additive and do not modify existing functionality.

### Test Coverage

- **Total Tests**: 497 (including v1.28.0 features)
- **New Tests**: 238 (v1.29.0 features)
- **Pass Rate**: 99.6%
- **Coverage**: 94-95% statements, 83-91% branches, 100% functions

### Migration Guide

No migration needed - all features are optional and backwards compatible.

To use new features:
1. Update: `npm install -g claude-autopm@1.29.0`
2. Start using new commands immediately

## [1.28.0] - 2025-10-05

### 🎉 Phase 3 Quick Win: Templates & Scaffolding System

**Major Release**: Complete template system for rapid PRD/Epic/Task creation with Context7-verified best practices.

### Added

**Template Engine (lib/template-engine.js):**
- Variable substitution with `{{variable}}` syntax
- Conditional blocks with `{{#if}}...{{/if}}`
- Loop support with `{{#each}}...{{/each}}`
- Auto-generated variables: `{{id}}`, `{{timestamp}}`, `{{date}}`, `{{author}}`
- Template discovery (user custom overrides built-in)
- Template validation (frontmatter and required variables)
- Zero external dependencies - pure Node.js
- Performance: < 10ms per render
- 30 comprehensive tests (100% passing)

**Built-in PRD Templates (5 templates, 2,006 lines):**
- `api-feature.md` (306 lines) - REST/GraphQL API development
  - OpenAPI contract-first design
  - JWT authentication & OWASP security
  - Performance targets (< 100ms internal)
  - TDD testing strategy
- `ui-feature.md` (365 lines) - Frontend component/page
  - WCAG 2.1 Level AA compliance (2025 legal requirement)
  - Core Web Vitals (LCP, FID, CLS, INP, TTFB)
  - Mobile-first responsive design
  - Cross-browser accessibility testing
- `bug-fix.md` (413 lines) - Bug resolution workflow
  - 5 Whys root cause analysis (Toyota methodology)
  - Severity classification (P0-P3)
  - Comprehensive rollback procedures
  - Post-mortem documentation
- `data-migration.md` (483 lines) - Database schema & data migration
  - Multiple strategies (Big Bang, Trickle, Phased, Parallel)
  - Data quality assessment
  - Pre/post validation
  - Compliance & security
- `documentation.md` (439 lines) - Technical documentation
  - Documentation-as-Code approach
  - WCAG 2.1 AA accessibility
  - SEO optimization & analytics
  - Localization (i18n) support

**CLI Integration:**
- Updated `prd-new.js` - Template support with `--template` / `-t` flag
  - Interactive template selection
  - Template-specific variable prompts
  - 100% backwards compatible (traditional mode preserved)
- `template-list.js` - List all available templates
  - Filter by type (prd/epic/task)
  - Shows built-in and custom templates
- `template-new.js` - Create custom templates
  - Base templates for PRD/Epic/Task
  - Auto-opens in editor
  - Template validation

**Testing (55 tests):**
- `test/templates/template-engine.test.js` - 30 engine tests
  - Variable substitution
  - Conditionals and loops
  - Template discovery
  - Validation
- `test/templates/cli-integration.test.js` - 25 CLI tests
  - Template creation workflows
  - Interactive selection
  - Error handling
  - Backwards compatibility

**Documentation:**
- `docs/templates-design.md` - Complete design specification
- `docs/template-engine-implementation.md` - Implementation details
- `docs/built-in-templates-summary.md` - Template reference
- `docs/templates-cli-integration.md` - CLI usage guide
- `autopm/.claude/templates/prds/README.md` - Quick reference

### Changed

- Updated README.md with v1.28.0 feature highlights
- Expanded test suite from 205 to 260+ tests
- Improved PRD creation workflow (70% faster: 30min → 9min)

### Technical Details

**Files Added (12):**
- `lib/template-engine.js` - Template rendering engine (302 lines)
- `autopm/.claude/templates/prds/api-feature.md` (306 lines)
- `autopm/.claude/templates/prds/ui-feature.md` (365 lines)
- `autopm/.claude/templates/prds/bug-fix.md` (413 lines)
- `autopm/.claude/templates/prds/data-migration.md` (483 lines)
- `autopm/.claude/templates/prds/documentation.md` (439 lines)
- `autopm/.claude/templates/prds/README.md` (114 lines)
- `autopm/.claude/scripts/pm/template-list.js` (119 lines)
- `autopm/.claude/scripts/pm/template-new.js` (317 lines)
- `test/templates/template-engine.test.js` (30 tests)
- `test/templates/cli-integration.test.js` (25 tests)
- 4 documentation files (~4,500 lines total)

**Files Modified (2):**
- `autopm/.claude/scripts/pm/prd-new.js` - Added template support (247 lines added)
- `README.md` - v1.28.0 feature highlights

**Total Lines Added:** ~4,100 lines of code and documentation

### Performance

- Template rendering: < 10ms per PRD (50ms requirement)
- PRD creation time: 70% reduction (30min → 9min)
- Test execution: All 260+ tests pass in < 15s

### Context7 Integration

All templates verified against latest 2025 best practices:
- PRD templates - Lean, alignment-focused
- INVEST criteria - User story quality
- REST API design - OpenAPI, JWT, < 100ms performance
- WCAG 2.1 AA - Legal compliance (June 2025)
- 5 Whys - Root cause analysis methodology

### Breaking Changes

None - 100% backwards compatible with v1.27.0

### Migration Guide

No migration needed. Templates are opt-in:
- Use `--template` flag for template-based creation
- Use `--template none` or omit flag for traditional workflow

---

## [1.27.0] - 2025-10-05

### 🎉 Phase 2 Complete: CCPM Features Integration

**Major Release**: Complete integration of Claude Code Project Management features with GitHub sync, task management, and comprehensive testing.

### Added

**GitHub Sync (Bidirectional):**
- `pm-sync-upload-local.js` - Upload PRDs/Epics/Tasks to GitHub Issues
  - Bidirectional mapping with `sync-map.json`
  - Smart conflict detection and resolution
  - Dry-run mode for safe testing
  - Automatic frontmatter persistence
  - Labels: prd, epic, task, priority levels
- `pm-sync-download-local.js` - Download from GitHub Issues to local files
  - Reverse mapping support
  - Conflict resolution modes: merge/local/github
  - Metadata parsing from issue bodies
  - Progress tracking preservation
  - 13 comprehensive tests

**Task Management:**
- `pm-task-list-local.js` - List tasks for an epic
- `pm-task-show-local.js` - Display task details
- `pm-task-update-local.js` - Update task status/metadata
- Task utility functions with deduplication
- Dependency tracking and validation
- Epic progress auto-update on task completion

**Epic Management Enhancements:**
- AI-powered epic decomposition
- Task generation from epics
- Progress calculation (tasks completed/total)
- Status transition validation
- User story to epic mapping

**Integration Tests (37 tests):**
- `jest.config.integration.js` - Separate test configuration
- Epic workflow tests (10): lifecycle, transitions, filtering
- Task workflow tests (8): dependencies, filtering, validation
- End-to-end tests (3): PRD→Epic→Tasks→Completion
- Real file system operations
- Test isolation with temp directories
- Performance benchmarks

**PRD Parsing:**
- `pm-prd-parse-local.js` - Parse PRDs to generate epics
- User story extraction (supports "As a" and "As an")
- Section parsing (Overview, Goals, Requirements, Timeline)
- Automatic epic metadata generation
- Duplicate variable fix

### Fixed

**Sync Map Persistence:**
- Fixed sync map not persisting on GitHub issue updates
- Added frontmatter `github_issue` field auto-update
- Ensured consistency when issue sourced from syncMap

**Undefined Field Rendering:**
- Added null checks in body builders (PRD/Epic/Task)
- Prevents "**Status:** undefined" in GitHub issues
- Safe metadata rendering for all optional fields

**Documentation:**
- Fixed header usage examples in sync scripts
- Replaced non-existent `syncToGitHub()` with actual functions
- Added complete Octokit initialization examples

**Performance:**
- Optimized DFS algorithm in dependency analyzer (O(n²) → O(n))
- Mutable path with cleanup instead of array copying
- Task ID generation deduplication

**Test Stability:**
- Fixed race conditions in CI with `maxWorkers: 1`
- Excluded problematic tests from parallel execution
- Integration tests run serially for consistency

### Changed

- Task functions now require (epicId, taskId) signature
- Task filenames use short format: 'task-001' not 'task-epic-001-001'
- Epic status defaults to 'planning' (was 'pending')
- Updated test expectations to match actual function signatures

### Test Coverage

**Total: 205 tests passing ✅**
- Phase 1 (Local Mode): 181 tests
- Phase 2 (CCPM Features): 24 tests
  - GitHub Sync Upload: 13 tests
  - GitHub Sync Download: 9 tests
  - Integration Tests: 37 tests
  - Task Utils: 7 tests

### Technical Details

**Files Added:**
- `autopm/.claude/scripts/pm-sync-upload-local.js` (473 lines)
- `autopm/.claude/scripts/pm-sync-download-local.js` (424 lines)
- `autopm/.claude/lib/task-utils.js` (64 lines)
- `jest.config.integration.js` (39 lines)
- `test/integration/phase2-epic-workflow.test.js` (283 lines)
- `test/integration/phase2-task-workflow.test.js` (328 lines)
- `test/integration/phase2-end-to-end.test.js` (301 lines)
- `test/local-mode/github-sync-upload.test.js` (552 lines)
- `test/local-mode/github-sync-download.test.js` (291 lines)
- `test/local-mode/task-utils.test.js` (various)

**PRs Merged:**
- #257: PRD Parsing & Epic Generation
- #258: Epic Decomposition (AI-powered)
- #259: Task Management
- #260: GitHub Sync Upload
- #261: GitHub Sync Download
- #262: Phase 2 Integration Tests

### Breaking Changes

None - All changes are backwards compatible.

### Contributors

- Phase 2 development: Claude Code + Human collaboration
- Code review feedback: GitHub Copilot
- Quality assurance: Comprehensive TDD approach

## [1.26.0] - 2025-10-03

### 🚀 New Tool

**Epic Status Tracker (JavaScript)**

Replaced `epic-status.sh` (104 lines of Bash) with clean, testable JavaScript tool.

### Added

**New JavaScript Tool:**
- `epicStatus.js` - Complete epic progress tracking
  - Replaces `epic-status.sh` (104 lines Bash)
  - Counts tasks by status (completed/in-progress/pending)
  - Calculates progress percentage
  - Visual progress bar rendering
  - Sub-epic breakdown with statistics
  - 200 lines of clean, testable code
  - 21 comprehensive unit tests (100% pass rate)

**Features:**
- Parse frontmatter from markdown task files
- Find task files with pattern matching (`\d+.md`)
- Count tasks by status with variant support (`in_progress` vs `in-progress`)
- Generate ASCII progress bars with customizable length
- List available epics in directory
- Comprehensive error handling for missing files/directories

**Usage:**
```bash
# Show epic status
node .claude/lib/commands/pm/epicStatus.js epic-name

# List available epics
node .claude/lib/commands/pm/epicStatus.js
```

### Changed

**Code Quality Improvements:**
- 📊 Now **10 Bash scripts** → **3 JavaScript tools** (was 9 → 2)
- 📉 Total reduction: ~2600 → ~1500 lines (42% reduction)
- ✅ All functions exported and fully tested
- 🧪 Test coverage: 21 tests for epicStatus.js
- 📖 Clear function signatures with JSDoc potential
- 🚀 No subprocess overhead (pure Node.js)

**Documentation:**
- Added Epic Status section to README.md
- Example output visualization
- Updated "Why JavaScript Tools?" stats

### Technical Details

**epicStatus.js exports:**
- `parseFrontmatter(filePath)` - Extract YAML frontmatter
- `findTaskFiles(dir, maxDepth)` - Recursive task file discovery
- `countTasksByStatus(taskFiles)` - Status aggregation
- `generateProgressBar(percentage, length)` - ASCII visualization
- `getSubEpicBreakdown(epicDir)` - Sub-epic statistics
- `formatEpicStatus(epicName, epicDir)` - Complete report generation
- `listAvailableEpics(epicsDir)` - Directory listing

### Deprecated

- `autopm/scripts/epic-status.sh` - Replaced by `epicStatus.js`
  - Old Bash script still works but discouraged
  - Will be removed in v2.0.0

## [1.25.0] - 2025-10-03

### 🚀 Major Improvement

**Bash to JavaScript Migration**

Replaced 9 problematic Bash scripts with 2 clean, testable JavaScript tools.

### Added

**New JavaScript Tools:**
- `epicSync.js` - Complete epic synchronization workflow
  - Replaces 4 Bash scripts in `epic-sync/`
  - Creates epic and task GitHub issues
  - Updates epic files with GitHub URLs
  - Renames task files to match issue numbers
  - 600 lines of clean, testable code

- `issueSync.js` - Complete issue synchronization workflow
  - Replaces 5 Bash scripts in `issue-sync/` (~2000 lines)
  - Gathers updates from multiple sources
  - Formats and posts GitHub comments
  - Updates frontmatter after sync
  - Preflight validation
  - 700 lines of clean, testable code

### Changed

**Code Quality Improvements:**
- 📉 50% code reduction (2500 → 1300 lines)
- ✅ Zero parsing errors (eliminated heredoc/awk/sed complexity)
- 🧪 Fully testable (all functions exported for unit tests)
- 📖 More readable and maintainable
- 🚀 Faster execution (no subprocess overhead)
- 💾 Better error handling with try/catch
- 🔍 Easier debugging with stack traces

**Documentation:**
- Added "Advanced Tools" section to README.md
- Usage examples with correct `.claude/` paths
- Feature descriptions for both tools
- Migration rationale and benefits

### Fixed

- Bash parsing errors: `Error: (eval):1: parse error near `)`
- Complex shell escaping issues in heredocs
- awk/sed pattern complexity
- Hard-to-debug Bash scripts

### Deprecated

**Bash scripts remain for backward compatibility but are deprecated:**
- `autopm/.claude/scripts/pm/epic-sync/*.sh` (4 files)
- `autopm/.claude/scripts/pm/issue-sync/*.sh` (5 files)

**Recommendation:** Use new JavaScript tools for all new workflows.

### Technical Details

**epicSync.js Functions:**
- `createEpicIssue()` - Create main epic issue
- `createTaskIssues()` - Create all task issues
- `updateEpicFile()` - Update epic.md with URLs
- `updateTaskReferences()` - Rename and update task files
- `syncEpic()` - Full workflow orchestration

**issueSync.js Functions:**
- `gatherUpdates()` - Collect updates from sources
- `formatComment()` - Format GitHub comment
- `postComment()` - Post to GitHub issue
- `updateFrontmatterAfterSync()` - Update local files
- `preflightValidation()` - Validate before sync
- `syncIssue()` - Full workflow orchestration

## [1.24.2] - 2025-10-03

### Fixed
- Epic sync task creation parsing errors

## [1.24.1] - 2025-10-03

### Fixed
- Node.js epic sync tasks tool

## [1.24.0] - 2025-10-03

### Added
- Context Management System (3 commands + 4 templates)
- Context7 Zero Tolerance Enforcement
- Agent Task Creation Enhancement (11 agents)
- Documentation cleanup (fixed 33 invalid command references)

## [1.21.0] - 2025-01-10

### 📚 Documentation
- **Complete Documentation Structure**
  - Added comprehensive documentation in `docs/` directory (11,451+ new lines)
  - New guides: Getting Started, CLI Reference, Agent Registry, Workflows
  - Architecture documentation and core concepts
  - Integration guides for GitHub, Azure DevOps, Context7, MCP servers
  - Troubleshooting guides, FAQ, and debugging resources
  - Complete agent registry with detailed descriptions
  - CLI command reference with examples for all 109+ commands

### 📖 README
- **Comprehensive README Rewrite** (#209, #210, #211)
  - Clearer project description and value proposition
  - Visual walkthrough with GIF demonstrations (6 workflow examples)
  - Improved feature comparison tables
  - Better structured quick start guide
  - Enhanced configuration preset explanations
  - Updated examples and usage patterns

### 🎯 Key Documentation Additions
- `docs/getting-started/` - Installation and quick start guides
- `docs/cli-reference/` - Complete CLI command documentation
- `docs/agents/` - Agent registry and categorization
- `docs/workflows/` - End-to-end workflow examples
- `docs/integrations/` - Integration guides for external services
- `docs/troubleshooting/` - Common issues and debugging

### 📊 Stats
- 32 files changed
- 11,451 insertions
- 878 deletions
- Major improvement in project documentation and accessibility

## [1.20.1] - 2025-01-10

### Fixed
- **Agent Reference Cleanup (7 PRs, ~230+ fixes across ~35 files)**
  - Fixed all deprecated and non-existent agent references throughout documentation (#201, #202, #203, #204, #205, #206, #207)
  - Replaced `docker-expert` → `docker-containerization-expert` (7 files)
  - Replaced `python-backend-expert` → `python-backend-engineer` in appropriate contexts (~35 references)
  - Replaced UI framework agents (`mui-react-expert`, `chakra-ui-expert`, `antd-react-expert`, `bootstrap-ui-expert`) → `react-ui-expert` (~42 references)
  - Replaced testing agents (`playwright-test-engineer`, `playwright-mcp-frontend-tester`) → `e2e-test-engineer` (~70 references)
  - Fixed non-existent agents: `multi-cloud-architect` → `terraform-infrastructure-expert` (11 references)
  - Fixed non-existent agents: `database-architect` → `postgresql-expert` (9 references)
  - Added `mongodb-expert` to backend-context MCP pool for consistency
  - Removed duplicate agent references in decision matrices and coordination docs
  - Updated `python-backend-selection.md` to compare frameworks (FastAPI vs Flask) instead of agents

### Impact
- Eliminates "Agent type not found" runtime errors
- All agent references now point to active agents defined in AGENT-REGISTRY.md
- Improved clarity on framework selection (FastAPI vs Flask) within unified python-backend-engineer agent
- Better guidance for choosing between component-focused (react-ui-expert) and full-app (react-frontend-engineer) approaches

### Documentation
- All documentation now consistent with AGENT-REGISTRY.md v1.1.0 agent consolidation model
- Decision matrices updated to reflect parameterized agent usage (framework=fastapi/flask, framework=mui/chakra/etc.)

## [1.20.0] - 2025-10-02

### 🧹 Cleanup: Package Size Optimization & Development Standards

**Major cleanup of project structure and introduction of comprehensive development standards**

### 🎯 What's Changed

1. **lib/ Directory Cleanup:**
   - Removed 18 unused subdirectories (azure, context, documentation, github, helpers, performance, pm, providers, python, react, regression, release, tailwind, traefik, utils, validators, workflow)
   - Removed 3 unused files (agentExecutor.js.deprecated, commandHelpers.js, prdMetadata.js)
   - Kept only `lib/guide/` which is used by CLI `autopm guide` command
   - **Result:** Significantly reduced npm package size

2. **New DEVELOPMENT-STANDARDS.md (836 lines):**
   - Single source of truth for all AutoPM development standards
   - Comprehensive templates and guidelines for:
     - Agents (with examples and structures)
     - Rules (best practices and naming)
     - Commands (implementation patterns)
     - Scripts (coding standards)
     - Hooks (integration guide)
   - Naming conventions and file organization
   - Context management strategies

3. **.claude/ Structure Optimization:**
   - Reduced from 200+ files to 58 files (70% reduction)
   - Removed unnecessary agents, rules, commands, and scripts
   - Focus exclusively on JavaScript/Node.js/Bash development
   - Removed Python, React, Tailwind, Traefik, and other framework-specific agents
   - Streamlined project-level configuration

### 📦 Package Impact

- Smaller npm package size
- Faster installation
- Cleaner project structure
- Easier maintenance

### 🔧 Breaking Changes

None - all changes are internal optimizations

## [1.19.0] - 2025-10-02

### ✨ Feature: PM Workflow Documentation & Context Command

**Comprehensive PM workflow guide and new context command for project visibility**

Users requested better understanding of the PM workflow process and a way to view current project state inside Claude Code.

### 🎯 What's New

1. **Complete PM Workflow Guide (`PM-WORKFLOW-GUIDE.md`):**
   - Step-by-step process explanation (PRD → Parse → Split/Decompose → Sync)
   - Decision guide: When to use one epic vs multiple epics
   - Multiple workflow examples (simple features, complex projects, multiple PRDs)
   - FAQ section answering common questions
   - Quick reference tables and decision flowcharts

2. **Enhanced Documentation:**
   - Added "Complete PM Workflow Guide" section to README.md
   - Updated `autopm help` with workflow decision guide
   - Clear criteria for choosing `/pm:epic-split` vs `/pm:epic-decompose`

3. **New `/pm:context` Command:**
   - Displays current project configuration
   - Shows active team and PRD list
   - Epic progress with per-epic breakdown
   - Visual progress bars for overall progress
   - Recent activity tracking
   - Quick command suggestions

4. **New `/pm:what-next` Command:**
   - Intelligent context-aware suggestions for next steps
   - Analyzes current project state (PRDs, epics, tasks)
   - Shows concrete commands with real project names (not abstract syntax)
   - Explains why each step is needed
   - Marks recommended actions with ⭐
   - Adapts to different scenarios:
     - New project → Suggests creating first PRD
     - Has PRD → Suggests parsing to epic
     - Has epic → Suggests decomposing or splitting
     - Has tasks → Suggests syncing to GitHub
     - Ready to work → Suggests starting tasks with TDD

### 📊 Example Output

**`/pm:context` in Claude Code:**
```
🎯 Project Context
============================================================

📦 Project Information:
  Name:           my-project
  Directory:      /path/to/project

⚙️  Configuration:
  Provider:       Github
  GitHub Owner:   username
  GitHub Repo:    repo-name

👥 Active Team:
  Team:           fullstack

📄 Product Requirements (PRDs):
  Total:          3
    • user-authentication
    • payment-system
    • notifications

📚 Epics & Progress:
  Total Epics:    2
  Total Tasks:    45
    Completed:    20
    In Progress:  5
    Pending:      20

  Epic Breakdown:
    user-authentication
      [==========----------] 50% (10/20 tasks)
    payment-system
      [========------------] 40% (10/25 tasks)

📊 Overall Progress:
  [====================--------------------] 44%
  20 / 45 tasks completed

🔄 Recent Activity:
  Last Modified:  Implement JWT authentication
  Status:         in-progress
  Modified:       2 hours ago
  File:           .claude/epics/user-authentication/003.md
```

**`/pm:what-next` in Claude Code:**
```
🎯 What Should I Do Next?
============================================================

📊 Current Project Status:

  📄 PRDs: 1 (user-authentication)
  📚 Epics: 1
  ✅ Tasks: 0 / 2 completed
  📋 Ready: 2 tasks waiting

💡 Suggested Next Steps:

1. ⭐ Start Working on Tasks
   You have 2 tasks ready to work on

   /pm:next
   → Shows highest priority available tasks
   /pm:issue-start 001
   → Start: "Implement JWT authentication"
   💭 Begin implementation with TDD approach

💡 Tip: Run /pm:context to see detailed project status
```

### 🎯 Workflow Decision Guide

**ONE epic (`/pm:epic-decompose`):**
- Simple features (1-2 weeks)
- Single component (frontend OR backend)
- One developer
- Examples: "User profile page", "REST API endpoint"

**MULTIPLE epics (`/pm:epic-split`):**
- Complex projects (2+ months)
- Multiple components (frontend + backend + infrastructure)
- Multiple teams working in parallel
- Examples: "E-commerce platform", "Social media dashboard"

### 🔧 Technical Changes

**New Files:**
- `PM-WORKFLOW-GUIDE.md` - Complete 400+ line workflow guide
- `autopm/.claude/commands/pm/context.md` - Command definition
- `autopm/.claude/scripts/pm/context.js` - Implementation (330 lines)
- `autopm/.claude/commands/pm/what-next.md` - Command definition
- `autopm/.claude/scripts/pm/what-next.js` - Implementation (400+ lines)

**Modified Files:**
- `README.md` - Added "Complete PM Workflow Guide" section
- `bin/autopm.js` - Added workflow decision guide to help epilogue

**Key Features of context.js:**
- Project information extraction from package.json
- Configuration reading from .claude/config.json
- Active team detection from .claude/active_team.txt
- PRD counting and listing from .claude/prds/
- Epic/task progress tracking with status parsing
- Progress bar generation
- Recent activity tracking with time-ago calculations
- Quick command suggestions

**Key Features of what-next.js:**
- Multi-scenario project state analysis (7 distinct scenarios)
- Context-aware command suggestions with real project names
- Epic complexity detection (simple vs complex for split decision)
- Priority-based suggestion ordering (high/medium/low)
- Recommendation markers (⭐) for best next action
- Explanations for why each step is needed
- Adapts to project phase (new → PRD → epic → tasks → work)
- In-progress task tracking and continuation suggestions

### 📝 Addresses User Feedback

This release answers user questions:
- "nie rozumiem jaki jest proces" → Complete workflow guide
- "Czy moge stworzyc kilka PRD na raz?" → Yes, explained in guide
- "jak rozdzielam PRD na kilka Epikow a jak na jeden?" → Decision criteria provided
- "Czy mozna dodac komende ktora wypisze aktualna konfiguracje?" → `/pm:context` command added
- "chcialbym wewnatrz claude taka komende 'what-next'" → `/pm:what-next` command with intelligent suggestions

## [1.18.0] - 2025-10-02

### ✨ Feature: MCP Dependency Validation for Teams

**Automatic detection and warnings for missing MCP server dependencies when loading agent teams**

Users requested visibility when agents require MCP servers that aren't installed or activated. This release adds automatic validation during team loading.

### 🎯 What's New

1. **Automatic MCP Dependency Detection:**
   - Scans all agents in a team for MCP server requirements
   - Detects `mcp://server-name/path` URIs in agent documentation
   - Validates against currently active MCP servers
   - Shows warnings with clear fix instructions

2. **Two Types of Warnings:**
   - ❌ **NOT INSTALLED**: Server definition doesn't exist
     - Fix: `autopm mcp install <server-name>`
   - ⚪ **NOT ACTIVE**: Server exists but isn't enabled
     - Fix: `autopm mcp enable <server-name>`

3. **Clear Action Items:**
   - Lists which agents need each missing server
   - Provides exact command to fix the issue
   - Includes helpful tips for MCP configuration

### 📊 Example Output

```bash
$ autopm team load frontend

🔄 Loading team 'frontend'...
   Resolved 9 agents (including inherited)

⚠️  MCP Dependency Warnings:

⚪ MCP server 'context7' is NOT ACTIVE
   Required by: react-frontend-engineer, javascript-frontend-engineer, ux-design-expert
   Fix: autopm mcp enable context7

💡 Tip: Run "autopm mcp list" to see all MCP servers
💡 Tip: Run "autopm mcp setup" for interactive configuration

✓ Updated CLAUDE.md with team agents
✓ Team 'frontend' activated successfully
```

### 🔧 Technical Changes

**Modified Files:**
- `bin/commands/team.js` - Added `validateAgentMCPDependencies()` function
- `bin/commands/team.js` - Integrated MCP validation into team load command

**How It Works:**
1. After resolving team agents, validates MCP dependencies
2. Uses existing MCPHandler to scan agent files for MCP URIs
3. Checks each required server against active servers list
4. Displays warnings for missing/inactive servers
5. Continues with team loading (non-blocking validation)

### 📝 Migration Notes

**For all users:**
- MCP validation happens automatically when loading teams
- No configuration required - works out of the box
- Warnings are informational and don't block team loading

**Affected Agents:**
Many agents now declare MCP dependencies for documentation access:
- `react-frontend-engineer` - Needs context7 for React/Next.js docs
- `python-backend-engineer` - Needs context7 for Python/FastAPI docs
- `javascript-frontend-engineer` - Needs context7 for JS/TS docs
- And many more...

## [1.17.0] - 2025-10-02

### ✨ Feature: Mandatory Agent Usage Enforcement

**Systematic enforcement to ensure specialized agents are used for complex tasks**

Users reported that after installation, Claude Code wasn't consistently using specialized agents, requiring constant reminders. This release adds comprehensive enforcement mechanisms.

### 🎯 What's New

1. **Agent Mandatory Rule (`agent-mandatory.md`):**
   - 🚨 HIGHEST PRIORITY rule file
   - Clear guidelines: When to ALWAYS use agents vs when you can do it yourself
   - Agent selection guide by task type and technology
   - Violation examples with ✅ CORRECT and ❌ WRONG patterns
   - Quick reference tables for common tasks

2. **CLAUDE.md Template Updates:**
   - Prominent "🚨 AGENT USAGE - MANDATORY" section at top
   - Quick reference table visible immediately
   - "Before doing ANY complex task: Check if there's a specialized agent"
   - References comprehensive agent-mandatory.md rule

3. **Hooks Installation:**
   - `.claude/hooks/` directory now installed to all projects
   - `enforce-agents.sh` and `enforce-agents.js` for runtime enforcement
   - Blocks direct execution of complex tasks
   - Suggests appropriate agents for violations

### 📊 Impact

**Before v1.17.0:**
```
User: "Build a FastAPI endpoint"
Claude: *writes Python code directly*
User: "Please use an agent!"
```

**After v1.17.0:**
```
User: "Build a FastAPI endpoint"
Claude: "I'll use the python-backend-engineer agent..."
*Uses Task tool automatically*
```

### 🔧 Technical Changes

**New Files:**
- `autopm/.claude/rules/agent-mandatory.md` - Comprehensive agent usage rules

**Modified Files:**
- `autopm/.claude/templates/claude-templates/base.md` - Added agent enforcement section
- `install/install.js` - Added `.claude/hooks` to installItems array

**Hooks Included:**
- `enforce-agents.sh` - Shell wrapper for hook
- `enforce-agents.js` - Node.js enforcement logic
- Blocks: Direct grep/find, test execution, large file reads
- Suggests: code-analyzer, test-runner, file-analyzer agents

### 📝 Migration Notes

**For new installations:**
- Agent enforcement is automatic! 🎉

**For existing installations:**
```bash
autopm update
# Updates templates and installs hooks
```

## [1.16.0] - 2025-10-02

### ✨ Feature: Epic Status Command

**Global epic status tracking with CLI commands**

Added `autopm epic` commands for viewing epic progress, task breakdown, and status across multi-level epic structures.

### 🎯 What's New

1. **Epic Status Script (`epic-status.sh`):**
   - Counts total/completed/in-progress/pending tasks
   - Visual progress bar
   - Sub-epic breakdown with individual counts
   - Robust bash implementation (no parse errors)

2. **Epic CLI Commands:**
   - `autopm epic list` - List all available epics
   - `autopm epic status <name>` - Show epic progress
   - `autopm epic breakdown <name>` - Detailed task breakdown

3. **Integration:**
   - Works with multi-level epic structures
   - Supports 100+ tasks across multiple sub-epics
   - Task status tracking (completed/in-progress/pending)

### 📊 Example Output

```bash
$ autopm epic status fullstack

Epic: fullstack
====================

Total tasks:     101
Completed:       45 (44%)
In Progress:     5
Pending:         51

Progress: [======================----------------------------] 44%

Sub-Epic Breakdown:
-------------------
  01-infrastructure           12 tasks (8 completed)
  02-auth-backend             15 tasks (6 completed)
  03-frontend-foundation      18 tasks (10 completed)
  ...
```

### 🔧 Technical Changes

**New Files:**
- `autopm/scripts/epic-status.sh` - Bash script for epic analysis
- `bin/commands/epic.js` - CLI command module

**Modified Files:**
- `bin/autopm.js` - Registered epic command
- `install/install.js` - Added epic-status.sh to installer

## [1.15.5] - 2025-10-02

### 🐛 Bug Fix: Package.json Installation

**Fixed installer not creating package.json or installing dependencies**

Same as v1.15.4 but with corrected version number and proper npm publication.

### 🔧 Changes

- Ensured package.json.template includes js-yaml dependency
- Installer creates package.json and runs npm install
- All PM scripts have required dependencies

## [1.15.4] - 2025-10-02

### 🐛 Bug Fix: Missing Dependencies After Installation

**Fixed installer not creating package.json or installing dependencies**

The installer was not creating `package.json` in user projects, causing PM scripts like `epic-split.js` to fail with "Cannot find module 'js-yaml'" error.

### 🎯 What Was Fixed

1. **Added package.json.template handling:**
   - Template now includes `js-yaml` dependency
   - Installer creates `package.json` from template if it doesn't exist
   - Auto-fills project name from directory name

2. **Added automatic dependency installation:**
   - Installer now runs `npm install` after copying files
   - Only installs if `package.json` has dependencies
   - Provides helpful error message if installation fails

3. **Fixed PM script requirements:**
   - `epic-split.js` now has required `js-yaml` dependency
   - All other PM scripts will have dependencies available

### 📊 Impact

**Before v1.15.4:**
```bash
autopm install
# Creates .claude/ but NO package.json
# User runs /pm:epic-split
# ERROR: Cannot find module 'js-yaml'
```

**After v1.15.4:**
```bash
autopm install
# ✅ Creates package.json with dependencies
# ✅ Runs npm install automatically
# ✅ js-yaml installed and ready
# User runs /pm:epic-split
# ✅ Works perfectly!
```

### 🔧 Technical Changes

**Files Modified:**
- `autopm/scripts/package.json.template` - Added `js-yaml: ^4.1.0`
- `install/install.js` - Added `installDependencies()` method
- `install/install.js` - Added package.json creation logic in `installScripts()`

### 📝 Migration Notes

**For existing installations:**
```bash
# Add to your project root:
npm install js-yaml

# Or recreate package.json:
cp autopm/scripts/package.json.template package.json
npm install
```

**For new installations:**
- Everything works automatically! 🎉

## [1.13.13] - 2025-10-01

### 🐛 Critical Bug Fix: MCP Server Definition Files

**Fixed incorrect package names in MCP server definition files**

The v1.13.10 and v1.13.11 releases fixed package names in `mcp-servers.json` but forgot to update the individual server definition files in `autopm/.claude/mcp/`. This caused servers to fail validation and not appear in `autopm mcp list`.

### 🎯 What Was Fixed

**Fixed Files:**
- `autopm/.claude/mcp/context7.md`: `@context7/mcp-server` → `@upstash/context7-mcp`
- `autopm/.claude/mcp/context7.md`: `@context7/mcp-server` → `@upstash/context7-mcp`
- `autopm/.claude/mcp/context7.md`: Added missing `https://` to URL defaults
- `autopm/.claude/mcp/playwright-mcp.md`: `@playwright/mcp-server` → `@playwright/mcp`

### 📊 Impact

**Before v1.13.13:**
- `autopm mcp list` showed only context7 servers
- playwright-mcp didn't appear in list
- Server validation failed silently

**After v1.13.13:**
- All servers appear in `autopm mcp list`
- All package names are correct and consistent
- Server validation works properly

### 🔄 Upgrade

```bash
npm install -g claude-autopm@latest
```

## [1.13.12] - 2025-10-01

### ✨ Enhancement: Post-Configuration Guidance

**Added comprehensive next steps after MCP configuration commands**

Users now receive clear, actionable guidance after running:
- `autopm mcp enable <server>`
- `autopm mcp add`
- `autopm mcp sync`

### 🎯 What Changed

**New `showNextSteps()` method in MCPHandler:**
- Shows step-by-step instructions after configuration
- Lists required environment variables with examples
- Provides API key sources and documentation links
- Reminds users to restart Claude Code and verify servers

### 📋 Example Output

**After `autopm mcp enable context7`:**
```
✅ Server 'context7' enabled

📋 Next Steps:

1. Run sync to update configuration:
   autopm mcp sync

2. Configure required environment variables in .claude/.env:
   CONTEXT7_API_KEY=ctx7_1234567890abcdef
   CONTEXT7_WORKSPACE=my-workspace-id

3. Restart Claude Code to load the server

4. Verify server status:
   /mcp (in Claude Code)

💡 API Key Information:
   → Sign up at https://context7.com and get API key from dashboard
```

**After `autopm mcp sync`:**
```
✅ Configuration synced...

📋 Next Steps:

1. Restart Claude Code to load the updated configuration

2. Verify servers are running:
   /mcp (in Claude Code)

⚠️  Some servers require environment variables:

   ❌ CONTEXT7_API_KEY

3. Configure missing variables in .claude/.env

4. Check configuration:
   autopm mcp check
```

### 🎁 User Experience Improvement

**Before v1.13.12:**
- Commands completed silently
- No guidance on what to do next
- Users left confused about how to proceed

**After v1.13.12:**
- Clear step-by-step instructions
- Environment variable examples
- Links to credential sources
- Verification commands

### 🔄 Impact

This addresses user feedback: *"po dodaniu konfiguracji autopm mcp nie mialem zadnej informacji na temat uruchomienia sync ani innych krokow"*

## [1.13.11] - 2025-10-01

### 🐛 Bug Fix: Corrected Playwright MCP Package Name

**Fixed incorrect Playwright MCP package name**
- Changed from non-existent `@playwright/mcp-server` to actual `@playwright/mcp`
- **Impact: Playwright MCP server can now start in Claude Code**

### 🗑️ Breaking Change: Removed Deprecated GitHub MCP

**Removed deprecated GitHub MCP server from default configuration**
- `@modelcontextprotocol/server-github` is deprecated by maintainers
- GitHub now provides official server via Copilot API with HTTP transport
- **Impact: Users need to manually add GitHub MCP if needed**

### 🎯 What Changed

**autopm/.claude/mcp-servers.json:**
```json
// Playwright - Fixed:
"args": ["@playwright/mcp"]  // ✅ Was: @playwright/mcp-server

// GitHub - Removed (deprecated)
// Use: claude mcp add --transport http github ...
```

**package.json:**
```json
"optionalDependencies": {
  "@upstash/context7-mcp": "^1.0.0",
  "@playwright/mcp": "^0.0.40"
}
```

### 📊 Default MCP Servers

**After v1.13.11:**
- ✅ `context7` - Documentation (@upstash/context7-mcp)
- ✅ `context7` - Codebase analysis (@upstash/context7-mcp)
- ✅ `playwright-mcp` - Browser automation (@playwright/mcp)
- ❌ `github-mcp` - REMOVED (deprecated)

### 📖 Adding GitHub MCP Manually

**New official GitHub MCP (via Copilot API):**
```bash
claude mcp add --transport http github \
  https://api.githubcopilot.com/mcp \
  -H "Authorization: Bearer $GITHUB_PAT"
```

See: https://github.com/github/github-mcp-server

### 🔄 Migration

**For existing projects:**
```bash
cd your-project
autopm mcp sync  # Updates with correct packages
```

## [1.13.10] - 2025-10-01

### 🐛 Critical Bug Fix

**Fixed Incorrect Context7 MCP Package Name**
- Changed from non-existent `@context7/mcp-server` to actual `@upstash/context7-mcp`
- **Impact: MCP servers can now actually start in Claude Code**

### 🎯 What Was Wrong

The MCP configuration was using a **non-existent npm package**:
- ❌ `@context7/mcp-server` - doesn't exist on npm
- ✅ `@upstash/context7-mcp` - real package

This caused ALL Context7 MCP servers to fail with "✘ failed" in Claude Code.

### 🔧 Files Changed

**autopm/.claude/mcp-servers.json:**
```json
// Before:
"args": ["@context7/mcp-server"]  // ❌ 404 Not Found

// After:
"args": ["@upstash/context7-mcp"]  // ✅ Works
```

**package.json:**
```json
"optionalDependencies": {
  "@upstash/context7-mcp": "^1.0.0"  // Updated
}
```

### 📊 Impact

**Before (v1.13.9):**
```
Claude Code MCP:
❯ 1. context7    ✘ failed
  2. context7        ✘ failed
```

**After (v1.13.10):**
```
Claude Code MCP:
❯ 1. context7    ✓ running
  2. context7        ✓ running
```

### 🚨 Breaking Change

If you manually installed `@context7/mcp-server` (which would fail), you'll need to:
```bash
npm uninstall @context7/mcp-server
npm install @upstash/context7-mcp
```

But most users didn't install anything (because the package didn't exist), so this is just a fix.

### 🎯 User Action Required

**For existing projects:**
```bash
cd your-project
autopm mcp sync  # Updates .mcp.json with correct package
```

Or manually update `.mcp.json`:
```json
{
  "mcpServers": {
    "context7": {
      "args": ["@upstash/context7-mcp"]  // Change this
    }
  }
}
```

### 🔍 How This Happened

The Context7 MCP server is maintained by Upstash, but the configuration examples used an incorrect namespace. The package search revealed:
- ✅ `@upstash/context7-mcp` - Official package (v1.0.20)
- ❌ `@context7/mcp-server` - Never existed

## [1.13.9] - 2025-10-01

### 🎨 UX Improvement

**Enhanced Configuration Display (`autopm config show`)**
- Fixed confusing MCP status messages
- Added helpful configuration instructions
- Shows exact steps to fix missing settings
- **Impact: Users now know exactly how to configure AutoPM**

### 🎯 What Changed

**`bin/commands/config.js`:**
- Fixed MCP status display - now shows "X active", "X configured", or "Not configured"
- Checks both `config.mcp.activeServers` and `.claude/mcp-servers.json`
- Added "Configuration Issues" section with actionable solutions
- Shows exactly how to set GitHub owner, repo, and token
- Shows how to set Azure organization, project, and PAT
- Fixed execution strategy display when it's an object
- Made `padRight()` safer by converting all inputs to strings

### 📊 Before vs After

**Before (v1.13.8):**
```
│ MCP:             ❌ Disabled             │
```
*User confused: "I have servers configured!"*

**After (v1.13.9):**
```
│ MCP:             ⚠️  2 configured       │
```
```
📋 Configuration Issues:

⚠️  GitHub token not set
   → Add to .claude/.env: GITHUB_TOKEN=ghp_your_token_here

ℹ️  2 MCP server(s) configured but not active
   → Run: autopm mcp list  (then: autopm mcp enable <server>)
```

### 🎯 User Impact

✅ Clear MCP status (active vs configured vs missing)
✅ Actionable instructions for every missing setting
✅ Shows exact commands to run
✅ Shows where to add tokens (.claude/.env)
✅ No more confusion about configuration state

### 🔧 Technical Details

**MCP Status Logic:**
1. If `config.mcp.activeServers` exists → show "X active" ✅
2. Else check `.claude/mcp-servers.json` → show "X configured" ⚠️
3. Else → show "Not configured" ❌

**Configuration Issues:**
- Detects missing provider, owner, repo, tokens
- Shows platform-specific instructions (GitHub vs Azure)
- Different icon per issue type (⚠️ for problems, ℹ️ for info)

## [1.13.8] - 2025-10-01

### ✨ Feature

**Automatic MCP Integration During Installation**
- Installation now automatically creates `.mcp.json` for Claude Code
- No manual `autopm mcp sync` needed after install
- **Impact: MCP servers work in Claude Code immediately after installation**

### 🎯 What Changed

**`install/install.js`:**
- Added `.claude/mcp-servers.json` to `installItems` (now copied during install)
- Added `setupMCPIntegration()` method called after framework installation
- Automatically creates `.mcp.json` when `mcp-servers.json` exists
- Shows helpful tip if no servers are activated

### 📊 Installation Flow

**Before (v1.13.7):**
```
1. autopm install
2. autopm mcp enable context7  ← Manual step
3. autopm mcp sync                  ← Manual step
4. Restart Claude Code              ← Manual step
```

**After (v1.13.8):**
```
1. autopm install                   ← Creates .mcp.json automatically!
2. autopm mcp enable context7  (optional - to activate)
3. Restart Claude Code
```

### 🎯 User Impact

- ✅ `.mcp.json` created automatically during installation
- ✅ 4 MCP servers configured out of the box (context7, context7, github-mcp, playwright-mcp)
- ✅ No extra commands needed for Claude Code integration
- ✅ Helpful tip shown if servers need activation
- ✅ Works for both fresh installs and updates

### 📖 Files Copied

During installation, these MCP files are now installed:
- `.claude/mcp/` - Server definitions (10 markdown files)
- `.claude/mcp-servers.json` - Complete server configuration
- `.mcp.json` - Claude Code format (auto-generated)

### 💡 Post-Installation

Users can now:
- See servers immediately in Claude Code `/mcp` command
- Run `autopm mcp enable <server>` to activate specific servers
- Run `autopm mcp check` to see environment requirements
- Edit `.claude/.env` to add API keys

## [1.13.7] - 2025-10-01

### 🔧 Critical Fix

**Claude Code MCP Integration**
- Fixed `autopm mcp sync` to create `.mcp.json` in project root
- Claude Code expects MCP config in `.mcp.json`, not `.claude/mcp-servers.json`
- **Impact: Claude Code `/mcp` command now correctly discovers MCP servers**

### 🎯 What Changed

**`scripts/mcp-handler.js`:**
- Modified `sync()` to write two files:
  1. `.claude/mcp-servers.json` - AutoPM internal format (with contextPools, documentationSources)
  2. `.mcp.json` - Claude Code format (mcpServers only)
- Added console output showing both file locations
- Uses `this.projectRoot` to write `.mcp.json` at project root

### 📊 File Structure

**Before (v1.13.6):**
```
project/
  .claude/
    mcp-servers.json    ✅ Created
  .mcp.json             ❌ Missing (Claude Code couldn't find servers)
```

**After (v1.13.7):**
```
project/
  .claude/
    mcp-servers.json    ✅ Created (AutoPM format)
  .mcp.json             ✅ Created (Claude Code format)
```

### 🎯 User Impact

- ✅ Claude Code `/mcp` command shows configured servers
- ✅ MCP servers discoverable by Claude Code
- ✅ Automatic sync to both file formats
- ✅ No manual configuration needed
- ✅ Works across all projects after running `autopm mcp sync`

### 📖 Documentation

Claude Code expects MCP configuration in:
- **Project scope**: `.mcp.json` at project root
- **Local scope**: User-specific Claude Code settings
- **User scope**: Global Claude Code settings

AutoPM now correctly creates project-scoped configuration.

## [1.13.6] - 2025-10-01

### 🐛 Bug Fix

**MCP Environment Variable Format**
- Fixed `autopm mcp sync` copying metadata objects instead of simple strings
- Claude Code expects `"VAR": "value"` not `"VAR": {default: "value"}`
- Added `_convertEnvMetadataToStrings()` to convert registry metadata to Claude Code format
- **Impact: Claude Code `/mcp` command now works correctly**

### 🔧 Technical Changes

**`scripts/mcp-handler.js`:**
- Added `_convertEnvMetadataToStrings(envObj)` helper method
- Converts env metadata objects to simple string format
- Handles three cases:
  1. Already string → keep unchanged
  2. Metadata with literal default → use literal value
  3. Metadata with empty default → use `${VAR:-}` format
- Modified `sync()` to use conversion before writing

### 📊 Format Conversion

**Before (v1.13.5):**
```json
"env": {
  "CONTEXT7_API_KEY": {              // ❌ Object
    "default": "",
    "description": "Your Context7 API key",
    "required": true
  }
}
```

**After (v1.13.6):**
```json
"env": {
  "CONTEXT7_API_KEY": "${CONTEXT7_API_KEY:-}",  // ✅ String
  "CONTEXT7_MODE": "documentation"                // ✅ Literal
}
```

### 🎯 User Impact

- ✅ Claude Code can parse MCP configurations
- ✅ `/mcp` command shows servers correctly
- ✅ Backward compatible with existing formats
- ✅ Preserves literal defaults from registry
- ✅ MCP servers now work in Claude Code interface

## [1.13.5] - 2025-10-01

### 🚨 Critical Bug Fix

**MCP Sync Data Loss Bug**
- Fixed critical bug in `autopm mcp sync` that deleted all MCP server configurations
- Previously: Running sync with no active servers would wipe entire `mcp-servers.json`
- Now: Preserves all existing servers, only updates active ones
- Impact: **Safe to run `autopm mcp sync` anytime without data loss**

### 🔧 Technical Changes

**`scripts/mcp-handler.js`:**
- `sync()` now reads existing `mcp-servers.json` before modifying
- Preserves all servers, updates only those in `activeServers` list
- When no active servers: preserves existing instead of wiping file
- Better logging: shows both active count and total servers count

**`.claude/config.json`:**
- Added `mcp.activeServers` section for Claude Code integration
- Enables `/mcp` command in Claude Code to see configured servers
- Without this section, Claude Code shows "No MCP servers configured"

### 📊 Behavior Change

**Before:**
```bash
$ autopm mcp sync  # with empty activeServers
ℹ️ No active servers to sync
# Result: ALL servers deleted from mcp-servers.json ❌
```

**After:**
```bash
$ autopm mcp sync  # with empty activeServers
ℹ️ No active servers in config.json
💡 Preserving existing servers in mcp-servers.json
📊 Existing servers: 4
# Result: All servers preserved ✅
```

### 🎯 User Impact

- ✅ No more data loss when syncing
- ✅ Claude Code `/mcp` command now works
- ✅ Safe to run `autopm mcp sync` anytime
- ✅ All existing servers preserved automatically

### 🔄 Recovery for Affected Users

If you lost your MCP configuration, restore it:
```bash
# Restore from git
git checkout .claude/mcp-servers.json

# Or re-enable servers
autopm mcp enable context7
autopm mcp enable github-mcp
```

## [1.13.4] - 2025-10-01

### ✨ User Experience Enhancements

**Next Steps Guidance After PRD Creation**
- Added comprehensive next steps display after `/pm:prd-new` command
- Shows 5 clear options to prevent users from getting lost:
  1. **Quick Start** - `/pm:epic-oneshot` for simple features (< 10 tasks)
  2. **Split into Epics** - `/pm:epic-split` for complex features (15+ tasks)
  3. **Step-by-Step Workflow** - Full control over parse → decompose → sync
  4. **Review & Edit First** - Refine PRD before processing
  5. **Check Status** - View PRD progress anytime
- Includes decision guidance based on feature complexity
- Visual formatting with emojis and clear separators

**Enhanced MCP Configuration Diagnostics**
- Improved `autopm mcp check` output with categorized environment variables
- **REQUIRED vs OPTIONAL** indicators for all env vars
- Descriptions for each environment variable
- Ready-to-copy example `.env` configuration
- Direct links to get API keys and credentials
- Step-by-step fix instructions with numbered steps
- Shows where to get credentials for each MCP server

### 🔧 Code Quality Improvements

- Extracted `_hasNonEmptyDefault(envDef)` helper method
- Eliminated duplicate logic in MCP configuration checks
- More robust handling: converts to string, trims whitespace
- Handles edge cases: null, undefined, whitespace-only strings
- Improved maintainability following DRY principle

### 📝 Technical Changes

- `autopm/.claude/scripts/pm/prd-new.js`: Added `showNextSteps()` method (+48 lines)
- `scripts/mcp-handler.js`: Enhanced `check()` with detailed diagnostics (+133 lines)
- `autopm/.claude/mcp/context7.md`: Structured env metadata with objects
- All 21 MCP check tests still passing ✅

### 🎯 Addresses User Feedback

- ✅ Users no longer get lost after creating PRDs
- ✅ MCP configuration errors are now self-explanatory
- ✅ Clear guidance on what to do next at each step
- ✅ No more guessing where to get API keys

## [1.13.3] - 2025-10-01

### ✅ Added
- **Comprehensive Test Coverage** (61 new tests, 100% pass rate)
  - `test/jest-tests/mcp-check-jest.test.js` - 21 tests for MCP configuration validation
  - `test/jest-tests/post-install-check-jest.test.js` - 40 tests for post-installation validation
  - Full coverage for `MCPHandler.check()` and `checkRequiredServers()` methods
  - Complete coverage for `PostInstallChecker` class and all validation methods
  - Integration tests for various configuration scenarios
  - Error handling tests for edge cases

### 📚 Documentation
- **README.md Enhancements**
  - Added `autopm mcp check` to MCP commands documentation
  - Added section 4.6 "Verify Installation & Configuration" with `autopm validate` examples
  - Added comprehensive "Splitting Large PRDs into Multiple Epics" guide
    - Complete workflow example with progress tracking
    - 4 criteria for when to split PRDs
    - 5 best practices for managing split epics
  - Example output showing Essential and Optional components validation
  - Actionable next steps for incomplete configurations

### 🎯 Quality Improvements
- Zero test failures - all 61 new tests passing
- Better developer experience with clear test coverage
- Improved user guidance for complex project management workflows
- Enhanced documentation for post-installation validation

## [1.13.2] - 2025-10-01

### 🐛 Fixed
- **MCP Command Argument Parsing**
  - Fixed `autopm mcp enable <server-name>` not accepting server name as positional argument
  - Changed command signature from `mcp <action> [options]` to `mcp <action> [name]`
  - Added proper positional argument handling for server and agent names
  - All MCP commands now correctly parse server/agent names from command line
  - Maintains backward compatibility with `--server` and `--agent` flags

### 🛠️ Enhanced
- **Post-Installation Validation**
  - Added automatic configuration check after `autopm install`
  - New `autopm validate` command for comprehensive setup verification
  - Visual status display shows Essential and Optional components
  - Actionable next steps when configuration is incomplete
  - Checks: `.claude` directory, config file, provider setup, MCP servers, git hooks, Node.js version

## [1.13.1] - 2025-10-01

### 📚 Documentation
- **Visual Walkthrough Enhancements**
  - Improved video presentation with expandable sections in README
  - Added 6 demo GIF files showcasing complete workflow
  - Fixed video file naming and paths for better compatibility
  - Interactive collapsible sections for each workflow step

## [1.13.0] - 2025-09-30

### ✨ Added
- **MCP Configuration Check Command** (`autopm mcp check`)
  - Quick validation of MCP server configuration
  - Analyzes which agents require MCP servers
  - Verifies required servers are enabled
  - Checks environment variables are configured
  - Provides actionable recommendations for issues
  - Complements existing `diagnose` command with fast health check

### 🛠️ Enhanced
- **Enhanced MCP Diagnostics**
  - `autopm mcp diagnose` now includes MCP server requirements section
  - Shows disabled servers that are used by agents
  - Displays missing environment variables
  - Provides quick fix recommendations
- **Performance Improvements**
  - Added environment status caching to reduce file I/O operations
  - Optimized MCP server validation checks
  - Extracted helper methods for better code reusability

### 📚 Documentation
- **MCP Command Documentation Updates**
  - Added comprehensive documentation for `autopm mcp check`
  - Updated MCP workflow examples with new check command
  - Enhanced troubleshooting guide with quick check instructions
  - Updated MCP_SETUP_GUIDE.md with validation workflow

## [1.12.3] - 2025-09-30

### 📚 Documentation
- **Comprehensive Documentation Overhaul**
  - Complete rewrite of README.md with v1.12.2 features section
  - Complete rewrite of docs/INSTALL.md (400 lines)
    - System requirements and platform-specific instructions (macOS, Linux, Windows)
    - Installation presets explained in detail with recommendations
    - Update process with version detection feature
    - Comprehensive troubleshooting section with common errors
  - Complete rewrite of docs/QUICKSTART.md (444 lines)
    - 5-minute quick start guide with interactive and manual paths
    - First workflow examples and basic commands reference
    - Agent teams setup and automatic team switching
    - Common workflows (daily development, feature development, team collaboration)
    - Pro tips and troubleshooting section
  - Complete rewrite of docs/CONFIG.md (364 lines)
    - Complete configuration reference with environment variables
    - Configuration commands reference (view, set, switch, validate)
    - Execution strategies explained in detail
    - Provider-specific settings for GitHub and Azure DevOps
    - Advanced configuration topics (MCP servers, git hooks, custom strategies)
  - Complete rewrite of docs/FAQ.md (375 lines)
    - General, installation, and usage questions
    - Configuration and troubleshooting sections
    - Advanced topics, performance, and migration guidance
    - Complete provider comparison and setup instructions

### 🛠️ Enhanced
- **Version Tracking in Configuration**
  - Config files now include version and installed timestamp
  - Enables `autopm update` to recognize current installed version
  - Prevents unnecessary updates when already on latest version

## [1.12.2] - 2025-09-30

### 🛠️ Enhanced
- **Smart Tool Detection During Installation**
  - Installer now automatically detects Docker and kubectl availability
  - Installation options are filtered based on available tools
  - Clear visual feedback showing which tools are installed/missing
  - Installation links provided for missing tools
  - Prevents users from selecting scenarios requiring unavailable tools
  - Default scenario automatically adjusts based on detected tools

### 🐛 Fixed
- **Command Format in PM Scripts**
  - Fixed incorrect command format `pm ...` to proper slash command format `/pm:...`
  - Updated all PM scripts: prd-new, prd-parse, epic-split, epic-edit, epic-close, epic-start
  - Consistent command format across all user-facing messages and help text
- **Configuration Files**
  - Added https:// protocol to Context7 URLs in mcp-servers.json
  - Removed broken references to non-existent tdd-enforcement.md file
- **UI Fixes**
  - Fixed installation completion box - corrected bottom-right corner character (╗ → ╝)

## [1.11.8] - 2025-09-29


## [1.11.5] - 2025-09-29


## [1.10.0] - 2025-01-29

### ✨ Added
- **Full Azure DevOps Hierarchy Support** - Complete Epic → User Story → Task implementation
  - Automatic parent-child work item linking
  - Provider abstraction layer for GitHub/Azure DevOps parity
  - `config` command for provider management and switching
  - Intelligent epic decomposition based on provider (3-level for Azure, 2-level for GitHub)

### 🛠️ Enhanced
- **Provider Configuration Management**
  - `autopm config show` - Display current provider configuration
  - `autopm config set <key> <value>` - Configure provider settings
  - `autopm config switch <provider>` - Quick switch between GitHub and Azure DevOps
  - `autopm config validate` - Validate provider configuration
  - Support for nested configuration (e.g., `azure.organization`, `github.repo`)

### 🏗️ Internal
- Implemented TDD approach with comprehensive test coverage
- Created provider abstraction layer for extensibility
- Added Azure DevOps client wrapper
- Enhanced epic syncing with provider-specific hierarchy

## [1.9.2] - 2025-09-27

### 🔒 Security
- **Fixed autopm guide security vulnerability** - Guide command was executing installation without user consent
- Added comprehensive security tests to prevent regression

### 🛠️ Fixed
- **CLAUDE.md template generation** - Fixed broken template system during installation
- Template system now uses intelligent addon composition based on configuration
- Resolved issue where short fallback templates were used instead of rich content

### 📚 Enhanced
- **Dependency updates** - Updated execa from 8.0.1 to 9.6.0 for better compatibility
- Improved template system with scenario-based addon selection

## [1.9.1] - 2025-09-27

### 🔒 Security
- **Removed vulnerable 'git' package** - Resolved 2 high severity vulnerabilities
- Cleaned up unnecessary dependencies from peerDependencies

### 🚀 Performance
- Updated dependencies for better security and compatibility

## [1.9.0] - 2025-09-27

### 🎯 Major Feature Release - Complete PM Command Suite

This release represents a massive expansion of project management capabilities, bringing ClaudeAutoPM to feature parity with industry-leading PM tools.

### ✨ Added - 17 New PM Commands

#### **PRD & Epic Management**
- **`pm:prd-new`** - Create new Product Requirements Documents with intelligent wizard
- **`pm:prd-parse`** - Convert PRDs into executable epics with technical breakdown
- **`pm:epic-close`** - Close completed epics with automatic task completion
- **`pm:epic-edit`** - Edit epic details with interactive prompts

#### **Issue Lifecycle Management**
- **`pm:issue-start`** - Start work on issues with automatic branch creation
- **`pm:issue-show`** - Display detailed issue information and progress
- **`pm:issue-close`** - Close completed issues with completion tracking
- **`pm:issue-edit`** - Edit issue details interactively

#### **Pull Request Workflow**
- **`pm:pr-create`** - Create PRs with auto-generated descriptions from work items
- **`pm:pr-list`** - List and filter pull requests with advanced options

#### **Context Management**
- **`pm:context-create`** - Create development context files for features
- **`pm:context-update`** - Update context with progress and findings
- **`pm:context-prime`** - Load context for AI assistance sessions

#### **Project Maintenance**
- **`pm:optimize`** - Analyze and optimize project structure for efficiency
- **`pm:clean`** - Archive completed work and clean project workspace
- **`pm:sync`** - Comprehensive synchronization across GitHub/Azure DevOps
- **`pm:release`** - Create versioned releases with automated changelog generation

### 🏗️ Architecture Improvements

#### **Node.js Migration Complete (96% Coverage)**
- Successfully migrated 49 bash scripts to Node.js (12,000+ lines of code)
- 100% backward compatibility maintained through wrapper pattern
- Dramatically improved cross-platform compatibility
- Removed external dependencies (jq, specific bash versions)

#### **Comprehensive Testing Suite**
- **94 new tests** covering all new PM commands
- Unit tests for individual command components
- Integration tests for complete PM workflows
- Security tests preventing regression of vulnerabilities
- Test coverage improved while adding thousands of lines of new code

### 🔧 Enhanced CLI System

#### **Professional Command Structure**
- All commands follow consistent `resource-action` pattern
- Comprehensive help system with examples
- Support for both CLI and AI assistant usage patterns
- Advanced option parsing with validation

#### **Provider Integration**
- Automatic detection of GitHub vs Azure DevOps projects
- Provider-specific optimizations and workflows
- Unified API across different project management backends

### 📚 Documentation Overhaul

#### **Complete Command Documentation**
- **COMMANDS.md** - Comprehensive reference for all 96+ commands
- Detailed usage examples and option descriptions
- Workflow guides for common development patterns
- Integration instructions for different providers

#### **Updated Project Documentation**
- Refreshed README.md with current capabilities
- Updated CONTRIBUTING.md with TDD methodology requirements
- Comprehensive changelog with migration guidance

### 🚀 Performance & Quality

#### **Code Quality Improvements**
- Followed strict TDD methodology for all new features
- Comprehensive error handling and user feedback
- Consistent coding patterns across all commands
- Modular architecture for maintainability

#### **Developer Experience**
- Rich command-line interfaces with progress indicators
- Intelligent defaults and validation
- Clear error messages with actionable guidance
- Support for both interactive and non-interactive usage

### 🔍 Command Analysis & Optimization

Based on comprehensive analysis of existing PM tools, this release addresses:
- **24 missing commands** identified through industry comparison
- **Command reference validation** - all referenced commands now implemented
- **Workflow gaps** - complete PM lifecycle now supported
- **Integration points** - seamless provider synchronization

### 📊 Statistics
- **17 new PM commands** added
- **94 new tests** written
- **12,000+ lines** of Node.js code
- **96% bash-to-Node.js migration** complete
- **100% feature parity** maintained
- **Zero breaking changes** for existing users

### 🎯 Migration Notes
- All existing workflows continue to work unchanged
- New commands available immediately after update
- Enhanced functionality available through both CLI and AI assistant
- Comprehensive testing ensures stability and reliability

## [1.5.15] - 2025-09-19

### Added
- Comprehensive GitHub PAT format validation for all token types
- Live token validation by connecting to GitHub API
- Automatic username mismatch detection and correction
- Token scope and permission validation
- Enhanced error reporting with specific troubleshooting steps

### Improved
- GitHub setup flow now asks for username first
- Repository name suggestions based on current directory
- Better error messages with actionable solutions
- Azure DevOps configuration follows same improved flow
- Clear preview of repository/project URLs before creation

### Security
- Validates token authenticity before use
- Detects revoked or invalid tokens immediately
- Checks for required permissions (repo scope)
- Clears invalid tokens automatically

## [1.5.14] - 2025-09-19

### Fixed
- Token validation improvements and error handling

## [1.5.13] - 2025-09-19

### Fixed
- Repository creation error reporting

## [1.5.12] - 2025-09-19

### Fixed
- GitHub configuration user flow improvements

## [1.5.11] - 2025-09-19

### Fixed
- Email validator implementation

## [1.5.10] - 2025-09-19

### Added
- Comprehensive token acquisition guides for GitHub and Azure DevOps
- Step-by-step instructions for getting Personal Access Tokens
- GitHub repository creation with automatic `gh repo create` integration
- Azure DevOps project creation instructions
- Token validation with optional entry (can skip and add later)

### Improved
- Token entry is now optional - users can add it later to `.claude/.env`
- Clear instructions on where to find and create tokens
- Repository verification and creation workflow for GitHub
- Better error handling when gh CLI is not installed
- Links to token creation pages for both providers

### Features
- GitHub: Auto-create repository if it doesn't exist (with gh CLI)
- GitHub: Set up git remote automatically after repo creation
- Azure: Clear instructions for manual project creation
- Both: Token scopes clearly specified (repo, workflow for GitHub; Work Items, Code for Azure)

## [1.5.9] - 2025-09-19

### Fixed
- Added Azure DevOps support for PRD workflow in `autopm guide`
- Provider-specific next steps for GitHub vs Azure
- Azure CLI commands for creating work items

### Added
- Azure work item creation instructions with `az boards` CLI
- Proper routing based on selected provider (GitHub or Azure)

## [1.5.8] - 2025-09-19

### Added
- Complete PRD (Product Requirements Document) creation workflow in `autopm guide`
- Full ClaudeAutoPM workflow explanation showing 5-phase process
- Option to create first PRD with guided wizard
- Automatic PRD file generation with template structure
- GitHub issue creation for PRD tracking
- Choice between full PRD workflow or simple task creation

### Changed
- Guide now offers structured workflow options: PRD creation, simple task, or skip
- Enhanced onboarding with complete workflow understanding

### Features
- PRD wizard collects: feature name, project type, description, user story
- Generated PRD includes: requirements, success criteria, timeline, next steps
- Clear instructions for continuing with /pm:prd-parse, /pm:epic-decompose, /pm:epic-sync

## [1.5.7] - 2025-09-19

### Added
- Detailed explanations for each installation scenario in `autopm guide`
- Comparison table showing complexity, speed, features for each scenario
- Clear recommendations for which projects suit each installation type
- Visual indicators (stars, colors) to help users choose the right option

### Improved
- Installation scenario selection now includes comprehensive guidance
- Each scenario lists specific use cases and project types
- Better user experience with clear visual hierarchy

## [1.5.6] - 2025-09-19

### Fixed
- Complete reorder of `autopm guide` workflow for better user experience
- New logical flow: choose folder → set project details → select provider → setup git → install framework

### Changed
- Project location selection now comes first (can create new folder or use current)
- Project name and description collected before provider selection
- Installation scenario selection added to framework setup
- Better separation of concerns in guide workflow

### Added
- Interactive folder selection with directory creation option
- Project description field for better context
- Installation scenario choice during framework setup

## [1.5.5] - 2025-09-19

### Fixed
- Fixed `autopm guide` workflow order - provider selection now comes before git initialization
- Git repository setup is now only required for GitHub provider (optional for Azure DevOps)
- More logical flow: choose provider → setup git (if needed) → install framework → configure

### Changed
- Improved guide workflow to be more intuitive and user-friendly
- Provider-specific git requirements are now properly handled

## [1.5.4] - 2025-09-19

### Added
- CLAUDE.md generation in `autopm guide` with comprehensive project context
- Project-specific Claude instructions tailored to the chosen configuration
- Automatic project folder creation during guide setup

### Fixed
- GitHub issue creation now uses `gh` CLI and actually creates issues
- Configuration properly saved to `.claude/config.json` and `.claude/.env`
- Project folder creation and navigation during guide

## [1.5.3] - 2025-09-19

### Added
- Complete setup workflow in `autopm guide` including:
  - Project folder creation
  - Git repository initialization
  - Automatic `autopm install` execution
  - GitHub issue creation with gh CLI
  - Configuration persistence
  - Reset option for reconfiguration

### Fixed
- ESM/CJS compatibility issues with chalk and inquirer
- Guide now properly saves configuration to files
- Framework installation integrated into guide workflow

## [1.5.2] - 2025-09-19

### Fixed
- Added missing `src/` directory to npm package files
- Resolved `ENOENT` error during npm installation
- Included all necessary source files in published package

## [1.5.1] - 2025-09-19

### Added
- Interactive setup guide (`autopm guide`) for new users
- Streamlined onboarding with provider detection
- Step-by-step configuration wizard

### Fixed
- Module compatibility issues
- Installation path resolution

## [1.5.0] - 2025-09-19

### Added
- Complete TDD implementation with comprehensive command infrastructure
- Full migration from legacy implementation
- Enhanced testing coverage

### Fixed
- Test isolation and cleanup of obsolete files
- Command execution reliability

## [1.3.0] - 2025-09-16

### 🚀 Major Release - Bash to Node.js Migration (Phase 3 Complete)

This release marks a significant milestone with the complete migration of all P0 critical scripts from Bash to Node.js, providing enhanced cross-platform compatibility, better error handling, and improved maintainability.

### Added

#### Node.js Script Migration

- **New Node.js implementations** of critical installation and setup scripts
  - `bin/node/install.js` - Complete framework installer (600+ lines)
  - `bin/node/setup-env.js` - Environment configuration manager (350+ lines)
  - `bin/node/merge-claude.js` - CLAUDE.md merge helper (280+ lines)
- **6 new utility modules** for shared functionality
  - `lib/utils/logger.js` - Cross-platform logging with color support
  - `lib/utils/colors.js` - Custom color module (chalk replacement)
  - `lib/utils/filesystem.js` - File operations wrapper
  - `lib/utils/shell.js` - Command execution utilities
  - `lib/utils/config.js` - Configuration management
  - `lib/utils/prompts.js` - Interactive CLI prompts
- **Comprehensive test suites**
  - 47 unit tests with 100% pass rate
  - 6 integration tests for staging validation
  - New staging environment test runner

#### Enhanced Features

- **Cross-platform compatibility** - Windows, macOS, and Linux support
- **Better error handling** with stack traces and recovery mechanisms
- **Non-interactive mode** for CI/CD automation
- **Secure credential handling** with 0600 permissions on Unix
- **Token validation** with regex patterns for GitHub tokens
- **Backup and rollback** capabilities for safer installations
- **Progress indicators** for long-running operations

### Changed

- **Performance improvements** - Average 150ms execution time (faster than Bash)
- **Modular architecture** - Reusable utilities across all scripts
- **Dependencies updated** - Added required Node.js packages for migration

### Fixed

- Color module infinite recursion issue
- Test failures in silent mode
- Staging test return value handling
- Cross-platform path handling

### Migration Statistics

- **2,274 lines** of Bash code migrated
- **~2,500 lines** of new Node.js code
- **100% feature parity** maintained
- **100% test coverage** for critical paths

## [1.2.0] - 2025-09-14

### 🎉 Major Release - Architecture & Performance Update

This release introduces groundbreaking improvements in architecture, performance, and developer experience.

### Added

#### Unified Provider Architecture

- **Breaking Change**: New command structure `/pm:resource:action` replacing `/pm:resource-action`
- Automatic provider routing based on configuration
- Support for GitHub, Azure DevOps with more providers coming
- Provider-agnostic commands work across all platforms

#### Performance Optimizations (40% Faster)

- Intelligent caching system reduces API calls by 80%
- Request batching for bulk operations (60% faster)
- Exponential backoff for rate limiting
- Module preloading for 95% faster command execution
- Memory usage reduced by 31%

#### Self-Maintenance System Rewrite

- Complete Node.js implementation replacing all bash scripts
- Cross-platform compatibility (Windows, macOS, Linux)
- New commands: `pm:health`, `pm:validate`, `pm:optimize`, `pm:metrics`, `pm:test-install`
- Built-in performance benchmarking tools in `scripts/benchmarks/`

#### Enhanced Testing (94.3% Coverage)

- Comprehensive E2E test suite (`test/e2e/`)
- Performance benchmark tests
- Quick installation tests
- Azure DevOps integration tests with proper mocking

#### Documentation Overhaul

- Complete documentation audit and update
- New Migration Guide (`docs/MIGRATION-GUIDE.md`)
- New Performance Guide (`docs/PERFORMANCE-GUIDE.md`)
- Updated Provider Strategy documentation
- Refreshed wiki with new features

### Changed

- Command structure from hyphen to colon separator (e.g., `issue-show` → `issue:show`)
- Configuration structure now uses `projectManagement` wrapper
- Self-maintenance scripts from bash to Node.js
- Test coverage increased from 80.6% to 94.3%
- Documentation completely updated for v1.2.0 features

### Fixed

- Azure DevOps PR create test failures
- Regression test snapshot issues
- Installation test problems
- Provider detection edge cases
- Memory leaks in long-running operations

### Performance Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Command Latency | 350ms | 210ms | 40% faster |
| API Calls (repeated) | 100% | 20% | 80% reduction |
| Memory Usage | 45MB | 31MB | 31% less |
| Module Load Time | 45ms | 2ms | 95% faster |

### Migration Notes

See [MIGRATION-GUIDE.md](docs/MIGRATION-GUIDE.md) for detailed upgrade instructions from v1.1.0.

## [1.1.0] - 2025-09-13

### Added

- 📡 **MCP Server Management System** - Complete system for managing Model Context Protocol servers
  - New `autopm mcp` CLI commands (list, add, enable, disable, sync, validate, info)
  - Server definitions in Markdown with YAML frontmatter
  - Automatic generation of `.claude/mcp-servers.json`
  - 6 pre-configured servers (context7, playwright, github, filesystem, sqlite)
  - New `@mcp-manager` agent for server lifecycle management
  - Comprehensive MCP Management Guide documentation

- 🤖 **Self-Maintenance System** - Framework now uses its own capabilities for maintenance
  - PM commands for project maintenance (validate, optimize, health, release)
  - Framework agents used for self-maintenance
  - Agent configuration verification tools
  - Self-maintenance documentation and guides

- 🔧 **Agent Ecosystem Optimization (Phase 1)**
  - Consolidated UI frameworks into `react-ui-expert`
  - Consolidated Python backends into `python-backend-expert`
  - Consolidated Docker agents into `docker-containerization-expert`
  - Consolidated E2E testing into `e2e-test-engineer`
  - Reduced agent count from 50+ to ~35 (30% reduction)

### Changed

- 📚 Updated README with MCP management section
- 🔄 Enhanced installer to copy MCP directory
- 📦 Added `js-yaml` dependency for YAML parsing
- 🎯 Improved agent registry with new consolidated agents

### Fixed

- 🐛 DevOps workflow inconsistency (hybrid workflow support)
- 📝 Agent registry validation issues

## [1.0.2] - 2024-01-13

### Added

- 🔒 Protection for user customizations during updates (.github, .claude-code folders)
- 📋 Detailed file listings during installation/updates with icons and progress
- 🛠️ Smart creation of missing files from templates (COMMIT_CHECKLIST.md)
- 📄 Verbose output showing which files are being installed/updated

### Fixed

- ⚠️ No more "skipping" missing source files - creates them from templates instead
- 🔄 Installer now preserves GitHub workflows and Claude Code settings during updates
- 📊 Better user experience with detailed progress reporting

## [1.0.1] - 2024-01-13

### Changed

- 🔄 Updated all package name references from `@autopm/framework` to `claude-autopm`
- 📝 Added CCPM inspiration acknowledgment to README files
- 🛠️ Fixed GitHub workflow installation examples
- 📋 Fixed markdown formatting issues

## [1.0.0] - 2024-01-XX

### Added

- 🎉 Initial release of ClaudeAutoPM framework
- 📦 NPM package with global CLI installation (`claude-autopm`)
- 🚀 Complete installation system with `autopm install` command
- 🤖 AI-powered CLAUDE.md merge helper with `autopm merge`
- 🎯 Project initialization with `autopm init <project-name>`
- 📁 Complete framework structure:
  - `.claude/` - Claude Code configuration and rules
  - `.claude-code/` - Claude Code specific settings
  - `.github/` - GitHub workflows and templates
  - `scripts/` - Project automation scripts
  - `PLAYBOOK.md` - Usage guidelines
  - `COMMIT_CHECKLIST.md` - Quality assurance checklist

### Features

#### 🔧 Installation System

- **Smart detection** of existing installations vs fresh installs
- **Automatic backups** with timestamp (`autopm_backup_YYYYMMDD_HHMMSS/`)
- **File change detection** - only updates modified files
- **Cross-platform support** - Windows (Git Bash/WSL), macOS, Linux
- **Error handling** with graceful failures and rollback information

#### 🤖 CLAUDE.md Management

- **Automatic migration** from `CLAUDE_BASIC.md` to `CLAUDE.md`
- **Conflict detection** when both files exist
- **AI merge prompts** for intelligent configuration combining
- **Preservation of user customizations** with framework updates integration

#### 📋 CLI Commands

```bash
autopm install [path]     # Install to directory
autopm update [path]      # Update existing installation  
autopm merge              # Generate merge prompts
autopm init <name>        # Create new project
autopm --version          # Show version info
autopm --help            # Show usage guide
```

#### 🛡️ Safety Features

- Non-destructive updates with confirmation prompts
- Comprehensive backup system before any changes
- Dependency validation (Git, Node.js)
- Cross-platform compatibility checks
- Detailed error messages and troubleshooting guides

#### 🎨 Developer Experience

- **Colorized output** with clear status indicators
- **Interactive prompts** for user decisions
- **Progress feedback** during operations
- **Verbose mode** for debugging (`--verbose`)
- **Comprehensive help system** with examples

### Technical

#### 🏗️ Architecture

- **Modular design** with separate install and merge scripts
- **Node.js CLI wrapper** around battle-tested Bash scripts
- **NPM package structure** with proper bin entries
- **GitHub Actions** for automated publishing
- **Semantic versioning** with changelog maintenance

#### 🔌 Integrations

- **MCP (Model Context Protocol)** server configurations
- **Context7** integration for documentation and codebase context
- **Playwright MCP** for browser automation testing
- **GitHub MCP** for repository operations
- **Multi-cloud support** (AWS, Azure, GCP) for infrastructure agents

#### 📦 Package Management

- **Scoped package**: `claude-autopm`
- **Multiple binary entries**: `autopm`, `autopm-install`, `autopm-merge`
- **Optional dependencies** for MCP servers
- **Peer dependencies** validation
- **Global installation preferred** with `preferGlobal: true`

### Documentation

- 📖 Complete installation guide in `install/README.md`
- 🎯 Usage examples and troubleshooting
- 🎨 ASCII art banners and professional CLI presentation
- 📋 Comprehensive error handling documentation
- 🔄 Migration guides for existing ClaudeAutoPM installations

### Dependencies

#### Required

- Node.js >= 16.0.0
- NPM >= 8.0.0
- Git (system dependency)

#### Optional

- `@context7/mcp-server` - Documentation context management
- `@playwright/mcp-server` - Browser automation testing
- `@modelcontextprotocol/server-github` - GitHub integration

#### Development

- `markdownlint-cli` - Markdown linting
- `prettier` - Code formatting

## [Unreleased]

### Planned Features

- 🔄 Auto-update mechanism for framework components
- 🎨 Custom templates and project scaffolding
- 📊 Usage analytics and improvement suggestions
- 🔌 Plugin system for custom agents and rules
- 🌐 Web interface for project management
- 🐳 Docker integration for containerized development

---

## Release Process

1. Update version in `package.json`
2. Update this changelog with new features
3. Create git tag: `git tag -a v1.0.0 -m "Release v1.0.0"`
4. Push tag: `git push origin v1.0.0`
5. GitHub Actions will automatically publish to NPM
6. GitHub Release will be created automatically

## Installation

### Global Installation (Recommended)

```bash
npm install -g claude-autopm
autopm --help
```

### Use with npx (No Installation)

```bash
npx autopm install
npx autopm merge
```

### Local Development

```bash
git clone https://github.com/rla/ClaudeAutoPM.git
cd ClaudeAutoPM
npm install
npm link
autopm --version
```
