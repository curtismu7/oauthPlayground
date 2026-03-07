#!/usr/bin/env node

/**
 * AI-Powered Code Analysis Tool
 * Advanced code analysis with intelligent recommendations
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

// Configuration
const config = {
  maxFileSize: 50000, // 50KB
  maxLines: 500,
  maxComplexity: 10,
  minTestCoverage: 80,
  securityPatterns: [
    /eval\(/,
    /dangerouslySetInnerHTML/,
    /innerHTML\s*=/,
    /document\.write/,
    /Function\(/,
    /setTimeout\s*\(/,
    /setInterval\s*\(/,
  ],
  performancePatterns: [
    /console\.log/,
    /debugger/,
    /alert\(/,
    /confirm\(/,
    /prompt\(/,
  ],
  codeSmells: [
    /catch\s*\(\s*e\s*\)\s*\{\s*\}/, // Empty catch blocks
    /if\s*\(\s*true\s*\)/, // Always true conditions
    /if\s*\(\s*false\s*\)/, // Always false conditions
    /for\s*\(\s*;\s*;\s*\)/, // Infinite loops
  ]
};

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  purple: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Logging functions
const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

const success = (message) => log(`✅ ${message}`, colors.green);
const warning = (message) => log(`⚠️  ${message}`, colors.yellow);
const error = (message) => log(`❌ ${message}`, colors.red);
const info = (message) => log(`ℹ️  ${message}`, colors.blue);
const ai = (message) => log(`🤖 ${message}`, colors.purple);

// File analysis class
class CodeAnalyzer {
  constructor() {
    this.stats = {
      filesAnalyzed: 0,
      totalLines: 0,
      totalSize: 0,
      issues: {
        security: 0,
        performance: 0,
        codeSmells: 0,
        complexity: 0,
        size: 0,
        testing: 0
      },
      recommendations: []
    };
  }

  async analyzeFile(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      
      this.stats.filesAnalyzed++;
      this.stats.totalLines += content.split('\n').length;
      this.stats.totalSize += stats.size;

      const analysis = {
        path: filePath,
        size: stats.size,
        lines: content.split('\n').length,
        issues: [],
        recommendations: []
      };

      // Size analysis
      if (stats.size > config.maxFileSize) {
        analysis.issues.push({
          type: 'size',
          severity: 'medium',
          message: `File size (${this.formatBytes(stats.size)}) exceeds recommended limit (${this.formatBytes(config.maxFileSize)})`,
          recommendation: 'Consider splitting this file into smaller, more focused modules'
        });
        this.stats.issues.size++;
      }

      // Line count analysis
      if (content.split('\n').length > config.maxLines) {
        analysis.issues.push({
          type: 'size',
          severity: 'medium',
          message: `File has ${content.split('\n').length} lines (recommended: <${config.maxLines})`,
          recommendation: 'Consider breaking this file into smaller components'
        });
        this.stats.issues.size++;
      }

      // Security analysis
      config.securityPatterns.forEach((pattern, index) => {
        if (pattern.test(content)) {
          analysis.issues.push({
            type: 'security',
            severity: 'high',
            message: `Security concern: ${pattern.source}`,
            recommendation: this.getSecurityRecommendation(pattern.source)
          });
          this.stats.issues.security++;
        }
      });

      // Performance analysis
      config.performancePatterns.forEach((pattern) => {
        const matches = content.match(new RegExp(pattern.source, 'g'));
        if (matches && matches.length > 5) {
          analysis.issues.push({
            type: 'performance',
            severity: 'medium',
            message: `Performance concern: ${matches.length} occurrences of ${pattern.source}`,
            recommendation: 'Consider removing or replacing with production-ready alternatives'
          });
          this.stats.issues.performance++;
        }
      });

      // Code smell analysis
      config.codeSmells.forEach((pattern) => {
        if (pattern.test(content)) {
          analysis.issues.push({
            type: 'codeSmells',
            severity: 'low',
            message: `Code smell detected: ${pattern.source}`,
            recommendation: this.getCodeSmellRecommendation(pattern.source)
          });
          this.stats.issues.codeSmells++;
        }
      });

      // Complexity analysis (simplified)
      const complexity = this.calculateComplexity(content);
      if (complexity > config.maxComplexity) {
        analysis.issues.push({
          type: 'complexity',
          severity: 'medium',
          message: `Cyclomatic complexity (${complexity}) exceeds recommended limit (${config.maxComplexity})`,
          recommendation: 'Consider refactoring complex functions into smaller, more focused functions'
        });
        this.stats.issues.complexity++;
      }

      // Testing analysis
      if (filePath.includes('.test.') || filePath.includes('.spec.')) {
        // This is a test file - check for good practices
        const testCoverage = this.analyzeTestCoverage(content);
        if (testCoverage < config.minTestCoverage) {
          analysis.issues.push({
            type: 'testing',
            severity: 'medium',
            message: `Test coverage appears low (${testCoverage}%)`,
            recommendation: 'Add more comprehensive test cases to improve coverage'
          });
          this.stats.issues.testing++;
        }
      } else if (!filePath.includes('node_modules') && !filePath.includes('.d.ts')) {
        // This is not a test file - check if it has corresponding test file
        const testFilePath = filePath.replace(/\.(ts|tsx)$/, '.test.$1');
        try {
          await fs.access(testFilePath);
        } catch {
          analysis.issues.push({
            type: 'testing',
            severity: 'low',
            message: 'No corresponding test file found',
            recommendation: 'Consider adding unit tests for this file'
          });
          this.stats.issues.testing++;
        }
      }

      return analysis;
    } catch (error) {
      error(`Failed to analyze file ${filePath}: ${error.message}`);
      return null;
    }
  }

  calculateComplexity(content) {
    // Simplified cyclomatic complexity calculation
    const complexityPatterns = [
      /if\s*\(/g,
      /else\s+if\s*\(/g,
      /while\s*\(/g,
      /for\s*\(/g,
      /switch\s*\(/g,
      /catch\s*\(/g,
      /\&\&/g,
      /\|\|/g,
      /\?/g
    ];

    let complexity = 1; // Base complexity
    complexityPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });

    return complexity;
  }

  analyzeTestCoverage(content) {
    // Simplified test coverage estimation
    const totalFunctions = (content.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || []).length;
    const testedFunctions = (content.match(/it\s*\(|test\s*\(/g) || []).length;
    
    if (totalFunctions === 0) return 100;
    return Math.round((testedFunctions / totalFunctions) * 100);
  }

  getSecurityRecommendation(pattern) {
    const recommendations = {
      'eval\\(': 'Avoid using eval() - use safer alternatives like JSON.parse() or function constructors',
      'dangerouslySetInnerHTML': 'Use DOMPurify or similar sanitization library before setting innerHTML',
      'innerHTML\\s*=': 'Use textContent or DOM manipulation methods instead of innerHTML',
      'document\\.write': 'Use DOM manipulation methods instead of document.write',
      'Function\\(': 'Use arrow functions or function declarations instead of Function constructor',
      'setTimeout\\s*\\(': 'Ensure setTimeout is used appropriately and clearTimeout is called',
      'setInterval\\s*\\(': 'Ensure setInterval is used appropriately and clearInterval is called'
    };
    return recommendations[pattern] || 'Review this security concern and implement safer alternatives';
  }

  getCodeSmellRecommendation(pattern) {
    const recommendations = {
      'catch\\s*\\(\\s*e\\s*\\)\\s*\\{\\s*\\}': 'Handle errors properly or remove the catch block if not needed',
      'if\\s*\\(\\s*true\\s*\\)': 'Remove unnecessary condition or use proper logic',
      'if\\s*\\(\\s*false\\s*\\)': 'Remove unnecessary condition or use proper logic',
      'for\\s*\\(\\s*;\\s*;\\s*\\)': 'Ensure loop has proper termination condition'
    };
    return recommendations[pattern] || 'Review and refactor this code pattern';
  }

  formatBytes(bytes) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
    if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)}MB`;
    return `${(bytes / 1073741824).toFixed(1)}GB`;
  }

  async analyzeDirectory(dirPath) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const analyses = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        const subAnalyses = await this.analyzeDirectory(fullPath);
        analyses.push(...subAnalyses);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        const analysis = await this.analyzeFile(fullPath);
        if (analysis) analyses.push(analysis);
      }
    }

    return analyses;
  }

  generateRecommendations(analyses) {
    const recommendations = [];

    // Aggregate recommendations by type
    const issueTypes = ['security', 'performance', 'codeSmells', 'complexity', 'size', 'testing'];
    
    issueTypes.forEach(type => {
      const typeIssues = analyses.flatMap(a => a.issues.filter(i => i.type === type));
      if (typeIssues.length > 0) {
        const severity = typeIssues.some(i => i.severity === 'high') ? 'high' : 
                        typeIssues.some(i => i.severity === 'medium') ? 'medium' : 'low';
        
        recommendations.push({
          type,
          count: typeIssues.length,
          severity,
          priority: this.getPriority(type, severity),
          actions: this.getRecommendedActions(type, typeIssues)
        });
      }
    });

    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  getPriority(type, severity) {
    const priorities = {
      security: { high: 100, medium: 80, low: 60 },
      performance: { high: 90, medium: 70, low: 50 },
      codeSmells: { high: 70, medium: 50, low: 30 },
      complexity: { high: 80, medium: 60, low: 40 },
      size: { high: 60, medium: 40, low: 20 },
      testing: { high: 70, medium: 50, low: 30 }
    };
    return priorities[type][severity] || 0;
  }

  getRecommendedActions(type, issues) {
    const actions = {
      security: [
        'Review all security concerns immediately',
        'Implement security best practices',
        'Add security testing to CI/CD pipeline',
        'Consider using security linting rules'
      ],
      performance: [
        'Profile application performance',
        'Implement performance monitoring',
        'Optimize critical rendering path',
        'Consider lazy loading strategies'
      ],
      codeSmells: [
        'Refactor code smells for maintainability',
        'Establish coding standards',
        'Add code review processes',
        'Consider automated refactoring tools'
      ],
      complexity: [
        'Simplify complex functions',
        'Break down large components',
        'Implement design patterns',
        'Add comprehensive documentation'
      ],
      size: [
        'Implement code splitting',
        'Use tree shaking',
        'Optimize bundle size',
        'Consider lazy loading'
      ],
      testing: [
        'Increase test coverage',
        'Add unit and integration tests',
        'Implement test automation',
        'Add testing to CI/CD pipeline'
      ]
    };
    return actions[type] || ['Review and improve code quality'];
  }

  async generateReport(analyses) {
    const recommendations = this.generateRecommendations(analyses);
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        filesAnalyzed: this.stats.filesAnalyzed,
        totalLines: this.stats.totalLines,
        totalSize: this.stats.totalSize,
        totalIssues: Object.values(this.stats.issues).reduce((a, b) => a + b, 0)
      },
      issues: this.stats.issues,
      recommendations,
      topFiles: analyses
        .sort((a, b) => b.issues.length - a.issues.length)
        .slice(0, 10)
        .map(a => ({
          path: a.path,
          issues: a.issues.length,
          lines: a.lines,
          size: a.size
        }))
    };

    return report;
  }

  printReport(report) {
    ai('AI-Powered Code Analysis Report');
    console.log('='.repeat(50));
    
    info(`Files Analyzed: ${report.summary.filesAnalyzed}`);
    info(`Total Lines: ${report.summary.totalLines.toLocaleString()}`);
    info(`Total Size: ${this.formatBytes(report.summary.totalSize)}`);
    info(`Total Issues: ${report.summary.totalIssues}`);
    
    console.log('\n📊 Issue Breakdown:');
    Object.entries(report.issues).forEach(([type, count]) => {
      if (count > 0) {
        const icon = type === 'security' ? '🔒' : 
                   type === 'performance' ? '⚡' : 
                   type === 'codeSmells' ? '👃' : 
                   type === 'complexity' ? '🧠' : 
                   type === 'size' ? '📏' : '🧪';
        console.log(`  ${icon} ${type}: ${count}`);
      }
    });

    if (report.recommendations.length > 0) {
      console.log('\n🎯 AI Recommendations (Priority Order):');
      report.recommendations.forEach((rec, index) => {
        const icon = rec.severity === 'high' ? '🔴' : 
                   rec.severity === 'medium' ? '🟡' : '🟢';
        console.log(`\n${index + 1}. ${icon} ${rec.type.toUpperCase()} (${rec.count} issues)`);
        console.log(`   Priority: ${rec.priority}/100`);
        rec.actions.slice(0, 2).forEach(action => {
          console.log(`   • ${action}`);
        });
      });
    }

    if (report.topFiles.length > 0) {
      console.log('\n📁 Files Requiring Attention:');
      report.topFiles.forEach((file, index) => {
        console.log(`${index + 1}. ${file.path} (${file.issues} issues, ${file.lines} lines, ${this.formatBytes(file.size)})`);
      });
    }

    console.log('\n' + '='.repeat(50));
    success('AI analysis completed successfully');
  }
}

// Main execution
async function main() {
  ai('Starting AI-Powered Code Analysis...');
  
  const analyzer = new CodeAnalyzer();
  const srcPath = path.join(projectRoot, 'src');
  
  try {
    const analyses = await analyzer.analyzeDirectory(srcPath);
    const report = await analyzer.generateReport(analyses);
    
    // Print report to console
    analyzer.printReport(report);
    
    // Save detailed report
    const reportPath = path.join(projectRoot, 'logs', `ai-analysis-${Date.now()}.json`);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    success(`Detailed report saved to: ${reportPath}`);
    
    // Exit with appropriate code based on issues found
    const totalIssues = report.summary.totalIssues;
    if (totalIssues > 50) {
      error(`High number of issues found: ${totalIssues}`);
      process.exit(1);
    } else if (totalIssues > 20) {
      warning(`Moderate number of issues found: ${totalIssues}`);
      process.exit(0);
    } else {
      success(`Low number of issues found: ${totalIssues}`);
      process.exit(0);
    }
    
  } catch (error) {
    error(`Analysis failed: ${error.message}`);
    process.exit(1);
  }
}

// Run main function
main();
