import { report } from '../report';
import { fetchChangelogs } from '../../../core/changelog/changelogFetcher';
import { generateReport } from '../../../core/reporter/reportGenerator';
import ora from 'ora';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

// Mock dependencies
jest.mock('../../../core/changelog/changelogFetcher');
jest.mock('../../../core/reporter/reportGenerator');
jest.mock('ora');
jest.mock('chalk', () => ({
  bold: jest.fn((str) => str),
  red: jest.fn((str) => str),
  gray: jest.fn((str) => str),
  green: jest.fn((str) => str),
  yellow: jest.fn((str) => str),
  cyan: jest.fn((str) => str)
}));
jest.mock('fs');
jest.mock('path');

describe('report command', () => {
  // Mock implementation
  const mockOraInstance = {
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis()
  };
  
  // Mock console.log and console.error
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let mockExitSpy: jest.SpyInstance;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock ora to return our mock instance
    (ora as unknown as jest.Mock).mockReturnValue(mockOraInstance);
    
    // Mock path.resolve to return the input
    (path.resolve as jest.Mock).mockImplementation((p) => p);
    
    // Mock fs.existsSync for analysis file
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    // Mock fs.readFileSync for analysis file
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({
      dependencies: [{ name: 'react', version: '17.0.2', isDevDependency: false }],
      usages: [{ dependency: { name: 'react' }, file: 'src/App.js' }],
      projectRoot: '/test/project'
    }));
    
    // Mock fetchChangelogs
    (fetchChangelogs as jest.Mock).mockResolvedValue([
      {
        dependency: { name: 'react', version: '17.0.2', isDevDependency: false },
        latestVersion: '18.0.0',
        affectedFiles: ['src/App.js'],
        changelogEntries: [{ version: '18.0.0', changes: ['New feature'] }],
        relevanceScore: 85
      }
    ]);
    
    // Mock generateReport
    (generateReport as jest.Mock).mockResolvedValue(undefined);
    
    // Mock console.log and console.error
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Mock process.exit
    mockExitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`Process exited with code ${code}`);
    });
  });
  
  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    mockExitSpy.mockRestore();
  });
  
  it('should generate a report correctly', async () => {
    const options = {
      path: '/test/project',
      input: 'analysis.json',
      format: 'markdown' as const,
      output: 'report.md',
      minRelevance: '50'
    };
    
    await report(options);
    
    // Verify changelogs were fetched
    expect(fetchChangelogs).toHaveBeenCalledWith(expect.objectContaining({
      dependencies: expect.any(Array),
      usages: expect.any(Array)
    }));
    
    // Verify report was generated
    expect(generateReport).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({
        format: 'markdown',
        minRelevance: 50,
        outputFile: 'report.md'
      })
    );
    
    // Verify progress spinners were used
    expect(ora).toHaveBeenCalledWith('Fetching changelogs...');
    expect(ora).toHaveBeenCalledWith('Generating report...');
    expect(mockOraInstance.succeed).toHaveBeenCalled();
  });
  
  it('should exit if analysis file is not found', async () => {
    // Mock fs.existsSync to return false for analysis file
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    
    const options = {
      path: '/test/project',
      input: 'missing-analysis.json',
      format: 'markdown' as const,
      output: 'report.md',
      minRelevance: '50'
    };
    
    // Expect process.exit to be called
    await expect(report(options)).rejects.toThrow('Process exited with code 1');
    
    // Verify error message was shown
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Analysis file not found')
    );
  });
  
  it('should handle changelog fetching errors', async () => {
    // Make fetchChangelogs throw an error
    (fetchChangelogs as jest.Mock).mockRejectedValue(new Error('Fetching error'));
    
    const options = {
      path: '/test/project',
      input: 'analysis.json',
      format: 'markdown' as const,
      output: 'report.md',
      minRelevance: '50'
    };
    
    // Expect process.exit to be called
    await expect(report(options)).rejects.toThrow('Process exited with code 1');
    
    // Verify spinner shows failure
    expect(mockOraInstance.fail).toHaveBeenCalledWith(
      expect.stringContaining('Failed to fetch changelogs')
    );
  });
}); 