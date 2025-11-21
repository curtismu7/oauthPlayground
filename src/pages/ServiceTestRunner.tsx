// src/pages/ServiceTestRunner.tsx
/**
 * Service Test Runner Page
 *
 * This page provides a UI to run comprehensive tests on the ComprehensiveFlowDataService
 * and display results in a user-friendly format.
 */

import React, { useState } from 'react';
import styled from 'styled-components';
import { comprehensiveFlowDataServiceTest } from '../utils/comprehensiveFlowDataServiceTest';

const TestRunnerContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const TestRunnerHeader = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  border-radius: 12px;
  margin-bottom: 30px;
  text-align: center;
`;

const TestRunnerTitle = styled.h1`
  margin: 0 0 10px 0;
  font-size: 2.5rem;
  font-weight: 700;
`;

const TestRunnerSubtitle = styled.p`
  margin: 0;
  font-size: 1.2rem;
  opacity: 0.9;
`;

const TestControls = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
  justify-content: center;
`;

const TestButton = styled.button<{ variant?: 'primary' | 'secondary' | 'success' | 'danger' }>`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${(props) => {
		switch (props.variant) {
			case 'primary':
				return `
          background: #007bff;
          color: white;
          &:hover { background: #0056b3; }
        `;
			case 'success':
				return `
          background: #28a745;
          color: white;
          &:hover { background: #1e7e34; }
        `;
			case 'danger':
				return `
          background: #dc3545;
          color: white;
          &:hover { background: #c82333; }
        `;
			default:
				return `
          background: #6c757d;
          color: white;
          &:hover { background: #545b62; }
        `;
		}
	}}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const TestResultsContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const TestResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e9ecef;
`;

const TestResultsTitle = styled.h2`
  margin: 0;
  color: #333;
`;

const TestStats = styled.div`
  display: flex;
  gap: 20px;
`;

const StatItem = styled.div<{ type: 'total' | 'passed' | 'failed' }>`
  text-align: center;
  
  ${(props) => {
		switch (props.type) {
			case 'total':
				return `color: #6c757d;`;
			case 'passed':
				return `color: #28a745;`;
			case 'failed':
				return `color: #dc3545;`;
		}
	}}
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 5px;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TestResultsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const TestResultItem = styled.div<{ passed: boolean }>`
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid ${(props) => (props.passed ? '#28a745' : '#dc3545')};
  background: ${(props) => (props.passed ? '#d4edda' : '#f8d7da')};
`;

const TestResultName = styled.div`
  font-weight: 600;
  margin-bottom: 5px;
  color: #333;
`;

const TestResultStatus = styled.div<{ passed: boolean }>`
  font-size: 0.9rem;
  color: ${(props) => (props.passed ? '#155724' : '#721c24')};
`;

const TestResultError = styled.div`
  margin-top: 10px;
  padding: 10px;
  background: #f8d7da;
  border-radius: 4px;
  color: #721c24;
  font-family: monospace;
  font-size: 0.9rem;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ConsoleOutput = styled.div`
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 20px;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  max-height: 400px;
  overflow-y: auto;
  margin-top: 20px;
`;

interface TestResult {
	testName: string;
	passed: boolean;
	error?: string;
	details?: any;
}

interface TestResults {
	total: number;
	passed: number;
	failed: number;
	successRate: number;
	results: TestResult[];
}

export const ServiceTestRunner: React.FC = () => {
	const [isRunning, setIsRunning] = useState(false);
	const [testResults, setTestResults] = useState<TestResults | null>(null);
	const [consoleOutput, setConsoleOutput] = useState<string[]>([]);

	const runTests = async () => {
		setIsRunning(true);
		setTestResults(null);
		setConsoleOutput([]);

		// Capture console output
		const originalLog = console.log;
		const originalError = console.error;
		const originalGroup = console.group;
		const originalGroupEnd = console.groupEnd;

		const capturedOutput: string[] = [];

		console.log = (...args) => {
			capturedOutput.push(`[LOG] ${args.join(' ')}`);
			originalLog(...args);
		};

		console.error = (...args) => {
			capturedOutput.push(`[ERROR] ${args.join(' ')}`);
			originalError(...args);
		};

		console.group = (...args) => {
			capturedOutput.push(`[GROUP] ${args.join(' ')}`);
			originalGroup(...args);
		};

		console.groupEnd = () => {
			capturedOutput.push(`[GROUP END]`);
			originalGroupEnd();
		};

		try {
			// Run the tests
			await comprehensiveFlowDataServiceTest.runAllTests();

			// Get results (the test suite returns results)
			const results = comprehensiveFlowDataServiceTest['testResults'];
			const total = results.length;
			const passed = results.filter((r) => r.passed).length;
			const failed = results.filter((r) => !r.passed).length;

			setTestResults({
				total,
				passed,
				failed,
				successRate: (passed / total) * 100,
				results,
			});
		} catch (error) {
			console.error('Test runner error:', error);
		} finally {
			// Restore console
			console.log = originalLog;
			console.error = originalError;
			console.group = originalGroup;
			console.groupEnd = originalGroupEnd;

			setConsoleOutput(capturedOutput);
			setIsRunning(false);
		}
	};

	const clearResults = () => {
		setTestResults(null);
		setConsoleOutput([]);
	};

	return (
		<TestRunnerContainer>
			<TestRunnerHeader>
				<TestRunnerTitle>🧪 Service Test Runner</TestRunnerTitle>
				<TestRunnerSubtitle>
					Comprehensive testing for ComprehensiveFlowDataService
				</TestRunnerSubtitle>
			</TestRunnerHeader>

			<TestControls>
				<TestButton variant="primary" onClick={runTests} disabled={isRunning}>
					{isRunning ? (
						<>
							<LoadingSpinner /> Running Tests...
						</>
					) : (
						'🚀 Run All Tests'
					)}
				</TestButton>

				<TestButton variant="secondary" onClick={clearResults} disabled={isRunning}>
					🧹 Clear Results
				</TestButton>
			</TestControls>

			{testResults && (
				<TestResultsContainer>
					<TestResultsHeader>
						<TestResultsTitle>📊 Test Results</TestResultsTitle>
						<TestStats>
							<StatItem type="total">
								<StatNumber>{testResults.total}</StatNumber>
								<StatLabel>Total</StatLabel>
							</StatItem>
							<StatItem type="passed">
								<StatNumber>{testResults.passed}</StatNumber>
								<StatLabel>Passed</StatLabel>
							</StatItem>
							<StatItem type="failed">
								<StatNumber>{testResults.failed}</StatNumber>
								<StatLabel>Failed</StatLabel>
							</StatItem>
						</TestStats>
					</TestResultsHeader>

					<TestResultsList>
						{testResults.results.map((result, index) => (
							<TestResultItem key={index} passed={result.passed}>
								<TestResultName>
									{result.passed ? '✅' : '❌'} {result.testName}
								</TestResultName>
								<TestResultStatus passed={result.passed}>
									{result.passed ? 'PASSED' : 'FAILED'}
								</TestResultStatus>
								{result.error && <TestResultError>{result.error}</TestResultError>}
							</TestResultItem>
						))}
					</TestResultsList>
				</TestResultsContainer>
			)}

			{consoleOutput.length > 0 && (
				<ConsoleOutput>
					<div style={{ marginBottom: '10px', fontWeight: 'bold' }}>📝 Console Output:</div>
					{consoleOutput.map((line, index) => (
						<div key={index}>{line}</div>
					))}
				</ConsoleOutput>
			)}
		</TestRunnerContainer>
	);
};

export default ServiceTestRunner;
