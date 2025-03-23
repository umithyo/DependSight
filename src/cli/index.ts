import { Command } from 'commander';
import { analyze } from './commands/analyze';
import { report } from './commands/report';
import { version } from '../../package.json';

const program = new Command();

program
  .name('dependsight')
  .description('Intelligent dependency management tool for developers')
  .version(version);

program
  .command('analyze')
  .description('Scan project and build usage database')
  .option('-p, --path <path>', 'Path to project root', process.cwd())
  .option('-o, --output <file>', 'Output file for analysis results', 'dependsight-analysis.json')
  .action(analyze);

program
  .command('report')
  .description('Generate update recommendations')
  .option('-p, --path <path>', 'Path to project root', process.cwd())
  .option('-i, --input <file>', 'Input file from analysis results', 'dependsight-analysis.json')
  .option('-f, --format <format>', 'Report format (console, markdown, json)', 'console')
  .option('-o, --output <file>', 'Output file for report', 'dependsight-report.md')
  .option('-m, --min-relevance <score>', 'Minimum relevance score (0-100)', '50')
  .action(report);

program.parse(); 