import { scanDependencies } from '../dependencyScanner';
import fs from 'fs';
import path from 'path';

// Mock the fs module
jest.mock('fs');
jest.mock('path');

describe('scanDependencies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock implementation for path.join
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    
    // Mock fs.existsSync to return true
    (fs.existsSync as jest.Mock).mockReturnValue(true);
  });

  it('should scan dependencies correctly', async () => {
    // Mock package.json content
    const mockPackageJson = {
      dependencies: {
        'react': '^17.0.2',
        'lodash': '~4.17.21'
      },
      devDependencies: {
        'typescript': '^4.5.4',
        'jest': '^27.4.7'
      }
    };

    // Mock fs.readFileSync to return our mock package.json
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockPackageJson));

    const result = await scanDependencies('/mock/path');

    // Verify expected dependencies are returned
    expect(result).toHaveLength(4);
    
    // Check regular dependencies
    expect(result).toContainEqual({
      name: 'react',
      version: '17.0.2',
      isDevDependency: false
    });
    expect(result).toContainEqual({
      name: 'lodash',
      version: '4.17.21',
      isDevDependency: false
    });
    
    // Check dev dependencies
    expect(result).toContainEqual({
      name: 'typescript',
      version: '4.5.4',
      isDevDependency: true
    });
    expect(result).toContainEqual({
      name: 'jest',
      version: '27.4.7',
      isDevDependency: true
    });

    // Verify path.join was called with the right arguments
    expect(path.join).toHaveBeenCalledWith('/mock/path', 'package.json');
    
    // Verify fs.readFileSync was called with the right arguments
    expect(fs.readFileSync).toHaveBeenCalledWith('/mock/path/package.json', 'utf8');
  });

  it('should throw error if package.json not found', async () => {
    // Mock fs.existsSync to return false
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    await expect(scanDependencies('/invalid/path')).rejects.toThrow('package.json not found');
  });
}); 