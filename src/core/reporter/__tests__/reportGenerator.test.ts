import { generateReport } from '../reportGenerator';
import fs from 'fs';
import { ReportOptions, UpdateImpact, Dependency, ChangelogEntry } from '../../../types';

// Mock dependencies
jest.mock('fs');

describe('generateReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate console report correctly', async () => {
    // Mock impacts
    const dependency: Dependency = { 
      name: 'react', 
      version: '17.0.2', 
      isDevDependency: false 
    };
    
    const changelogEntries: ChangelogEntry[] = [
      {
        version: '18.0.0',
        date: '2022-03-29',
        changes: ['New feature', 'Bug fix'],
        type: 'major'
      }
    ];
    
    const impacts: UpdateImpact[] = [
      {
        dependency,
        latestVersion: '18.0.0',
        affectedFiles: ['src/App.tsx', 'src/components/Button.tsx'],
        changelogEntries,
        relevanceScore: 85
      }
    ];
    
    // Mock options
    const options: ReportOptions = {
      format: 'console',
      minRelevance: 50
    };

    // Spy on console.log
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    await generateReport(impacts, options);

    // Verify console.log was called with expected content
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Dependency Update Report'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('react'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('17.0.2'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('18.0.0'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('85%'));
    
    // Restore console.log
    consoleLogSpy.mockRestore();
  });

  it('should generate markdown report correctly', async () => {
    // Similar mock data as above
    const dependency: Dependency = { 
      name: 'react', 
      version: '17.0.2', 
      isDevDependency: false 
    };
    
    const changelogEntries: ChangelogEntry[] = [
      {
        version: '18.0.0',
        date: '2022-03-29',
        changes: ['New feature', 'Bug fix'],
        type: 'major'
      }
    ];
    
    const impacts: UpdateImpact[] = [
      {
        dependency,
        latestVersion: '18.0.0',
        affectedFiles: ['src/App.tsx', 'src/components/Button.tsx'],
        changelogEntries,
        relevanceScore: 85
      }
    ];
    
    // Mock options for markdown output
    const options: ReportOptions = {
      format: 'markdown',
      minRelevance: 50,
      outputFile: 'report.md'
    };

    await generateReport(impacts, options);

    // Verify fs.writeFileSync was called with the right arguments
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      'report.md',
      expect.stringContaining('# DependSight Update Report')
    );
    
    // Check markdown content
    const markdownContent = (fs.writeFileSync as jest.Mock).mock.calls[0][1];
    expect(markdownContent).toContain('## 1. react');
    expect(markdownContent).toContain('17.0.2 → 18.0.0');
    expect(markdownContent).toContain('**Relevance Score:** 85%');
    expect(markdownContent).toContain('### Affected Files');
    expect(markdownContent).toContain('`src/App.tsx`');
    expect(markdownContent).toContain('#### Version 18.0.0 (2022-03-29)');
    expect(markdownContent).toContain('- New feature');
    expect(markdownContent).toContain('- Bug fix');
  });

  it('should handle empty impacts list', async () => {
    // Mock empty impacts
    const impacts: UpdateImpact[] = [];
    
    // Mock options
    const options: ReportOptions = {
      format: 'console',
      minRelevance: 50
    };

    // Spy on console.log
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    await generateReport(impacts, options);

    // Verify console.log was called with "No relevant dependency updates"
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('No relevant dependency updates found')
    );
    
    // Restore console.log
    consoleLogSpy.mockRestore();
  });
}); 