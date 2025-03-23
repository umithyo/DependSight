import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

// This is an integration test that requires the CLI to be built
// Run this after running npm run build
describe('DependSight CLI Integration', () => {
  const testDir = path.join(__dirname, '../../../test-project');
  const analysisFile = path.join(testDir, 'dependsight-analysis.json');
  const reportFile = path.join(testDir, 'dependsight-report.md');
  
  // Create a mini test project
  beforeAll(() => {
    // Skip if the test directory already exists
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
      
      // Create a simple package.json
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'react': '^17.0.2',
          'lodash': '^4.17.21'
        },
        devDependencies: {
          'typescript': '^4.5.4'
        }
      };
      
      fs.writeFileSync(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
      
      // Create a simple src directory with some files
      const srcDir = path.join(testDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });
      
      // App.js with React import
      fs.writeFileSync(
        path.join(srcDir, 'App.js'),
        `import React from 'react';
        
        function App() {
          return <div>Hello World</div>;
        }
        
        export default App;`
      );
      
      // utils.js with lodash import
      fs.writeFileSync(
        path.join(srcDir, 'utils.js'),
        `import _ from 'lodash';
        
        export function capitalizeAll(str) {
          return _.capitalize(str);
        }`
      );
    }
  });
  
  // Clean up test files after tests
  afterAll(() => {
    // Remove analysis and report files but keep the test project
    if (fs.existsSync(analysisFile)) {
      fs.unlinkSync(analysisFile);
    }
    if (fs.existsSync(reportFile)) {
      fs.unlinkSync(reportFile);
    }
  });

  // Skip these tests in CI environments as they require network access
  // and might be flaky
  const itSkipCI = process.env.CI ? it.skip : it;

  itSkipCI('should run analyze command successfully', async () => {
    const { stdout, stderr } = await execAsync(
      `node ${path.join(__dirname, '../../../bin/dependsight.js')} analyze -p ${testDir}`
    );
    
    expect(stderr).toBe('');
    expect(stdout).toContain('DependSight Analysis');
    expect(stdout).toContain('Analysis complete');
    
    // Verify the analysis file was created
    expect(fs.existsSync(analysisFile)).toBe(true);
    
    // Verify the analysis file has the expected structure
    const analysisData = JSON.parse(fs.readFileSync(analysisFile, 'utf8'));
    expect(analysisData).toHaveProperty('dependencies');
    expect(analysisData).toHaveProperty('usages');
    expect(analysisData.dependencies.length).toBeGreaterThan(0);
  }, 30000); // Increase timeout for network requests

  itSkipCI('should run report command successfully', async () => {
    // This test depends on the analyze command having run successfully
    if (!fs.existsSync(analysisFile)) {
      throw new Error('Analysis file does not exist. Run analyze test first.');
    }
    
    const { stdout, stderr } = await execAsync(
      `node ${path.join(__dirname, '../../../bin/dependsight.js')} report -p ${testDir} -f markdown -o ${reportFile}`
    );
    
    expect(stderr).toBe('');
    expect(stdout).toContain('DependSight Report');
    expect(stdout).toContain('Report complete');
    
    // Verify the report file was created
    expect(fs.existsSync(reportFile)).toBe(true);
    
    // Verify the report file has the expected content
    const reportContent = fs.readFileSync(reportFile, 'utf8');
    expect(reportContent).toContain('# DependSight Update Report');
  }, 30000); // Increase timeout for network requests
}); 