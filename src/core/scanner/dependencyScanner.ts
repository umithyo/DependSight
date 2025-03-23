import fs from 'fs';
import path from 'path';
import { Dependency } from '../../types';

export async function scanDependencies(projectRoot: string): Promise<Dependency[]> {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`package.json not found at ${packageJsonPath}`);
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies: Dependency[] = [];
  
  // Process regular dependencies
  if (packageJson.dependencies) {
    Object.entries(packageJson.dependencies).forEach(([name, version]) => {
      dependencies.push({
        name,
        version: (version as string).replace(/^\^|~/, ''),
        isDevDependency: false
      });
    });
  }
  
  // Process dev dependencies
  if (packageJson.devDependencies) {
    Object.entries(packageJson.devDependencies).forEach(([name, version]) => {
      dependencies.push({
        name,
        version: (version as string).replace(/^\^|~/, ''),
        isDevDependency: true
      });
    });
  }
  
  return dependencies;
} 