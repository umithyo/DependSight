import { analyze } from '../analyze';
import { scanDependencies } from '../../../core/scanner/dependencyScanner';
import { analyzeCodeUsage } from '../../../core/analyzer/codeAnalyzer';
import ora from 'ora';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

// Mock dependencies
jest.mock('../../../core/scanner/dependencyScanner');
jest.mock('../../../core/analyzer/codeAnalyzer');
jest.mock('ora');
jest.mock('chalk', () => ({
  bold: jest.fn((str) => str),
  red: jest.fn((str) => str),
  gray: jest.fn((str) => str),
  green: jest.fn((str) => str),
  cyan: jest.fn((str) => str)
}));
jest.mock('fs');
jest.mock('path');

describe('analyze command', () => {
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
    
    // Mock path.join
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    
    // Mock fs.existsSync for package.json
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    // Mock scanDependencies
    (scanDependencies as jest.Mock).mockResolvedValue([
      { name: 'react', version: '17.0.2', isDevDependency: false }
    ]);
    
    // Mock analyzeCodeUsage
    (analyzeCodeUsage as jest.Mock).mockResolvedValue([
      {
        dependency: { name: 'react', version: '17.0.2', isDevDependency: false },
        file: 'src/App.js',
        importType: 'default'
      }
    ]);
    
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
  
  it('should analyze dependencies and code usage', async () => {
    const options = {
      path: '/test/project',
      output: 'analysis.json'
    };
    
    await analyze(options);
    
    // Verify dependencies were scanned
    expect(scanDependencies).toHaveBeenCalledWith('/test/project');
    
    // Verify code was analyzed
    expect(analyzeCodeUsage).toHaveBeenCalledWith('/test/project', expect.any(Array));
    
    // Verify analysis result was written to file
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      'analysis.json',
      expect.stringContaining('"dependencies"')
    );
    
    // Verify progress spinners were used
    expect(ora).toHaveBeenCalledWith('Scanning dependencies...');
    expect(ora).toHaveBeenCalledWith('Analyzing code usage...');
    expect(mockOraInstance.succeed).toHaveBeenCalled();
  });
  
  it('should exit if package.json is not found', async () => {
    // Mock fs.existsSync to return false for package.json
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    
    const options = {
      path: '/invalid/project',
      output: 'analysis.json'
    };
    
    // Expect process.exit to be called
    await expect(analyze(options)).rejects.toThrow('Process exited with code 1');
    
    // Verify error message was shown
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('No package.json found')
    );
  });
  
  it('should handle dependency scanning errors', async () => {
    // Make scanDependencies throw an error
    (scanDependencies as jest.Mock).mockRejectedValue(new Error('Scanning error'));
    
    const options = {
      path: '/test/project',
      output: 'analysis.json'
    };
    
    // Expect process.exit to be called
    await expect(analyze(options)).rejects.toThrow('Process exited with code 1');
    
    // Verify spinner shows failure
    expect(mockOraInstance.fail).toHaveBeenCalledWith(
      expect.stringContaining('Failed to scan dependencies')
    );
  });
}); 