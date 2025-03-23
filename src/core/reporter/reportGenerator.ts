import fs from 'fs';
import chalk from 'chalk';
import { ReportOptions, UpdateImpact } from '../../types';

export async function generateReport(
  impacts: UpdateImpact[],
  options: ReportOptions
): Promise<void> {
  // Filter by relevance
  const minRelevance = options.minRelevance || 0;
  const filteredImpacts = impacts.filter(impact => impact.relevanceScore >= minRelevance);
  
  if (filteredImpacts.length === 0) {
    console.log(chalk.yellow('\nNo relevant dependency updates found.'));
    return;
  }
  
  // Generate report in the requested format
  let report: string;
  
  switch (options.format) {
    case 'markdown':
      report = generateMarkdownReport(filteredImpacts);
      break;
    case 'json':
      report = JSON.stringify(filteredImpacts, null, 2);
      break;
    case 'console':
    default:
      generateConsoleReport(filteredImpacts);
      return; // Console output is handled directly
  }
  
  // Save to file if needed
  if (options.outputFile) {
    fs.writeFileSync(options.outputFile, report);
  } else {
    console.log(report);
  }
}

function generateConsoleReport(impacts: UpdateImpact[]): void {
  console.log(chalk.bold('\n📋 Dependency Update Report'));
  console.log(chalk.gray('─'.repeat(60)));
  
  impacts.forEach((impact, index) => {
    const { dependency, latestVersion, changelogEntries, affectedFiles, relevanceScore } = impact;
    
    // Header
    console.log(chalk.bold(`\n${index + 1}. ${dependency.name}`));
    console.log(`${chalk.yellow(dependency.version)} → ${chalk.green(latestVersion)}`);
    
    // Relevance indicator
    const relevanceColor = relevanceScore > 70 ? 'red' : relevanceScore > 40 ? 'yellow' : 'blue';
    console.log(`Relevance: ${chalk[relevanceColor](`${relevanceScore}%`)}`);
    
    // Affected files
    console.log(`\nAffects ${affectedFiles.length} files`);
    if (affectedFiles.length <= 3) {
      affectedFiles.forEach(file => console.log(`  - ${file}`));
    } else {
      affectedFiles.slice(0, 2).forEach(file => console.log(`  - ${file}`));
      console.log(`  - ...and ${affectedFiles.length - 2} more files`);
    }
    
    // Changes
    console.log('\nKey changes:');
    const allChanges = changelogEntries.flatMap(entry => 
      entry.changes.map(change => `[${entry.version}] ${change}`)
    );
    
    if (allChanges.length <= 5) {
      allChanges.forEach(change => console.log(`  - ${change}`));
    } else {
      allChanges.slice(0, 5).forEach(change => console.log(`  - ${change}`));
      console.log(`  - ...and ${allChanges.length - 5} more changes`);
    }
    
    console.log(chalk.gray('─'.repeat(60)));
  });
}

function generateMarkdownReport(impacts: UpdateImpact[]): string {
  let markdown = '# DependSight Update Report\n\n';
  
  impacts.forEach((impact, index) => {
    const { dependency, latestVersion, changelogEntries, affectedFiles, relevanceScore } = impact;
    
    // Header
    markdown += `## ${index + 1}. ${dependency.name} (${dependency.version} → ${latestVersion})\n\n`;
    markdown += `**Relevance Score:** ${relevanceScore}%\n\n`;
    
    // Affected files
    markdown += `### Affected Files (${affectedFiles.length})\n\n`;
    if (affectedFiles.length <= 5) {
      affectedFiles.forEach(file => markdown += `- \`${file}\`\n`);
    } else {
      affectedFiles.slice(0, 5).forEach(file => markdown += `- \`${file}\`\n`);
      markdown += `- ...and ${affectedFiles.length - 5} more files\n`;
    }
    markdown += '\n';
    
    // Changes
    markdown += '### Changelog\n\n';
    
    changelogEntries.forEach(entry => {
      markdown += `#### Version ${entry.version}${entry.date ? ` (${entry.date})` : ''}\n\n`;
      entry.changes.forEach(change => markdown += `- ${change}\n`);
      markdown += '\n';
    });
    
    markdown += '---\n\n';
  });
  
  return markdown;
} 