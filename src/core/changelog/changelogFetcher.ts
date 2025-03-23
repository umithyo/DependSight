import axios from 'axios';
import semver from 'semver';
import fs from 'fs';
import path from 'path';
import { AnalysisResult, ChangelogEntry, UpdateImpact } from '../../types';

export async function fetchChangelogs(analysisResult: AnalysisResult): Promise<UpdateImpact[]> {
  const { dependencies, usages, projectRoot } = analysisResult;
  const impacts: UpdateImpact[] = [];
  
  // Group usages by dependency
  const usagesByDependency = new Map();
  usages.forEach(usage => {
    const depName = usage.dependency.name;
    if (!usagesByDependency.has(depName)) {
      usagesByDependency.set(depName, []);
    }
    usagesByDependency.get(depName).push(usage);
  });
  
  for (const dependency of dependencies) {
    try {
      // Skip if no usages
      const depUsages = usagesByDependency.get(dependency.name) || [];
      if (depUsages.length === 0 && !dependency.isDevDependency) {
        continue;
      }
      
      // Get latest version
      const latestVersion = await getLatestVersion(dependency.name);
      
      // Skip if already at latest version
      if (!latestVersion || semver.lte(latestVersion, dependency.version)) {
        continue;
      }
      
      // Fetch changelog entries
      const changelogEntries = await fetchChangelogEntries(
        dependency.name,
        dependency.version,
        latestVersion
      );
      
      if (changelogEntries.length === 0) {
        continue;
      }
      
      // Calculate relevance score
      const relevanceScore = calculateRelevanceScore(
        changelogEntries,
        depUsages,
        dependency.isDevDependency
      );
      
      // Build affected files list
      const affectedFiles = [...new Set(depUsages.map(usage => usage.file))];
      
      impacts.push({
        dependency,
        latestVersion,
        affectedFiles,
        changelogEntries,
        relevanceScore
      });
    } catch (error) {
      console.warn(`Error processing ${dependency.name}: ${(error as Error).message}`);
    }
  }
  
  // Sort by relevance score (descending)
  return impacts.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

async function getLatestVersion(packageName: string): Promise<string | null> {
  try {
    const response = await axios.get(`https://registry.npmjs.org/${packageName}`);
    return response.data['dist-tags']?.latest || null;
  } catch (error) {
    console.warn(`Error fetching latest version for ${packageName}`);
    return null;
  }
}

async function fetchChangelogEntries(
  packageName: string,
  currentVersion: string,
  latestVersion: string
): Promise<ChangelogEntry[]> {
  const entries: ChangelogEntry[] = [];
  
  try {
    // First attempt: GitHub API
    // This is a simplified implementation. In a real implementation,
    // we would determine the GitHub repo URL from the package info
    const pkgInfo = await axios.get(`https://registry.npmjs.org/${packageName}`);
    const repoUrl = pkgInfo.data.repository?.url || '';
    
    if (repoUrl) {
      const githubMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
      if (githubMatch) {
        const [, owner, repo] = githubMatch;
        await tryGitHubChangelog(owner, repo, currentVersion, latestVersion, entries);
      }
    }
    
    // If we found no entries, try to parse from CHANGELOG.md
    if (entries.length === 0) {
      await tryChangelogFile(packageName, currentVersion, latestVersion, entries);
    }
    
    // If still no entries, create a generic one
    if (entries.length === 0) {
      entries.push({
        version: latestVersion,
        changes: [`Update from ${currentVersion} to ${latestVersion}`],
        type: determineSemverChangeType(currentVersion, latestVersion)
      });
    }
  } catch (error) {
    console.warn(`Error fetching changelog for ${packageName}: ${(error as Error).message}`);
  }
  
  return entries;
}

async function tryGitHubChangelog(
  owner: string,
  repo: string,
  currentVersion: string,
  latestVersion: string,
  entries: ChangelogEntry[]
): Promise<void> {
  try {
    // This is a simplified implementation, in reality you'd need to handle pagination
    // and rate limits properly
    const releasesUrl = `https://api.github.com/repos/${owner}/${repo}/releases`;
    const response = await axios.get(releasesUrl);
    
    const releases = response.data.filter((release: any) => {
      const version = release.tag_name.replace(/^v/, '');
      return semver.valid(version) && 
             semver.gt(version, currentVersion) && 
             semver.lte(version, latestVersion);
    });
    
    for (const release of releases) {
      const version = release.tag_name.replace(/^v/, '');
      entries.push({
        version,
        date: release.published_at?.split('T')[0],
        changes: parseReleaseBody(release.body),
        type: determineSemverChangeType(currentVersion, version)
      });
    }
  } catch (error) {
    // Silently fail as we'll try other methods
  }
}

async function tryChangelogFile(
  packageName: string,
  currentVersion: string,
  latestVersion: string,
  entries: ChangelogEntry[]
): Promise<void> {
  try {
    // This is a very simplified implementation
    // In practice, you'd need to locate and parse the CHANGELOG.md file
    // from the npm package or GitHub repo
    
    // For MVP purposes, we just check if the package is installed locally
    const nodeModulesPath = path.join(process.cwd(), 'node_modules', packageName);
    if (fs.existsSync(nodeModulesPath)) {
      const changelogPath = path.join(nodeModulesPath, 'CHANGELOG.md');
      if (fs.existsSync(changelogPath)) {
        const content = fs.readFileSync(changelogPath, 'utf8');
        parseChangelogMd(content, currentVersion, latestVersion, entries);
      }
    }
  } catch (error) {
    // Silently fail
  }
}

function parseReleaseBody(body: string): string[] {
  if (!body) return ['No details provided'];
  
  // Simple parsing, looking for list items
  return body
    .split('\n')
    .filter(line => line.trim().startsWith('- ') || line.trim().startsWith('* '))
    .map(line => line.trim().replace(/^[*-] /, ''))
    .filter(line => line.length > 0);
}

function parseChangelogMd(
  content: string,
  currentVersion: string,
  latestVersion: string,
  entries: ChangelogEntry[]
): void {
  // Very basic parsing of changelog
  // In a real implementation, this would be much more robust
  const versionSections = content.split(/\n##?\s+\[?v?([\d\.]+)\]?/i);
  
  for (let i = 1; i < versionSections.length; i += 2) {
    const version = versionSections[i];
    const sectionContent = versionSections[i + 1] || '';
    
    if (
      semver.valid(version) && 
      semver.gt(version, currentVersion) && 
      semver.lte(version, latestVersion)
    ) {
      // Extract date if present
      const dateMatch = sectionContent.match(/(\d{4}-\d{2}-\d{2})/);
      const date = dateMatch ? dateMatch[1] : undefined;
      
      // Extract changes
      const changes = sectionContent
        .split('\n')
        .filter(line => line.trim().startsWith('- ') || line.trim().startsWith('* '))
        .map(line => line.trim().replace(/^[*-] /, ''))
        .filter(line => line.length > 0);
      
      if (changes.length === 0) {
        changes.push('See changelog for details');
      }
      
      entries.push({
        version,
        date,
        changes,
        type: determineSemverChangeType(currentVersion, version)
      });
    }
  }
}

function determineSemverChangeType(
  currentVersion: string,
  newVersion: string
): 'major' | 'minor' | 'patch' {
  if (semver.major(newVersion) > semver.major(currentVersion)) {
    return 'major';
  }
  if (semver.minor(newVersion) > semver.minor(currentVersion)) {
    return 'minor';
  }
  return 'patch';
}

function calculateRelevanceScore(
  changelogEntries: ChangelogEntry[],
  usages: any[],
  isDevDependency: boolean
): number {
  // Simple scoring algorithm
  let score = 50; // Base score
  
  // Adjust for version change type
  const hasMajor = changelogEntries.some(entry => entry.type === 'major');
  const hasMinor = changelogEntries.some(entry => entry.type === 'minor');
  
  if (hasMajor) score += 30;
  else if (hasMinor) score += 15;
  
  // Adjust for usage count
  if (usages.length > 10) score += 20;
  else if (usages.length > 5) score += 10;
  else if (usages.length > 0) score += 5;
  
  // Adjust for dev dependency
  if (isDevDependency) score -= 20;
  
  // Ensure score is between 0-100
  return Math.max(0, Math.min(100, score));
} 