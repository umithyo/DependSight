import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

export async function findFiles(
  pattern: string,
  cwd: string,
  ignore: string[] = ['**/node_modules/**', '**/dist/**', '**/build/**']
): Promise<string[]> {
  return await glob(pattern, { cwd, ignore });
}

export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function readJsonFile<T>(filePath: string): T {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

export function writeJsonFile(filePath: string, data: any): void {
  ensureDirectoryExists(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
} 