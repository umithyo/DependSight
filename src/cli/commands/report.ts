import ora from 'ora';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { fetchChangelogs } from '../../core/changelog/changelogFetcher';
import { generateReport } from '../../core/reporter/reportGenerator';
import { AnalysisResult, ReportOptions, UpdateImpact } from '../../types';

interface ReportCommandOptions {
  path: string;
  input: string;
  format: 'console' | 'markdown' | 'json';
  output: string;
  minRelevance: string;
}

export async function report(options: ReportCommandOptions): Promise<void> {
  const projectRoot = path.resolve(options.path);
  const inputPath = path.resolve(options.input);
  const outputPath = path.resolve(options.output);
  const minRelevance = parseInt(options.minRelevance, 10);
  
  // Validate input file
  if (!fs.existsSync(inputPath)) {
    console.error(chalk.red(`Error: Analysis file not found at ${inputPath}`));
    console.error(chalk.yellow(`Run ${chalk.cyan('dependsight analyze')} first to generate the analysis`));
    process.exit(1);
  }

  console.log(chalk.bold('\n📊 DependSight Report'));
  console.log(chalk.gray(`Using analysis from: ${inputPath}`));

  // Load analysis results
  let analysisResult: AnalysisResult;
  try {
    const analysisData = fs.readFileSync(inputPath, 'utf8');
    analysisResult = JSON.parse(analysisData) as AnalysisResult;
  } catch (error) {
    console.error(chalk.red(`Error loading analysis data: ${(error as Error).message}`));
    process.exit(1);
  }

  // Fetch changelogs
  const spinnerChangelogs = ora('Fetching changelogs...').start();
  let impacts: UpdateImpact[] = [];
  
  try {
    impacts = await fetchChangelogs(analysisResult);
    spinnerChangelogs.succeed(`Fetched changelogs for ${impacts.length} dependencies`);
  } catch (error) {
    spinnerChangelogs.fail(`Failed to fetch changelogs: ${(error as Error).message}`);
    process.exit(1);
  }

  // Generate report
  const spinnerReport = ora('Generating report...').start();
  
  try {
    const reportOptions: ReportOptions = {
      format: options.format,
      minRelevance,
      outputFile: outputPath
    };
    
    await generateReport(impacts, reportOptions);
    spinnerReport.succeed('Report generated successfully');
  } catch (error) {
    spinnerReport.fail(`Failed to generate report: ${(error as Error).message}`);
    process.exit(1);
  }

  console.log(chalk.green('\n✅ Report complete!'));
  if (options.format !== 'console') {
    console.log(`Report saved to: ${chalk.cyan(outputPath)}`);
  }
} 