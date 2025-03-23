import chalk from 'chalk';

export enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR
}

let currentLogLevel = LogLevel.INFO;

export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level;
}

export function debug(message: string): void {
  if (currentLogLevel <= LogLevel.DEBUG) {
    console.log(chalk.gray(`[DEBUG] ${message}`));
  }
}

export function info(message: string): void {
  if (currentLogLevel <= LogLevel.INFO) {
    console.log(chalk.blue(`[INFO] ${message}`));
  }
}

export function warn(message: string): void {
  if (currentLogLevel <= LogLevel.WARN) {
    console.log(chalk.yellow(`[WARN] ${message}`));
  }
}

export function error(message: string): void {
  if (currentLogLevel <= LogLevel.ERROR) {
    console.log(chalk.red(`[ERROR] ${message}`));
  }
} 