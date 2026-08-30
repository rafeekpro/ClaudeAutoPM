// CI/CD addon resolution + rules-cleanup scoping (confabulation fixes).
//
// Two defects this suite pins down:
//
// 1. getRequiredAddons() read `currentConfig.cicd.provider`, a key nothing in
//    the repo ever writes. No config template defines it and the real schema
//    uses `features.cicd` (bin/commands/config.js). The github/azure/gitlab
//    branches were unreachable, so every scaffolded repo got `no-cicd` — a
//    CLAUDE.md asserting "no CI/CD" plus "git push origin main", which also
//    contradicts base.md's "Direct commits to main" prohibition.
//
// 2. installPlugins() cleaned `.claude/rules/` by deleting every file, wiping
//    the framework `.xml` rules installFramework() had just copied. base.md
//    and the quick-ref/agent docs then pointed at files that no longer existed.

const fs = require('fs');
const os = require('os');
const path = require('path');

const Installer = require('../../install/install');

const TEMPLATES_DIR = path.join(
  __dirname, '..', '..',
  'autopm', '.claude', 'templates', 'claude-templates'
);

function installerWith(config) {
  const installer = new Installer();
  installer.currentConfig = config;
  return installer;
}

// Only the CI/CD slot matters here; the agent/workflow addons are driven by
// unrelated config and would just add noise to every assertion.
const CICD_ADDONS = ['github-actions', 'azure-devops', 'gitlab-ci', 'no-cicd'];

function cicdAddonFor(config) {
  return installerWith(config)
    .getRequiredAddons()
    .filter(addon => CICD_ADDONS.includes(addon));
}

describe('getRequiredAddons - CI/CD provider resolution', () => {
  it('honours an explicit cicd.provider', () => {
    expect(cicdAddonFor({ cicd: { provider: 'github' } })).toEqual(['github-actions']);
    expect(cicdAddonFor({ cicd: { provider: 'azure' } })).toEqual(['azure-devops']);
    expect(cicdAddonFor({ cicd: { provider: 'gitlab' } })).toEqual(['gitlab-ci']);
  });

  // The key the rest of the codebase actually writes and reads.
  it('resolves the provider from features.cicd', () => {
    expect(cicdAddonFor({ features: { cicd: 'github' } })).toEqual(['github-actions']);
    expect(cicdAddonFor({ features: { cicd: 'azure' } })).toEqual(['azure-devops']);
    expect(cicdAddonFor({ features: { cicd: 'gitlab' } })).toEqual(['gitlab-ci']);
  });

  it('accepts the platform spellings config.js displays', () => {
    expect(cicdAddonFor({ features: { cicd: 'github-actions' } })).toEqual(['github-actions']);
    expect(cicdAddonFor({ features: { cicd: 'azure-devops' } })).toEqual(['azure-devops']);
    expect(cicdAddonFor({ features: { cicd: 'gitlab-ci' } })).toEqual(['gitlab-ci']);
    expect(cicdAddonFor({ features: { cicd: 'GitHub' } })).toEqual(['github-actions']);
  });

  // Every shipped config template sets github_actions_k8s but no cicd key.
  it('infers github from the github_actions_k8s feature flag', () => {
    expect(cicdAddonFor({ features: { github_actions_k8s: true } })).toEqual(['github-actions']);
  });

  it('infers github from an enabled toggle in the github_actions block', () => {
    expect(cicdAddonFor({ github_actions: { matrix_testing: true } })).toEqual(['github-actions']);
  });

  // Unlike `kubernetes`, the github_actions block has no `enabled` key, so an
  // all-false block is absence of evidence rather than evidence of a provider.
  it('treats an all-false github_actions block as no signal', () => {
    expect(cicdAddonFor({
      github_actions: {
        kubernetes_tests: false,
        docker_integration: false,
        matrix_testing: false,
        cache_optimization: false
      }
    })).toEqual([]);
  });

  it('emits no CI/CD addon when the provider cannot be resolved', () => {
    // Silence is honest; a hardcoded "this project has no CI/CD" is not.
    expect(cicdAddonFor({ features: { github_actions_k8s: false } })).toEqual([]);
    expect(cicdAddonFor({})).toEqual([]);
  });

  it('emits no CI/CD addon when the project declares none explicitly', () => {
    expect(cicdAddonFor({ features: { cicd: 'none' } })).toEqual([]);
    expect(cicdAddonFor({ cicd: { provider: 'none' } })).toEqual([]);
  });

  it('still defaults to github when there is no config at all', () => {
    const installer = new Installer();
    installer.currentConfig = null;
    expect(installer.getRequiredAddons()).toContain('github-actions');
  });

  // The regression that started this: every template used to land on no-cicd,
  // because the branch keyed off `cicd.provider`, which nothing ever writes.
  it('never emits no-cicd for a shipped config template', () => {
    const templatesDir = path.join(
      __dirname, '..', '..',
      'autopm', '.claude', 'templates', 'config-templates'
    );

    const resolved = {};
    for (const file of fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'))) {
      const config = JSON.parse(fs.readFileSync(path.join(templatesDir, file), 'utf-8'));
      resolved[file] = cicdAddonFor(config);
    }

    expect(resolved).toEqual({
      'docker-only.json': ['github-actions'],
      'full-devops.json': ['github-actions'],
      'performance.json': ['github-actions'],
      // Every GHA toggle is false here, so the scaffold stays silent about CI.
      'minimal.json': []
    });
  });
});

describe('no-cicd template honesty', () => {
  const noCicd = fs.readFileSync(path.join(TEMPLATES_DIR, 'addons', 'no-cicd.md'), 'utf-8');
  const base = fs.readFileSync(path.join(TEMPLATES_DIR, 'base.md'), 'utf-8');

  it('does not tell the reader to push straight to main', () => {
    // base.md lists "Direct commits to main" under ABSOLUTE PROHIBITIONS.
    expect(base).toMatch(/Direct commits to main/);
    expect(noCicd).not.toMatch(/push\s+origin\s+main/);
  });

  it('does not assert as fact that the project has no CI/CD', () => {
    expect(noCicd).not.toMatch(/This project uses local development workflow without CI\/CD/i);
  });

  it('marks the unresolved provider as something the owner must fill in', () => {
    expect(noCicd).toMatch(/FILL IN/);
  });
});

describe('rules cleanup scoping', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'autopm-rules-clean-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function seedRules(files) {
    const rulesDir = path.join(tmpDir, '.claude', 'rules');
    fs.mkdirSync(rulesDir, { recursive: true });
    for (const [name, body] of Object.entries(files)) {
      fs.writeFileSync(path.join(rulesDir, name), body);
    }
    return rulesDir;
  }

  function cleanWith(pluginRuleNames) {
    const installer = new Installer();
    installer.targetDir = tmpDir;
    installer.cleanPluginRules(pluginRuleNames);
    return fs.readdirSync(path.join(tmpDir, '.claude', 'rules')).sort();
  }

  it('removes stale plugin-owned rules', () => {
    seedRules({
      'tdd.enforcement.md': 'current',
      'retired-rule.md': 'stale'
    });
    // Only tdd.enforcement.md is still shipped by a plugin.
    expect(cleanWith(['tdd.enforcement.md'])).toEqual(['tdd.enforcement.md']);
  });

  it('keeps framework .xml rules that base.md points at', () => {
    seedRules({
      'tdd.enforcement.xml': 'framework',
      'agent-mandatory.xml': 'framework',
      'context7.xml': 'framework',
      'retired-rule.md': 'stale'
    });

    expect(cleanWith(['tdd.enforcement.md'])).toEqual([
      'agent-mandatory.xml',
      'context7.xml',
      'tdd.enforcement.xml'
    ]);
  });

  it('leaves the rules directory alone when it does not exist', () => {
    const installer = new Installer();
    installer.targetDir = tmpDir;
    expect(() => installer.cleanPluginRules(['tdd.enforcement.md'])).not.toThrow();
  });
});

describe('base.md rule pointers resolve after install', () => {
  it('points only at framework rules that ship in autopm/.claude/rules', () => {
    const base = fs.readFileSync(path.join(TEMPLATES_DIR, 'base.md'), 'utf-8');
    const rulesDir = path.join(__dirname, '..', '..', 'autopm', '.claude', 'rules');

    const pointers = [...base.matchAll(/\.claude\/rules\/([\w.-]+\.(?:xml|md))/g)]
      .map(m => m[1]);

    expect(pointers.length).toBeGreaterThan(0);

    for (const pointer of pointers) {
      expect({ pointer, exists: fs.existsSync(path.join(rulesDir, pointer)) })
        .toEqual({ pointer, exists: true });
    }
  });
});
