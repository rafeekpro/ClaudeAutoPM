#!/usr/bin/env node

/**
 * Node.js implementation of test-and-log.sh
 * Script to run tests with automatic log redirection
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class TestAndLog {
  constructor() {
    // ANSI color codes
    this.colors = {
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      reset: '\x1b[0m'
    };
  }

  // Helper to print colored messages
  print(message, color = null) {
    if (color && this.colors[color]) {
      console.log(`${this.colors[color]}${message}${this.colors.reset}`);
    } else {
      console.log(message);
    }
  }

  // Show usage information
  showUsage() {
    console.log('Usage: test-and-log <test_file_path> [log_filename]');
    console.log('Example: test-and-log tests/e2e/my_test_name.py');
    console.log('Example: test-and-log tests/e2e/my_test_name.py my_test_name_v2.log');
  }

  // Ensure directory exists
  ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  // Determine log file path
  getLogFilePath(testPath, logName = null) {
    const logsDir = 'tests/logs';

    if (logName) {
      // Use provided log filename
      let logFileName = logName;
      // Ensure it ends with .log
      if (!logFileName.endsWith('.log')) {
        logFileName += '.log';
      }
      return path.join(logsDir, logFileName);
    } else {
      // Extract the test filename without extension for the log name
      const testName = path.basename(testPath, '.py');
      return path.join(logsDir, `${testName}.log`);
    }
  }

  // Run Python test and capture output
  async runTest(testPath, logFilePath) {
    return new Promise((resolve) => {
      // Open log file for writing
      const logStream = fs.createWriteStream(logFilePath);

      // Spawn Python process
      const pythonProcess = spawn('python', [testPath], {
        stdio: ['inherit', 'pipe', 'pipe']
      });

      // Capture stdout
      pythonProcess.stdout.on('data', (data) => {
        logStream.write(data);
      });

      // Capture stderr
      pythonProcess.stderr.on('data', (data) => {
        logStream.write(data);
      });

      // Handle process exit
      pythonProcess.on('close', (exitCode) => {
        logStream.end();
        resolve(exitCode);
      });

      // Handle process error
      pythonProcess.on('error', (error) => {
        logStream.write(`Error starting Python process: ${error.message}\n`);
        logStream.end();
        resolve(1);
      });
    });
  }

  // Main execution
  async run(args) {
    // Parse arguments
    if (args.length === 0) {
      this.showUsage();
      process.exit(1);
    }

    const testPath = args[0];
    const logName = args[1] || null;

    // Check if test file exists
    if (!fs.existsSync(testPath)) {
      this.print(`❌ Test file not found: ${testPath}`, 'red');
      process.exit(1);
    }

    // Create logs directory if it doesn't exist
    this.ensureDirectoryExists('tests/logs');

    // Determine log file path
    const logFilePath = this.getLogFilePath(testPath, logName);

    // Run the test
    console.log(`Running test: ${testPath}`);
    console.log(`Logging to: ${logFilePath}`);

    const exitCode = await this.runTest(testPath, logFilePath);

    // Report results
    if (exitCode === 0) {
      this.print(`✅ Test completed successfully. Log saved to ${logFilePath}`, 'green');
    } else {
      this.print(`❌ Test failed with exit code ${exitCode}. Check ${logFilePath} for details`, 'red');
    }

    process.exit(exitCode);
  }
}

// CLI entry point
if (require.main === module) {
  const tester = new TestAndLog();
  tester.run(process.argv.slice(2)).catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

module.exports = TestAndLog;