export interface Dependency {
  name: string;
  version: string;
  isDevDependency: boolean;
}

export interface DependencyUsage {
  dependency: Dependency;
  file: string;
  importType: 'named' | 'default' | 'namespace' | 'side-effect';
  importedMembers?: string[];
}

export interface ChangelogEntry {
  version: string;
  date?: string;
  changes: string[];
  type?: 'major' | 'minor' | 'patch';
}

export interface UpdateImpact {
  dependency: Dependency;
  latestVersion: string;
  affectedFiles: string[];
  changelogEntries: ChangelogEntry[];
  relevanceScore: number;
}

export interface AnalysisResult {
  dependencies: Dependency[];
  usages: DependencyUsage[];
  projectRoot: string;
}

export interface ReportOptions {
  format: 'console' | 'markdown' | 'json';
  minRelevance?: number;
  outputFile?: string;
} 