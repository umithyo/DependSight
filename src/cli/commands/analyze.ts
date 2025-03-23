import ora from 'ora';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { scanDependencies } from '../../core/scanner/dependencyScanner';
import { analyzeCodeUsage } from '../../core/analyzer/codeAnalyzer';
import { AnalysisResult } from '../../types';

interface AnalyzeOptions {
  path: string;
  output: string;
}

export async function analyze(options: AnalyzeOptions): Promise<void> {
  const projectRoot = path.resolve(options.path);
  const outputPath = path.resolve(options.output);
  
  // Validate project path
  if (!fs.existsSync(path.join(projectRoot, 'package.json'))) {
    console.error(chalk.red('Error: No package.json found in the specified directory'));
    process.exit(1);
  }

  console.log(chalk.bold('\n🔍 DependSight Analysis'));
  console.log(chalk.gray(`Project path: ${projectRoot}`));

  // Scan dependencies
  const spinnerDeps = ora('Scanning dependencies...').start();
  try {
    const dependencies = await scanDependencies(projectRoot);
    spinnerDeps.succeed(`Found ${dependencies.length} dependencies`);
  } catch (error) {
    spinnerDeps.fail(`Failed to scan dependencies: ${(error as Error).message}`);
    process.exit(1);
  }

  // Analyze code usage
  const spinnerAnalysis = ora('Analyzing code usage...').start();
  let analysisResult: AnalysisResult;
  
  try {
    const dependencies = await scanDependencies(projectRoot);
    const usages = await analyzeCodeUsage(projectRoot, dependencies);
    
    analysisResult = {
      dependencies,
      usages,
      projectRoot
    };
    
    spinnerAnalysis.succeed(`Analyzed usage of ${usages.length} imports`);
  } catch (error) {
    spinnerAnalysis.fail(`Failed to analyze code: ${(error as Error).message}`);
    process.exit(1);
  }

  // Save analysis result
  const spinnerSave = ora(`Saving analysis to ${outputPath}...`).start();
  try {
    fs.writeFileSync(outputPath, JSON.stringify(analysisResult, null, 2));
    spinnerSave.succeed('Analysis completed and saved successfully');
  } catch (error) {
    spinnerSave.fail(`Failed to save analysis: ${(error as Error).message}`);
    process.exit(1);
  }

  console.log(chalk.green('\n✅ Analysis complete!'));
  console.log(`Run ${chalk.cyan('dependsight report')} to generate update recommendations`);
} 