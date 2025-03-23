import chalk from 'chalk';
import { LogLevel, setLogLevel, debug, info, warn, error } from '../logger';

describe('logger utilities', () => {
  let consoleLogSpy: jest.SpyInstance;
  
  beforeEach(() => {
    // Spy on console.log
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Reset log level to default before each test
    setLogLevel(LogLevel.INFO);
  });
  
  afterEach(() => {
    // Restore console.log
    consoleLogSpy.mockRestore();
  });
  
  it('should log debug messages when log level is DEBUG', () => {
    setLogLevel(LogLevel.DEBUG);
    debug('Test debug message');
    
    expect(consoleLogSpy).toHaveBeenCalledWith(
      chalk.gray('[DEBUG] Test debug message')
    );
  });
  
  it('should not log debug messages when log level is higher than DEBUG', () => {
    setLogLevel(LogLevel.INFO);
    debug('Test debug message');
    
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });
  
  it('should log info messages when log level is INFO or lower', () => {
    setLogLevel(LogLevel.INFO);
    info('Test info message');
    
    expect(consoleLogSpy).toHaveBeenCalledWith(
      chalk.blue('[INFO] Test info message')
    );
    
    consoleLogSpy.mockClear();
    
    setLogLevel(LogLevel.DEBUG);
    info('Test info message');
    
    expect(consoleLogSpy).toHaveBeenCalledWith(
      chalk.blue('[INFO] Test info message')
    );
  });
  
  it('should not log info messages when log level is higher than INFO', () => {
    setLogLevel(LogLevel.WARN);
    info('Test info message');
    
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });
  
  it('should log warning messages when log level is WARN or lower', () => {
    setLogLevel(LogLevel.WARN);
    warn('Test warning message');
    
    expect(consoleLogSpy).toHaveBeenCalledWith(
      chalk.yellow('[WARN] Test warning message')
    );
  });
  
  it('should log error messages when log level is ERROR or lower', () => {
    setLogLevel(LogLevel.ERROR);
    error('Test error message');
    
    expect(consoleLogSpy).toHaveBeenCalledWith(
      chalk.red('[ERROR] Test error message')
    );
  });
}); 