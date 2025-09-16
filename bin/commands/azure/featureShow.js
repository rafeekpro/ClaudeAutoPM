/**
 * /azure:feature-show
 * Auto-migrated from azure:feature-show.md
 */

const agentExecutor = require('../../../lib/agentExecutor');
const {
  validateInput,
  loadEnvironment,
  isVerbose,
  printError,
  printSuccess,
  printInfo,
  printWarning,
  createSpinner
} = require('../../../lib/commandHelpers');

// --- Agent Prompt ---
const AGENT_PROMPT = `# /azure:feature-show

Display detailed information about a Feature in Azure DevOps.

## Usage

\`\`\`bash
/azure:feature-show <feature-id>
\`\`\`

## Description

Shows comprehensive details about a Feature including User Stories, progress, and metrics.

## Steps

1. **Fetch Feature details**
   \`\`\`bash
   # Get feature information
   az boards work-item show --id <feature-id> --output json > feature.json

   # Extract key fields
   feature_title=$(jq -r '.fields["System.Title"]' feature.json)
   feature_state=$(jq -r '.fields["System.State"]' feature.json)
   feature_desc=$(jq -r '.fields["System.Description"]' feature.json)
   business_value=$(jq -r '.fields["Microsoft.VSTS.Common.BusinessValue"]' feature.json)
   target_date=$(jq -r '.fields["Microsoft.VSTS.Scheduling.TargetDate"]' feature.json)
   \`\`\`

2. **Display Feature information**
   \`\`\`bash
   echo "════════════════════════════════════════════════════════════════"
   echo "📦 FEATURE #<feature-id>: $feature_title"
   echo "════════════════════════════════════════════════════════════════"
   echo ""
   echo "📊 Status: $feature_state"
   echo "💰 Business Value: $business_value"
   echo "📅 Target Date: $target_date"
   echo ""
   echo "📝 Description:"
   echo "$feature_desc"
   echo ""
   \`\`\`

3. **Show child User Stories**
   \`\`\`bash
   echo "📚 User Stories:"
   echo "────────────────────────────────────────────────────────────────"

   # Query child user stories
   az boards query --wiql "SELECT [System.Id], [System.Title], [System.State], \\
     [Microsoft.VSTS.Scheduling.StoryPoints] \\
     FROM WorkItemLinks \\
     WHERE Source.[System.Id] = <feature-id> \\
     AND [System.Links.LinkType] = 'Child' \\
     AND Target.[System.WorkItemType] = 'User Story'" \\
     --output json > stories.json

   # Display stories with progress
   jq -r '.[] |
     "  📖 [\\(.id)] \\(.fields["System.Title"])\\n" +
     "     State: \\(.fields["System.State"]) | Points: \\(.fields["Microsoft.VSTS.Scheduling.StoryPoints"] // "unestimated")"
   ' stories.json
   \`\`\`

4. **Calculate progress metrics**
   \`\`\`bash
   echo ""
   echo "📈 Progress Metrics:"
   echo "────────────────────────────────────────────────────────────────"

   # Count stories by state
   total_stories=$(jq 'length' stories.json)
   completed_stories=$(jq '[.[] | select(.fields["System.State"] == "Closed")] | length' stories.json)
   active_stories=$(jq '[.[] | select(.fields["System.State"] == "Active")] | length' stories.json)

   # Calculate story points
   total_points=$(jq '[.[] | .fields["Microsoft.VSTS.Scheduling.StoryPoints"] // 0] | add' stories.json)
   completed_points=$(jq '[.[] |
     select(.fields["System.State"] == "Closed") |
     .fields["Microsoft.VSTS.Scheduling.StoryPoints"] // 0] | add' stories.json)

   # Display metrics
   echo "  📊 Stories: $completed_stories/$total_stories completed"
   echo "  🎯 Story Points: $completed_points/$total_points completed"

   # Calculate percentage
   if [ "$total_points" -gt 0 ]; then
     percentage=$((completed_points * 100 / total_points))
     echo "  📉 Progress: $percentage%"

     # Progress bar
     echo -n "  ["
     for i in {1..20}; do
       if [ $((i * 5)) -le $percentage ]; then
         echo -n "█"
       else
         echo -n "░"
       fi
     done
     echo "] $percentage%"
   fi
   \`\`\`

5. **Show related information**
   \`\`\`bash
   echo ""
   echo "🔗 Related Information:"
   echo "────────────────────────────────────────────────────────────────"

   # Parent epic/initiative
   parent=$(jq -r '.relations[] |
     select(.rel == "System.LinkTypes.Hierarchy-Reverse") |
     .url' feature.json)
   if [ -n "$parent" ]; then
     parent_id=$(echo "$parent" | grep -oE '[0-9]+$')
     parent_info=$(az boards work-item show --id "$parent_id" --query '{Title:fields["System.Title"], Type:fields["System.WorkItemType"]}' -o json)
     echo "  🎯 Parent: $(echo "$parent_info" | jq -r '"\\(.Type) #'$parent_id': \\(.Title)"')"
   fi

   # Related PRs
   echo "  🔀 Pull Requests:"
   az boards work-item relation show --id <feature-id> --query "[?attributes.name=='Pull Request'].url" -o tsv | while read pr_url; do
     echo "    - $pr_url"
   done

   # Tags
   tags=$(jq -r '.fields["System.Tags"]' feature.json)
   [ -n "$tags" ] && echo "  🏷️ Tags: $tags"

   # Assigned to
   assignee=$(jq -r '.fields["System.AssignedTo"].displayName' feature.json)
   [ -n "$assignee" ] && echo "  👤 Assigned to: $assignee"
   \`\`\`

6. **Show timeline**
   \`\`\`bash
   echo ""
   echo "📅 Timeline:"
   echo "────────────────────────────────────────────────────────────────"

   created=$(jq -r '.fields["System.CreatedDate"]' feature.json)
   activated=$(jq -r '.fields["Microsoft.VSTS.Common.ActivatedDate"]' feature.json)
   resolved=$(jq -r '.fields["Microsoft.VSTS.Common.ResolvedDate"]' feature.json)
   closed=$(jq -r '.fields["Microsoft.VSTS.Common.ClosedDate"]' feature.json)

   echo "  📝 Created: $created"
   [ "$activated" != "null" ] && echo "  ▶️ Activated: $activated"
   [ "$resolved" != "null" ] && echo "  ✅ Resolved: $resolved"
   [ "$closed" != "null" ] && echo "  🏁 Closed: $closed"
   \`\`\`

## Options

- \`--json\` - Output in JSON format
- \`--minimal\` - Show only essential information
- \`--no-children\` - Don't show child work items
- \`--export\` - Export to markdown file

## Examples

\`\`\`bash
# Show feature details
/azure:feature-show 12345

# Minimal view
/azure:feature-show 12345 --minimal

# Export to file
/azure:feature-show 12345 --export > feature-12345.md

# JSON output for processing
/azure:feature-show 12345 --json | jq '.stories'
\`\`\`

## Related Commands

- \`/azure:feature-list\` - List all Features
- \`/azure:feature-edit\` - Edit Feature details
- \`/azure:feature-status\` - Feature dashboard
- \`/azure:us-list\` - List User Stories
- \`/pm:epic-show\` - Show local epic (PM system)`;

// --- Command Definition ---
exports.command = 'azure:feature-show';
exports.describe = '/azure:feature-show';

exports.builder = (yargs) => {
  return yargs
    .option('verbose', {
      describe: 'Verbose output',
      type: 'boolean',
      alias: 'v'
    })
    .option('dry-run', {
      describe: 'Simulate without making changes',
      type: 'boolean',
      default: false
    });
};

exports.handler = async (argv) => {
  const spinner = createSpinner('Executing azure:feature-show...');

  try {
    spinner.start();

    // Load environment if needed
    loadEnvironment();

    // Validate input if needed
    

    // Prepare context
    const context = {
      
      verbose: isVerbose(argv),
      dryRun: argv.dryRun
    };

    if (isVerbose(argv)) {
      printInfo('Executing with context:');
      console.log(JSON.stringify(context, null, 2));
    }

    // Execute agent
    const agentType = 'azure-devops-specialist';

    const result = await agentExecutor.run(agentType, AGENT_PROMPT, context);

    if (result.status === 'success') {
      spinner.succeed();
      printSuccess('Command executed successfully!');
    } else {
      spinner.fail();
      printError(`Command failed: ${result.message || 'Unknown error'}`);
      process.exit(1);
    }

  } catch (error) {
    spinner.fail();
    printError(`Error: ${error.message}`, error);
    process.exit(1);
  }
};