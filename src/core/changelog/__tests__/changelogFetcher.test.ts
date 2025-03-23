import { fetchChangelogs } from '../changelogFetcher';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import semver from 'semver';
import { AnalysisResult, Dependency, DependencyUsage } from '../../../types';

// Mock dependencies
jest.mock('axios');
jest.mock('fs');
jest.mock('path');
jest.mock('semver');

describe('fetchChangelogs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock path.join
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    
    // Mock semver functions
    (semver.gt as jest.Mock).mockReturnValue(true);
    (semver.lte as jest.Mock).mockReturnValue(false);
    (semver.valid as jest.Mock).mockReturnValue(true);
    (semver.major as jest.Mock).mockReturnValue(2);
    (semver.minor as jest.Mock).mockReturnValue(0);
    
    // Mock fs.existsSync
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    
    // Mock process.cwd
    process.cwd = jest.fn().mockReturnValue('/mock/cwd');
  });

  it('should fetch changelogs correctly', async () => {
    // Mock dependencies and usages
    const dependencies: Dependency[] = [
      { name: 'react', version: '17.0.2', isDevDependency: false }
    ];
    
    const usages: DependencyUsage[] = [
      {
        dependency: dependencies[0],
        file: 'src/App.tsx',
        importType: 'default'
      }
    ];
    
    const analysisResult: AnalysisResult = {
      dependencies,
      usages,
      projectRoot: '/mock/project'
    };
    
    // Mock axios to return NPM registry data and GitHub releases
    (axios.get as jest.Mock).mockImplementation((url) => {
      if (url.includes('registry.npmjs.org')) {
        return {
          data: {
            'dist-tags': { latest: '18.0.0' },
            repository: { url: 'https://github.com/facebook/react' }
          }
        };
      } else if (url.includes('api.github.com')) {
        return {
          data: [
            {
              tag_name: 'v18.0.0',
              published_at: '2022-03-29T00:00:00Z',
              body: '- New feature\n- Bug fix'
            }
          ]
        };
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    const result = await fetchChangelogs(analysisResult);

    // We should get one update impact result
    expect(result).toHaveLength(1);
    
    // Check the structure of the update impact
    expect(result[0]).toEqual(
      expect.objectContaining({
        dependency: dependencies[0],
        latestVersion: '18.0.0',
        affectedFiles: ['src/App.tsx'],
        relevanceScore: expect.any(Number),
        changelogEntries: expect.arrayContaining([
          expect.objectContaining({
            version: '18.0.0',
            changes: expect.arrayContaining(['New feature', 'Bug fix'])
          })
        ])
      })
    );
    
    // Verify axios was called with the right URLs
    expect(axios.get).toHaveBeenCalledWith('https://registry.npmjs.org/react');
    expect(axios.get).toHaveBeenCalledWith('https://api.github.com/repos/facebook/react/releases');
  });

  it('should handle errors gracefully', async () => {
    // Mock dependencies without usages
    const dependencies: Dependency[] = [
      { name: 'problematic-package', version: '1.0.0', isDevDependency: false }
    ];
    
    const analysisResult: AnalysisResult = {
      dependencies,
      usages: [],
      projectRoot: '/mock/project'
    };
    
    // Make axios.get throw an error
    (axios.get as jest.Mock).mockRejectedValue(new Error('Network error'));

    // This should not throw even with API errors
    const result = await fetchChangelogs(analysisResult);
    
    // No impacts should be returned since we couldn't fetch data
    expect(result).toHaveLength(0);
  });

  // Additional test cases for local changelog parsing, etc.
}); 