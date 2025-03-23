import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import { Dependency, DependencyUsage } from '../../types';

export async function analyzeCodeUsage(
  projectRoot: string,
  dependencies: Dependency[]
): Promise<DependencyUsage[]> {
  const usages: DependencyUsage[] = [];
  const dependencyMap = new Map(dependencies.map(dep => [dep.name, dep]));
  
  // Find all JavaScript and TypeScript files
  const files = await glob('**/*.{js,jsx,ts,tsx}', {
    cwd: projectRoot,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
  });
  
  for (const file of files) {
    const filePath = path.join(projectRoot, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    try {
      // Parse the file
      const ast = parser.parse(fileContent, {
        sourceType: 'module',
        plugins: [
          'jsx',
          'typescript',
          'decorators-legacy',
          'classProperties'
        ]
      });
      
      // Traverse the AST to find imports
      traverse(ast, {
        ImportDeclaration(nodePath) {
          const source = nodePath.node.source.value;
          
          // Handle direct package imports and subpath imports
          let packageName = source;
          if (source.startsWith('@')) {
            // Scoped package
            packageName = source.split('/').slice(0, 2).join('/');
          } else {
            packageName = source.split('/')[0];
          }
          
          const dependency = dependencyMap.get(packageName);
          if (!dependency) return; // Not in our dependencies list
          
          const importType = determineImportType(nodePath.node);
          const importedMembers = extractImportedMembers(nodePath.node);
          
          usages.push({
            dependency,
            file,
            importType,
            importedMembers
          });
        },
        CallExpression(nodePath) {
          // Handle require() calls
          if (
            nodePath.node.callee.type === 'Identifier' &&
            nodePath.node.callee.name === 'require' &&
            nodePath.node.arguments.length > 0 &&
            nodePath.node.arguments[0].type === 'StringLiteral'
          ) {
            const source = nodePath.node.arguments[0].value;
            
            // Similar logic for package name extraction
            let packageName = source;
            if (source.startsWith('@')) {
              packageName = source.split('/').slice(0, 2).join('/');
            } else {
              packageName = source.split('/')[0];
            }
            
            const dependency = dependencyMap.get(packageName);
            if (!dependency) return;
            
            usages.push({
              dependency,
              file,
              importType: 'side-effect',
            });
          }
        }
      });
    } catch (error) {
      console.warn(`Could not parse ${file}: ${(error as Error).message}`);
    }
  }
  
  return usages;
}

function determineImportType(importNode: any): 'named' | 'default' | 'namespace' | 'side-effect' {
  if (importNode.specifiers.length === 0) {
    return 'side-effect';
  }
  
  if (importNode.specifiers.some((s: any) => s.type === 'ImportDefaultSpecifier')) {
    return 'default';
  }
  
  if (importNode.specifiers.some((s: any) => s.type === 'ImportNamespaceSpecifier')) {
    return 'namespace';
  }
  
  return 'named';
}

function extractImportedMembers(importNode: any): string[] | undefined {
  if (importNode.specifiers.length === 0) {
    return undefined;
  }
  
  return importNode.specifiers
    .filter((s: any) => s.type === 'ImportSpecifier')
    .map((s: any) => s.imported.name);
} 