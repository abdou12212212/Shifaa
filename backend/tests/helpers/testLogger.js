/**
 * Test Logger
 * Provides colored and formatted logging for test results
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Background colors
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m'
};

class TestLogger {
  constructor() {
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    this.startTime = null;
  }

  start(message) {
    this.startTime = Date.now();
    console.log('\n' + colors.bright + colors.cyan + '═'.repeat(80));
    console.log(colors.bright + colors.cyan + '  ' + message);
    console.log(colors.cyan + '═'.repeat(80) + colors.reset + '\n');
  }

  section(message) {
    console.log('\n' + colors.bright + colors.blue + '▶ ' + message + colors.reset);
    console.log(colors.dim + '─'.repeat(80) + colors.reset);
  }

  testStart(testName) {
    console.log(colors.yellow + '\n⏳ Testing: ' + colors.reset + testName);
  }

  success(message, data = null) {
    this.totalTests++;
    this.passedTests++;
    console.log(colors.green + '  ✓ ' + message + colors.reset);
    if (data) {
      console.log(colors.dim + '    ' + JSON.stringify(data, null, 2).split('\n').join('\n    ') + colors.reset);
    }
  }

  error(message, error = null) {
    this.totalTests++;
    this.failedTests++;
    console.log(colors.red + '  ✗ ' + message + colors.reset);
    if (error) {
      if (error.response) {
        console.log(colors.red + '    Response Status: ' + error.response.status + colors.reset);
        console.log(colors.red + '    Response Data: ' + JSON.stringify(error.response.data, null, 2) + colors.reset);
      } else if (error.message) {
        console.log(colors.red + '    Error: ' + error.message + colors.reset);
      } else {
        console.log(colors.red + '    ' + JSON.stringify(error, null, 2) + colors.reset);
      }
      if (error.stack) {
        console.log(colors.dim + '    Stack: ' + error.stack.split('\n').slice(0, 3).join('\n    ') + colors.reset);
      }
    }
  }

  warning(message) {
    console.log(colors.yellow + '  ⚠ ' + message + colors.reset);
  }

  info(message, data = null) {
    console.log(colors.cyan + '  ℹ ' + message + colors.reset);
    if (data) {
      console.log(colors.dim + '    ' + JSON.stringify(data, null, 2).split('\n').join('\n    ') + colors.reset);
    }
  }

  request(method, endpoint, data = null) {
    console.log(colors.magenta + '  → ' + method + ' ' + colors.reset + colors.dim + endpoint + colors.reset);
    if (data) {
      console.log(colors.dim + '    Body: ' + JSON.stringify(data, null, 2).split('\n').join('\n    ') + colors.reset);
    }
  }

  response(status, data = null) {
    const statusColor = status >= 200 && status < 300 ? colors.green : colors.red;
    console.log(statusColor + '  ← Status: ' + status + colors.reset);
    if (data && Object.keys(data).length > 0) {
      const preview = JSON.stringify(data, null, 2).split('\n').slice(0, 10).join('\n    ');
      console.log(colors.dim + '    ' + preview + colors.reset);
    }
  }

  summary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);

    console.log('\n' + colors.bright + colors.cyan + '═'.repeat(80));
    console.log(colors.bright + colors.cyan + '  TEST SUMMARY');
    console.log(colors.cyan + '═'.repeat(80) + colors.reset);

    console.log(colors.white + '\n  Total Tests: ' + colors.bright + this.totalTests + colors.reset);
    console.log(colors.green + '  ✓ Passed: ' + colors.bright + this.passedTests + colors.reset);
    console.log(colors.red + '  ✗ Failed: ' + colors.bright + this.failedTests + colors.reset);
    console.log(colors.cyan + '  ⏱ Duration: ' + colors.bright + duration + 's' + colors.reset);

    const successRate = this.totalTests > 0 ? ((this.passedTests / this.totalTests) * 100).toFixed(1) : 0;
    const rateColor = successRate >= 80 ? colors.green : successRate >= 50 ? colors.yellow : colors.red;
    console.log(rateColor + '  Success Rate: ' + colors.bright + successRate + '%' + colors.reset);

    console.log('\n' + colors.cyan + '═'.repeat(80) + colors.reset + '\n');

    if (this.failedTests === 0) {
      console.log(colors.bgGreen + colors.bright + ' ALL TESTS PASSED! ' + colors.reset + '\n');
    } else {
      console.log(colors.bgRed + colors.bright + ' SOME TESTS FAILED ' + colors.reset + '\n');
    }
  }
}

module.exports = new TestLogger();
