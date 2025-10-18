# Plugin Optimization Strategy

## 🔍 Problem: Pluginy w Obecnym Systemie

### Jak Działają Pluginy Teraz (Pre-Optimization)

**Instalacja pluginu (np. plugin-core):**
```bash
npm install @claudeautopm/plugin-core
```

**Co się dzieje podczas instalacji:**
```
Kopiuje do projektu:
├─ 4 agentów → .claude/agents/core/
├─ 3 komendy → .claude/commands/
├─ 21 reguł → .claude/rules/
├─ 7 hooków → .claude/hooks/
└─ Skrypty → scripts/

WSZYSTKO trafia do CLAUDE.md lub jest ładowane na starcie!
```

**Problem:**
- Plugin-core ma **21 plików reguł**
- Plugin-pm ma **~15 komend**
- Plugin-cloud ma **~9 agentów**
- **WSZYSTKIE są ładowane na starcie sesji** w starym systemie

## 📊 Analiza Tokenów - Pluginy

### Plugin-Core (Przykład)

```javascript
{
  "agents": 4,        // ~2,400 tokenów (600 każdy)
  "commands": 3,      // ~900 tokenów (300 każdy)
  "rules": 21,        // ~31,500 tokenów (1,500 każdy)
  "hooks": 7,         // Nie ładowane do kontekstu
  "scripts": 6        // Nie ładowane do kontekstu
}

TOTAL: ~34,800 tokenów TYLKO dla plugin-core!
```

### Wszystkie Pluginy Razem

```
plugin-core:      ~34,800 tokenów
plugin-pm:        ~25,000 tokenów
plugin-cloud:     ~18,000 tokenów
plugin-databases: ~15,000 tokenów
plugin-devops:    ~12,000 tokenów
... (pozostałe 6 pluginów)

TOTAL: ~150,000+ tokenów dla pełnej instalacji!
```

**vs dostępny kontekst Claude:** 200,000 tokenów
**Pozostaje na reasoning:** 50,000 tokenów (25%)

## ✅ Rozwiązanie: Plugin Lazy Loading

### Strategia Optymalizacji Pluginów

#### 1. **Metadata Manifest w CLAUDE.md** (Tier 1)

Zamiast ładować wszystkie pluginy, ładuj tylko manifest:

```xml
<!-- CLAUDE.md base-optimized.md -->

<plugins>
<installed>
core|pm|cloud|databases|devops
</installed>

<manifest>
<plugin id="core">
  agents: agent-manager|code-analyzer|test-runner|file-analyzer
  commands: code-rabbit|prompt|re-init
  rules: 21 files (load on-demand)
  📖 .claude/plugins/core/
</plugin>

<plugin id="pm">
  agents: None
  commands: issue-create|epic-decompose|task-start|pr-create|task-complete
  rules: 8 files (load on-demand)
  📖 .claude/plugins/pm/
</plugin>

<plugin id="cloud">
  agents: aws-cloud-architect|azure-cloud-architect|gcp-cloud-architect
  commands: None
  rules: 5 files (load on-demand)
  📖 .claude/plugins/cloud/
</plugin>
</manifest>
</plugins>

📊 Tokens: ~400 tokens (vs 150,000+ old system)
💰 Savings: 99.7%
```

#### 2. **Command-Triggered Plugin Loading** (Tier 2)

Gdy user wywołuje komendę z pluginu:

```
User: "/pm:issue-create User Profile"
         └─ prefix "pm:" wskazuje plugin

LAZY LOADING:
1. Parse command: plugin="pm", command="issue-create"
2. Check if plugin loaded: No
3. Load ONLY this command file:
   .claude/plugins/pm/commands/issue-create.md (~300 tokens)
4. Execute command
```

**Przykład:**

```xml
<command_execution>
<trigger>/pm:issue-create</trigger>

<lazy_load>
1. Plugin: pm (detected from prefix)
2. Command: issue-create
3. Load: .claude/plugins/pm/commands/issue-create.md (300 tokens)
4. Context7: mcp://context7/github/issues (200 tokens)
5. Total: 500 tokens
</lazy_load>

<no_load>
❌ Pozostałe 14 komend z plugin-pm (NOT loaded)
❌ 8 reguł z plugin-pm (NOT loaded)
❌ Inne pluginy (NOT loaded)
</no_load>

💰 Savings: 24,500 tokens (98%)
</command_execution>
```

#### 3. **Agent-Triggered Plugin Loading** (Tier 2)

Gdy Claude wywołuje agenta z pluginu:

```
Claude: "I need @aws-cloud-architect for VPC design"
                └─ agent from plugin-cloud

LAZY LOADING:
1. Parse agent: plugin="cloud", agent="aws-cloud-architect"
2. Check if plugin loaded: No
3. Load ONLY this agent file:
   .claude/plugins/cloud/agents/aws-cloud-architect.md (~600 tokens)
4. Invoke agent
```

#### 4. **Rule On-Demand Loading** (Tier 3)

Reguły ładowane tylko gdy potrzebne:

```xml
<rule_loading>
<scenario>User violates TDD</scenario>

<lazy_load>
1. Detect violation: Code before tests
2. Load: .claude/plugins/core/rules/tdd.enforcement.md (1,500 tokens)
3. Show error with full rule context
4. Guide correction
</lazy_load>

<alternative>
<quick_ref>
Instead of full rule, load quick reference first:
.claude/quick-ref/tdd-cycle.md (285 tokens)
Only load full rule if violation persists
</quick_ref>
</alternative>
</rule_loading>
```

## 🏗️ Implementacja: Plugin Manifest System

### Struktura Po Optymalizacji

```
project/
├─ CLAUDE.md (base-optimized.md)
│  └─ Contains: <plugins> manifest (~400 tokens)
│
├─ .claude/
│  ├─ quick-ref/              # Tier 2: Quick references (285-800 tokens each)
│  │  ├─ tdd-cycle.md
│  │  ├─ workflow-steps.md
│  │  └─ context7-queries.md
│  │
│  └─ plugins/                # Tier 3: Full plugin content (on-demand)
│     ├─ core/
│     │  ├─ agents/
│     │  │  ├─ agent-manager.md (600 tokens)
│     │  │  ├─ code-analyzer.md (600 tokens)
│     │  │  └─ ...
│     │  ├─ commands/
│     │  │  ├─ code-rabbit.md (300 tokens)
│     │  │  └─ ...
│     │  ├─ rules/
│     │  │  ├─ tdd.enforcement.md (1,500 tokens)
│     │  │  ├─ context7-enforcement.md (2,600 tokens)
│     │  │  └─ ...
│     │  └─ plugin-manifest.json (metadata)
│     │
│     ├─ pm/
│     │  ├─ commands/
│     │  │  ├─ issue-create.md
│     │  │  ├─ epic-decompose.md
│     │  │  └─ ...
│     │  └─ plugin-manifest.json
│     │
│     └─ cloud/
│        ├─ agents/
│        │  ├─ aws-cloud-architect.md
│        │  └─ ...
│        └─ plugin-manifest.json
```

### Plugin Manifest Format

```json
// .claude/plugins/pm/plugin-manifest.json
{
  "id": "pm",
  "name": "Project Management",
  "version": "2.0.0",
  "tokenOptimized": true,

  "manifest": {
    "commands": {
      "issue-create": {
        "file": "commands/issue-create.md",
        "tokens": 300,
        "context7": ["github/issues", "agile/user-stories"]
      },
      "epic-decompose": {
        "file": "commands/epic-decompose.md",
        "tokens": 350,
        "context7": ["agile/epic-decomposition", "agile/task-sizing"]
      }
    },
    "rules": {
      "pm-workflow": {
        "file": "rules/pm-workflow.md",
        "tokens": 1200,
        "priority": "high",
        "quickRef": ".claude/quick-ref/workflow-steps.md"
      }
    }
  },

  "lazyLoading": {
    "enabled": true,
    "triggers": {
      "commands": "prefix /pm:",
      "rules": "on-violation"
    }
  }
}
```

## 🎬 Przykładowy Flow z Plugin Optimization

### Scenariusz: User Wykonuje PM Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1: Session Start                                              │
├─────────────────────────────────────────────────────────────────────┤
│ Load: base-optimized.md (1,646 tokens)                             │
│                                                                     │
│ <plugins>                                                           │
│   <installed>core|pm|cloud|databases|devops</installed>            │
│   <manifest>                                                        │
│     <plugin id="pm">                                                │
│       commands: issue-create|epic-decompose|task-start|...         │
│     </plugin>                                                       │
│   </manifest>                                                       │
│ </plugins>                                                          │
│                                                                     │
│ Tokens: 1,646 (includes plugin manifest)                           │
│ Plugins loaded: 0 (just manifest)                                  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 2: /pm:issue-create                                           │
├─────────────────────────────────────────────────────────────────────┤
│ Detect: Command from plugin-pm                                     │
│                                                                     │
│ Lazy Load:                                                          │
│ 1. .claude/plugins/pm/commands/issue-create.md (+300 tokens)       │
│ 2. Context7: github/issues (+200 tokens)                           │
│                                                                     │
│ NOT Loaded:                                                         │
│ ❌ Other 14 PM commands                                             │
│ ❌ PM rules                                                         │
│ ❌ Other plugins (core, cloud, databases, devops)                  │
│                                                                     │
│ Total: 1,646 + 300 + 200 = 2,146 tokens                            │
│ vs Old: Would load ALL pm plugin = 25,000 tokens                   │
│ Savings: 22,854 tokens (91.4%)                                     │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 3: /pm:epic-decompose                                         │
├─────────────────────────────────────────────────────────────────────┤
│ Detect: Another command from plugin-pm                             │
│                                                                     │
│ Lazy Load:                                                          │
│ 1. .claude/plugins/pm/commands/epic-decompose.md (+350 tokens)     │
│ 2. Context7: agile/epic-decomposition (+200 tokens)                │
│                                                                     │
│ Total: 2,146 + 350 + 200 = 2,696 tokens                            │
│ Savings: Still 91.4% vs loading full pm plugin                     │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 4: @aws-cloud-architect (from plugin-cloud)                   │
├─────────────────────────────────────────────────────────────────────┤
│ Detect: Agent from DIFFERENT plugin (cloud)                        │
│                                                                     │
│ Lazy Load:                                                          │
│ 1. .claude/plugins/cloud/agents/aws-cloud-architect.md (+600)      │
│ 2. Context7: aws/compute,aws/networking (+200)                     │
│                                                                     │
│ NOT Loaded:                                                         │
│ ❌ Other 8 cloud agents (azure, gcp, etc.)                         │
│ ❌ Cloud plugin rules                                              │
│                                                                     │
│ Total: 2,696 + 600 + 200 = 3,496 tokens                            │
│ vs Old: Would load plugin-core + plugin-pm + plugin-cloud          │
│         = 34,800 + 25,000 + 18,000 = 77,800 tokens                 │
│ Savings: 74,304 tokens (95.5%)                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 📊 Token Savings - Plugin System

### Comparison: Old vs Optimized

| Scenario | Old System | Optimized | Savings |
|----------|------------|-----------|---------|
| **Start Session** | 150,000+ tokens (all plugins) | 1,646 tokens (manifest only) | 99.0% |
| **Use 1 PM Command** | 150,000+ tokens | 2,146 tokens | 98.6% |
| **Use 3 PM Commands** | 150,000+ tokens | 3,246 tokens | 97.8% |
| **PM + Cloud Agent** | 150,000+ tokens | 3,846 tokens | 97.4% |
| **Full Workflow** | 150,000+ tokens | ~5,000 tokens | 96.7% |

## 🔧 Implementacja: Jak Dodać do Frameworka

### 1. Aktualizacja Instalera

```javascript
// install/install.js

function installPluginOptimized(pluginName, targetDir) {
  const plugin = loadPluginManifest(pluginName);

  // Create plugin directory structure
  const pluginDir = path.join(targetDir, '.claude/plugins', pluginName);
  fs.mkdirSync(pluginDir, { recursive: true });

  // Copy plugin files (NOT to root .claude/)
  copyPluginFiles(plugin, pluginDir);

  // Generate compressed manifest for CLAUDE.md
  const manifest = generateCompressedManifest(plugin);

  // Add to base-optimized.md <plugins> section
  updateCLAUDEManifest(targetDir, manifest);

  console.log(`✅ Plugin ${pluginName} installed (lazy loading enabled)`);
  console.log(`   Token cost: ~50 tokens (manifest only)`);
  console.log(`   Files available on-demand: ${plugin.totalFiles}`);
}
```

### 2. Plugin Manifest Generator

```javascript
// install/plugin-manifest-generator.js

function generateCompressedManifest(plugin) {
  return `<plugin id="${plugin.id}">
  agents: ${plugin.agents.map(a => a.name).join('|')}
  commands: ${plugin.commands.map(c => c.name).join('|')}
  rules: ${plugin.rules.length} files (load on-demand)
  📖 .claude/plugins/${plugin.id}/
</plugin>`;
}
```

### 3. Lazy Loading Trigger System

```javascript
// Pseudocode for Claude's lazy loading logic

function handleCommand(input) {
  // Parse command
  const match = input.match(/^\/([a-z-]+):([a-z-]+)/);
  if (!match) return false;

  const [_, pluginId, commandName] = match;

  // Check if plugin file loaded
  if (!isLoaded(`plugin-${pluginId}-${commandName}`)) {
    // Lazy load
    const file = `.claude/plugins/${pluginId}/commands/${commandName}.md`;
    const content = readFile(file);
    const tokens = estimateTokens(content);

    console.log(`📂 Lazy loading: ${file} (${tokens} tokens)`);
    loadIntoContext(content);
    markAsLoaded(`plugin-${pluginId}-${commandName}`);
  }

  // Execute command
  executeCommand(pluginId, commandName);
}
```

## ✅ Benefits Plugin Optimization

### For Framework

- **99% Reduction** in initial load
- **Scalable** - can add unlimited plugins without bloat
- **Modular** - plugins truly independent
- **Maintainable** - easier to update individual plugins

### For Users

- **Faster startup** - 1,646 tokens vs 150,000+
- **More context** - 148,000+ tokens available for work
- **Better performance** - smaller context = faster responses
- **Flexible** - use only what you need

### For Plugin Developers

- **Clear structure** - manifest-based system
- **Token budgeting** - know exact cost per file
- **Easy testing** - validate lazy loading
- **Documentation** - Context7 integration built-in

## 🚀 Next Steps

### Phase 1: Core Framework (DONE ✅)
- base-optimized.md created
- Quick references created
- Lazy loading architecture designed

### Phase 2: Plugin System (TODO)
- [ ] Update plugin structure for lazy loading
- [ ] Generate plugin manifests
- [ ] Update installer to support optimized plugins
- [ ] Add lazy loading triggers to base-optimized.md
- [ ] Test with plugin-core and plugin-pm
- [ ] Validate token savings

### Phase 3: Migration (TODO)
- [ ] Migrate existing plugins to new structure
- [ ] Update plugin documentation
- [ ] Create plugin optimization guide
- [ ] Test all 11 plugins
- [ ] Validate cross-plugin compatibility

## 📝 Summary

**Pluginy MOGĄ być zoptymalizowane** używając tej samej strategii lazy loading:

1. **Manifest w CLAUDE.md** (~50 tokens per plugin)
2. **Lazy loading per command** (300-600 tokens on-demand)
3. **Lazy loading per agent** (600 tokens on-demand)
4. **Rules on-demand** (only when needed)

**Rezultat:**
- Start: 1,646 tokens (manifest wszystkich pluginów)
- Użycie: +300-600 tokens per command/agent
- Typowa sesja: 3,000-5,000 tokens
- **vs Old: 150,000+ tokens**
- **Savings: 97%+**

System jest **gotowy do rozszerzenia o pluginy**! 🎉
