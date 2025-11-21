// src/pages/URLDecoder.tsx - URL Decoder Utility
import React, { useCallback, useState } from 'react';
import {
	FiAlertTriangle,
	FiCheck,
	FiCode,
	FiCopy,
	FiGlobe,
	FiInfo,
	FiLink,
	FiRefreshCw,
	FiSearch,
} from 'react-icons/fi';
import styled from 'styled-components';
import { showFlowError, showFlowSuccess } from '../components/CentralizedSuccessMessage';
import { FlowHeader } from '../services/flowHeaderService';
import { copyToClipboard } from '../utils/clipboard';

// Styled components
const Container = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  padding: 2rem 1rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  color: #1f2937;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  color: #1f2937;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
`;

const Subtitle = styled.p`
  font-size: 1.125rem;
  color: #6b7280;
  margin: 0;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
`;

const ContentCard = styled.div`
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  margin-bottom: 2rem;
  border: 1px solid #e5e7eb;
`;

const CardHeader = styled.div`
  margin-bottom: 1.5rem;
`;

const CardTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CardDescription = styled.p`
  color: #6b7280;
  margin: 0;
  font-size: 0.875rem;
`;

const FormField = styled.div`
  margin-bottom: 1.5rem;
`;

const FormLabel = styled.label`
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  resize: vertical;
  background: #f9fafb;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'success' | 'danger' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  
  ${({ variant = 'primary' }) => {
		switch (variant) {
			case 'primary':
				return `
          background: #3b82f6;
          color: white;
          &:hover { background: #2563eb; }
          &:disabled { background: #9ca3af; cursor: not-allowed; }
        `;
			case 'secondary':
				return `
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          &:hover { background: #e5e7eb; }
        `;
			case 'success':
				return `
          background: #10b981;
          color: white;
          &:hover { background: #059669; }
        `;
			case 'danger':
				return `
          background: #ef4444;
          color: white;
          &:hover { background: #dc2626; }
        `;
		}
	}}
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

const ResultCard = styled.div`
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1rem;
`;

const ResultTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #0369a1;
  margin: 0 0 0.75rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ResultContent = styled.pre`
  background: #e0f2fe;
  border: 1px solid #90cdf4;
  border-radius: 0.375rem;
  padding: 0.75rem;
  font-size: 0.75rem;
  color: #0c4a6e;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  overflow-x: auto;
`;

const InfoBox = styled.div<{ type?: 'info' | 'warning' | 'error' | 'success' }>`
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  line-height: 1.5;
  
  ${({ type = 'info' }) => {
		switch (type) {
			case 'info':
				return `
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          color: #0369a1;
        `;
			case 'warning':
				return `
          background: #fef3c7;
          border: 1px solid #fde047;
          color: #92400e;
        `;
			case 'error':
				return `
          background: #fee2e2;
          border: 1px solid #fecaca;
          color: #dc2626;
        `;
			case 'success':
				return `
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        `;
		}
	}}
`;

const URLDecoder: React.FC = () => {
	const [inputUrl, setInputUrl] = useState('');
	const [decodedResult, setDecodedResult] = useState<string>('');
	const [isDecoding, setIsDecoding] = useState(false);

	// Decode URL function
	const decodeUrl = useCallback(() => {
		if (!inputUrl.trim()) {
			showFlowError(' Input Required', 'Please enter a URL to decode.');
			return;
		}

		setIsDecoding(true);
		try {
			let decoded: string;

			try {
				// Try to decode as a complete URL first
				const url = new URL(inputUrl.trim());
				const decodedSearchParams = new URLSearchParams(url.search);
				const decodedHash = new URLSearchParams(url.hash.substring(1)); // Remove the # from hash

				let result = `Full URL: ${url.toString()}\n\n`;
				result += `Protocol: ${url.protocol}\n`;
				result += `Host: ${url.host}\n`;
				result += `Pathname: ${url.pathname}\n`;
				result += `Origin: ${url.origin}\n\n`;

				if (decodedSearchParams.toString()) {
					result += `Query Parameters:\n`;
					for (const [key, value] of decodedSearchParams.entries()) {
						result += `  ${key}: ${value}\n`;
					}
					result += `\n`;
				}

				if (decodedHash.toString()) {
					result += `Hash Parameters:\n`;
					for (const [key, value] of decodedHash.entries()) {
						result += `  ${key}: ${value}\n`;
					}
				}

				decoded = result;
			} catch {
				// If it's not a complete URL, try to decode as URL-encoded string
				decoded = decodeURIComponent(inputUrl.trim());
			}

			setDecodedResult(decoded);
			showFlowSuccess(
				' URL Decoded Successfully',
				'The URL has been decoded and formatted for easy reading.'
			);
		} catch (error) {
			console.error(' [URLDecoder] Failed to decode URL:', error);
			showFlowError(
				' Decode Failed',
				error instanceof Error
					? error.message
					: 'Failed to decode the URL. Please check the format.'
			);
		} finally {
			setIsDecoding(false);
		}
	}, [inputUrl]);

	// Clear all inputs
	const clearAll = useCallback(() => {
		setInputUrl('');
		setDecodedResult('');
		showFlowSuccess(' Cleared', 'All inputs and results have been cleared.');
	}, []);

	// Copy decoded result to clipboard
	const copyResult = useCallback(() => {
		if (!decodedResult) {
			showFlowError(' Nothing to Copy', 'Please decode a URL first.');
			return;
		}

		copyToClipboard(decodedResult, 'Decoded URL');
		showFlowSuccess(' Copied to Clipboard', 'The decoded URL has been copied to your clipboard.');
	}, [decodedResult]);

	// Load sample URL
	const loadSample = useCallback(() => {
		const sampleUrl =
			'https://auth.pingone.com/b9817c16-9910-4415-b67e-4ac687da74d9/as/authorize?client_id=a4f963ea-0736-456a-be72-b1fa4f63f81f&redirect_uri=https%3A%2F%2Flocalhost%3A3000%2Fcallback&response_type=code&scope=openid%20profile%20email&state=abc123&nonce=xyz789&code_challenge=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk&code_challenge_method=S256';
		setInputUrl(sampleUrl);
		showFlowSuccess(' Sample Loaded', 'A sample OAuth authorization URL has been loaded.');
	}, []);

	return (
		<Container>
			<FlowHeader flowType="url-decoder" />

			<ContentCard>
				<CardHeader>
					<CardTitle>
						<FiCode />
						URL Input
					</CardTitle>
					<CardDescription>
						Paste or type a URL to decode. This tool works with complete URLs, URL-encoded strings,
						and OAuth authorization URLs.
					</CardDescription>
				</CardHeader>

				<InfoBox type="info">
					<div
						style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}
					>
						<FiInfo />
						<strong>Supported Formats:</strong>
					</div>
					<ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
						<li>Complete URLs (https://example.com/path?param=value)</li>
						<li>URL-encoded strings (%20%2F%3F)</li>
						<li>OAuth authorization URLs with query parameters</li>
						<li>Callback URLs with hash fragments</li>
					</ul>
				</InfoBox>

				<FormField>
					<FormLabel>URL to Decode *</FormLabel>
					<TextArea
						value={inputUrl}
						onChange={(e) => setInputUrl(e.target.value)}
						placeholder="Paste your URL here, e.g.: https://auth.pingone.com/.../authorize?client_id=...&redirect_uri=..."
					/>
				</FormField>

				<ButtonGroup>
					<Button onClick={decodeUrl} disabled={isDecoding || !inputUrl.trim()} variant="primary">
						{isDecoding ? (
							<FiRefreshCw style={{ animation: 'spin 1s linear infinite' }} />
						) : (
							<FiSearch />
						)}
						{isDecoding ? 'Decoding...' : 'Decode URL'}
					</Button>

					<Button onClick={loadSample} variant="secondary">
						<FiLink />
						Load Sample
					</Button>

					<Button onClick={clearAll} variant="danger">
						<FiRefreshCw />
						Clear All
					</Button>
				</ButtonGroup>
			</ContentCard>

			{decodedResult && (
				<ContentCard>
					<CardHeader>
						<CardTitle>
							<FiCheck />
							Decoded Result
						</CardTitle>
						<CardDescription>
							The decoded and formatted URL with all parameters broken down for easy analysis.
						</CardDescription>
					</CardHeader>

					<ResultCard>
						<ResultTitle>
							<FiCode />
							Decoded URL Details
						</ResultTitle>
						<ResultContent>{decodedResult}</ResultContent>
					</ResultCard>

					<ButtonGroup>
						<Button onClick={copyResult} variant="success">
							<FiCopy />
							Copy Result
						</Button>
					</ButtonGroup>
				</ContentCard>
			)}

			<ContentCard>
				<CardHeader>
					<CardTitle>
						<FiAlertTriangle />
						Usage Tips
					</CardTitle>
					<CardDescription>
						Best practices and tips for using the URL decoder effectively.
					</CardDescription>
				</CardHeader>

				<InfoBox type="warning">
					<div
						style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}
					>
						<FiAlertTriangle />
						<strong>Security Note:</strong>
					</div>
					<p style={{ margin: 0 }}>
						Be careful when sharing decoded URLs that contain sensitive information like client
						secrets, tokens, or personal data. This tool is for development and debugging purposes
						only.
					</p>
				</InfoBox>

				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
						gap: '1rem',
					}}
				>
					<div>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>OAuth URLs</h4>
						<p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
							Perfect for analyzing OAuth authorization URLs, callback URLs, and token exchange
							requests. Helps debug parameter issues and understand URL structure.
						</p>
					</div>

					<div>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>Parameter Analysis</h4>
						<p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
							Breaks down query parameters and hash fragments into readable key-value pairs. Useful
							for debugging redirect URI mismatches and parameter validation.
						</p>
					</div>

					<div>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>URL Structure</h4>
						<p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
							Shows the complete URL structure including protocol, host, path, and all components.
							Helps understand the full context of the URL.
						</p>
					</div>
				</div>
			</ContentCard>
		</Container>
	);
};

export default URLDecoder;
