#!/usr/bin/env node
/**
 * PRD New - Launch brainstorming for new product requirement
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class PrdCreator {
  constructor() {
    this.prdsDir = path.join('.claude', 'prds');
    this.templatesDir = path.join(__dirname, '..', '..', 'templates');
  }

  async createPrd(prdName) {
    console.log(`\n🚀 Creating New PRD: ${prdName}`);
    console.log(`${'═'.repeat(50)}\n`);

    // Ensure PRDs directory exists
    if (!fs.existsSync(this.prdsDir)) {
      fs.mkdirSync(this.prdsDir, { recursive: true });
    }

    // Check if PRD already exists
    const prdFile = path.join(this.prdsDir, `${prdName}.md`);
    if (fs.existsSync(prdFile)) {
      console.error(`❌ PRD already exists: ${prdName}`);
      console.log(`💡 Edit file: .claude/prds/${prdName}.md`);
      return false;
    }

    // Create interface for brainstorming
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const prompt = (question) => new Promise((resolve) => {
      rl.question(question, resolve);
    });

    try {
      console.log('🧠 Let\'s brainstorm your product requirement!\n');

      // Gather information
      const prdData = {};

      // Product Vision
      console.log('📌 Product Vision');
      console.log('What problem are you trying to solve? What\'s the vision?');
      prdData.vision = await prompt('Vision: ');

      // Target Users
      console.log('\n👥 Target Users');
      console.log('Who will use this feature? What are their needs?');
      prdData.users = await prompt('Target users: ');

      // Key Features
      console.log('\n✨ Key Features');
      console.log('What are the main features? (enter one per line, empty line to finish)');
      prdData.features = [];
      let feature;
      while ((feature = await prompt('Feature: ')) !== '') {
        prdData.features.push(feature);
      }

      // Success Metrics
      console.log('\n📊 Success Metrics');
      console.log('How will you measure success?');
      prdData.metrics = await prompt('Success metrics: ');

      // Technical Considerations
      console.log('\n🔧 Technical Considerations');
      console.log('Any technical constraints or requirements?');
      prdData.technical = await prompt('Technical notes: ');

      // Priority
      console.log('\n🎯 Priority');
      console.log('What\'s the priority? (P0=Critical, P1=High, P2=Medium, P3=Low)');
      prdData.priority = await prompt('Priority (P0/P1/P2/P3): ') || 'P2';

      // Timeline
      console.log('\n⏰ Timeline');
      console.log('When should this be delivered?');
      prdData.timeline = await prompt('Timeline: ');

      // Generate PRD
      const prdContent = this.generatePrdContent(prdName, prdData);

      // Write PRD file
      fs.writeFileSync(prdFile, prdContent);

      console.log('\n✅ PRD created successfully!');
      console.log(`📄 File: ${prdFile}`);

      // Show comprehensive next steps
      this.showNextSteps(prdName);

    } finally {
      rl.close();
    }

    return true;
  }

  showNextSteps(prdName) {
    console.log('\n' + '═'.repeat(60));
    console.log('📋 What You Can Do Next:');
    console.log('═'.repeat(60) + '\n');

    console.log('🎯 Option 1: Quick Start (Recommended for Simple Features)');
    console.log('   One command to parse, decompose, and sync to GitHub:');
    console.log(`   /pm:epic-oneshot ${prdName}`);
    console.log('   ✨ This creates epic + tasks + GitHub issues automatically\n');

    console.log('🔀 Option 2: Split into Multiple Epics (For Complex Features)');
    console.log('   Break down large PRD into focused sub-epics:');
    console.log(`   /pm:prd-split ${prdName}`);
    console.log('   Example: payment-system → backend, frontend, security');
    console.log('   📚 See README section "Splitting Large PRDs into Multiple Epics"\n');

    console.log('🛠️  Option 3: Step-by-Step Workflow (Full Control)');
    console.log('   a) Convert PRD to epic:');
    console.log(`      /pm:prd-parse ${prdName}`);
    console.log('   b) Break epic into tasks:');
    console.log(`      /pm:epic-decompose ${prdName}`);
    console.log('   c) Push to GitHub/Azure:');
    console.log(`      /pm:epic-sync ${prdName}\n`);

    console.log('📝 Option 4: Review & Edit First');
    console.log('   Review and refine the PRD before processing:');
    console.log(`   nano .claude/prds/${prdName}.md`);
    console.log('   Then use any option above\n');

    console.log('📊 Option 5: Check Status');
    console.log('   View PRD and track progress:');
    console.log(`   /pm:prd-status ${prdName}\n`);

    console.log(`💡 Don't know which to choose?`);
    console.log('   • Small feature (< 10 tasks)? → Use Option 1 (/pm:epic-oneshot)');
    console.log('   • Large feature (15+ tasks)? → Use Option 2 (/pm:prd-split)');
    console.log('   • Need full control? → Use Option 3 (step-by-step)');
    console.log('');
  }

  generatePrdContent(name, data) {
    const timestamp = new Date().toISOString();
    const author = process.env.USER || 'unknown';

    return `# PRD: ${name}

---
status: draft
priority: ${data.priority}
created: ${timestamp}
author: ${author}
timeline: ${data.timeline || 'TBD'}
---

## Executive Summary

${data.vision || 'Product vision to be defined...'}

## Problem Statement

### Background
${data.vision ? `The need for this feature arises from: ${data.vision}` : 'Context and background to be added...'}

### Current State
- Current limitations and pain points
- Existing workarounds users employ
- Impact on user experience

### Desired State
- How the solution will address the problem
- Expected improvements and benefits
- Success criteria

## Target Users

${data.users || 'Target user segments to be defined...'}

### User Personas
- **Primary Users**: Core user segment
- **Secondary Users**: Additional beneficiaries
- **Stakeholders**: Indirect beneficiaries

### User Stories
${data.features.length > 0 ? data.features.map(f => `- As a user, I want to ${f}`).join('\n') : '- User stories to be defined...'}

## Key Features

### Must Have (P0)
${data.features.length > 0 ? data.features.slice(0, 3).map(f => `- [ ] ${f}`).join('\n') : '- [ ] Core feature 1\n- [ ] Core feature 2'}

### Should Have (P1)
${data.features.length > 3 ? data.features.slice(3, 6).map(f => `- [ ] ${f}`).join('\n') : '- [ ] Additional feature 1\n- [ ] Additional feature 2'}

### Nice to Have (P2)
${data.features.length > 6 ? data.features.slice(6).map(f => `- [ ] ${f}`).join('\n') : '- [ ] Enhancement 1\n- [ ] Enhancement 2'}

## Success Metrics

${data.metrics || 'Success metrics to be defined...'}

### Key Performance Indicators (KPIs)
- **Adoption Rate**: Target percentage of users adopting the feature
- **User Satisfaction**: Target NPS or satisfaction score
- **Performance**: Response time, throughput targets
- **Quality**: Bug rate, error rate targets

### Measurement Plan
- How metrics will be collected
- Reporting frequency
- Success thresholds

## Technical Requirements

${data.technical || 'Technical requirements to be specified...'}

### Architecture Considerations
- System components affected
- Integration points
- Data flow and storage

### Non-Functional Requirements
- **Performance**: Response time < 200ms
- **Scalability**: Support for X concurrent users
- **Security**: Authentication, authorization requirements
- **Reliability**: 99.9% uptime target

### Dependencies
- External services or APIs
- Internal systems or components
- Third-party libraries or tools

## Implementation Plan

### Phase 1: Foundation (Week 1-2)
- [ ] Technical design review
- [ ] Set up development environment
- [ ] Create initial architecture

### Phase 2: Core Features (Week 3-4)
- [ ] Implement must-have features
- [ ] Initial testing
- [ ] Code review

### Phase 3: Enhancement (Week 5-6)
- [ ] Implement should-have features
- [ ] Integration testing
- [ ] Performance optimization

### Phase 4: Release (Week 7-8)
- [ ] Final testing
- [ ] Documentation
- [ ] Deployment

## Risks and Mitigation

### Technical Risks
- **Risk 1**: Description and mitigation strategy
- **Risk 2**: Description and mitigation strategy

### Business Risks
- **Risk 1**: Impact and contingency plan
- **Risk 2**: Impact and contingency plan

## Open Questions

- [ ] Question 1 requiring clarification
- [ ] Question 2 needing stakeholder input
- [ ] Question 3 for technical investigation

## Appendix

### References
- Related documentation
- Previous PRDs
- Market research

### Glossary
- Term definitions
- Acronym explanations

### Changelog
- ${timestamp}: Initial PRD created by ${author}

---

*This PRD is a living document. Updates should be tracked in the changelog section.*
`;
  }

  listExistingPrds() {
    if (fs.existsSync(this.prdsDir)) {
      const prds = fs.readdirSync(this.prdsDir)
        .filter(f => f.endsWith('.md'))
        .map(f => f.replace('.md', ''));

      if (prds.length > 0) {
        console.log('\n📋 Existing PRDs:');
        prds.forEach(prd => {
          const prdFile = path.join(this.prdsDir, `${prd}.md`);
          const content = fs.readFileSync(prdFile, 'utf8');
          const priorityMatch = content.match(/priority: (P\d)/);
          const statusMatch = content.match(/status: (\w+)/);

          const priority = priorityMatch ? priorityMatch[1] : 'P2';
          const status = statusMatch ? statusMatch[1] : 'draft';

          console.log(`  • ${prd} [${priority}] (${status})`);
        });
      } else {
        console.log('  No PRDs found');
      }
    }
  }

  async run(args) {
    let prdName = args[0];

    if (!prdName) {
      // Interactive mode
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const prompt = (question) => new Promise((resolve) => {
        rl.question(question, resolve);
      });

      console.log('\n🚀 PRD Creation Wizard');
      console.log(`${'═'.repeat(50)}`);

      this.listExistingPrds();

      console.log('\n');
      prdName = await prompt('Enter PRD name (use-kebab-case): ');
      rl.close();

      if (!prdName) {
        console.error('❌ Error: PRD name required');
        process.exit(1);
      }
    }

    // Sanitize PRD name
    prdName = prdName.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    const success = await this.createPrd(prdName);
    process.exit(success ? 0 : 1);
  }
}

// Main execution
if (require.main === module) {
  const creator = new PrdCreator();
  creator.run(process.argv.slice(2)).catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

module.exports = PrdCreator;