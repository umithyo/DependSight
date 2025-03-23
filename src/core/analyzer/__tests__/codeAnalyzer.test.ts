import { analyzeCodeUsage } from '../codeAnalyzer';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import { Dependency } from '../../../types';

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('glob');
jest.mock('@babel/parser');
jest.mock('@babel/traverse');

describe('analyzeCodeUsage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock path.join
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    
    // Mock glob to return some files
    (glob as unknown as jest.Mock).mockResolvedValue(['src/index.ts', 'src/app.ts']);
    
    // Mock fs.readFileSync
    (fs.readFileSync as jest.Mock).mockReturnValue('// Mock file content');
    
    // Mock parser.parse
    (parser.parse as jest.Mock).mockReturnValue({ type: 'Program', body: [] });
    
    // Mock traverse
    (traverse as unknown as jest.Mock).mockImplementation((ast, visitors) => {
      // Simply call the visitor functions with mock data to test the logic
      if (visitors.ImportDeclaration) {
        const mockImportPath = {
          node: {
            source: { value: 'react' },
            specifiers: [
              { type: 'ImportDefaultSpecifier', local: { name: 'React' } }
            ]
          }
        };
        visitors.ImportDeclaration(mockImportPath);
      }
      
      if (visitors.CallExpression) {
        const mockRequirePath = {
          node: {
            callee: { type: 'Identifier', name: 'require' },
            arguments: [{ type: 'StringLiteral', value: 'lodash' }]
          }
        };
        visitors.CallExpression(mockRequirePath);
      }
    });
  });

  it('should analyze code usage correctly', async () => {
    // Mock dependencies
    const dependencies: Dependency[] = [
      { name: 'react', version: '17.0.2', isDevDependency: false },
      { name: 'lodash', version: '4.17.21', isDevDependency: false }
    ];

    const result = await analyzeCodeUsage('/mock/project', dependencies);

    // Since we mocked traverse to call visitor functions twice (once for each file)
    // and each file has both an import and a require, we should have 4 usages
    expect(result).toHaveLength(4);
    
    // Check if the usages have the right structure
    expect(result[0]).toEqual(
      expect.objectContaining({
        dependency: dependencies[0], // react
        file: 'src/index.ts',
        importType: 'default'
      })
    );
    
    // Verify glob was called with the right pattern
    expect(glob).toHaveBeenCalledWith(
      '**/*.{js,jsx,ts,tsx}',
      expect.objectContaining({ 
        cwd: '/mock/project',
        ignore: expect.arrayContaining(['**/node_modules/**'])
      })
    );
  });

  it('should handle parsing errors gracefully', async () => {
    // Make parser.parse throw an error for one file
    (parser.parse as jest.Mock)
      .mockImplementationOnce(() => { throw new Error('Parsing error'); })
      .mockReturnValueOnce({ type: 'Program', body: [] });

    const dependencies: Dependency[] = [
      { name: 'react', version: '17.0.2', isDevDependency: false }
    ];

    // This should not throw even though parsing fails for one file
    const result = await analyzeCodeUsage('/mock/project', dependencies);
    
    // We should still get usages from the second file
    expect(result.length).toBeGreaterThan(0);
    
    // console.warn should have been called with the error
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Could not parse src/index.ts')
    );
  });
}); 