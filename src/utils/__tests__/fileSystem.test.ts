import * as fs from 'fs';
import * as path from 'path';
import { findFiles, ensureDirectoryExists, readJsonFile, writeJsonFile } from '../fileSystem';
import { glob } from 'glob';

// Mock fs and glob
jest.mock('fs');
jest.mock('path');
jest.mock('glob');

describe('fileSystem utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock path.join and path.dirname
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    (path.dirname as jest.Mock).mockImplementation((p) => p.split('/').slice(0, -1).join('/'));
  });
  
  describe('findFiles', () => {
    it('should call glob with the correct parameters', async () => {
      // Set up mock return value
      (glob as unknown as jest.Mock).mockResolvedValue(['file1.js', 'file2.js']);
      
      const result = await findFiles('**/*.js', '/project', ['**/node_modules/**']);
      
      // Check glob was called correctly
      expect(glob).toHaveBeenCalledWith('**/*.js', {
        cwd: '/project',
        ignore: ['**/node_modules/**']
      });
      
      // Check result
      expect(result).toEqual(['file1.js', 'file2.js']);
    });
  });
  
  describe('ensureDirectoryExists', () => {
    it('should create directory if it does not exist', () => {
      // Mock fs.existsSync to return false
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      
      ensureDirectoryExists('/path/to/dir');
      
      // Verify fs.mkdirSync was called with the right arguments
      expect(fs.mkdirSync).toHaveBeenCalledWith('/path/to/dir', { recursive: true });
    });
    
    it('should not create directory if it already exists', () => {
      // Mock fs.existsSync to return true
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      
      ensureDirectoryExists('/path/to/dir');
      
      // Verify fs.mkdirSync was not called
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });
  
  describe('readJsonFile', () => {
    it('should read and parse JSON file correctly', () => {
      // Mock file existence and content
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('{"name":"test","version":"1.0.0"}');
      
      const result = readJsonFile<{ name: string; version: string }>('/path/to/file.json');
      
      // Verify file was read and content parsed correctly
      expect(fs.readFileSync).toHaveBeenCalledWith('/path/to/file.json', 'utf8');
      expect(result).toEqual({ name: 'test', version: '1.0.0' });
    });
    
    it('should throw error if file does not exist', () => {
      // Mock file not existing
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      
      expect(() => {
        readJsonFile('/path/to/nonexistent.json');
      }).toThrow('File not found');
    });
  });
  
  describe('writeJsonFile', () => {
    it('should ensure directory exists and write JSON file', () => {
      const data = { name: 'test', version: '1.0.0' };
      
      writeJsonFile('/path/to/file.json', data);
      
      // Verify directory was ensured
      expect(path.dirname).toHaveBeenCalledWith('/path/to/file.json');
      
      // Verify file was written with correct content
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/path/to/file.json',
        JSON.stringify(data, null, 2)
      );
    });
  });
}); 