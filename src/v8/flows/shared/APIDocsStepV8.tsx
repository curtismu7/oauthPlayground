/**
 * @file APIDocsStepV8.tsx
 * @module v8/flows/shared
 * @description API Documentation Step for Device Authentication flows
 * @version 8.1.0
 */

import React from 'react';
import { FiBook, FiCode, FiCopy, FiExternalLink } from 'react-icons/fi';
import styled from 'styled-components';
import type { MFAFlowBaseRenderProps } from './MFAFlowBaseV8';

const MODULE_TAG = '[📚 API-DOCS-STEP-V8]';

// Styled Components
const StepContent = styled.div`
	h2 {
		display: flex;
		align-items: center;
		font-size: 18px;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 12px;
	}

	> p {
		font-size: 14px;
		color: #6b7280;
		margin-bottom: 20px;
		line-height: 1.5;
	}
`;

const ApiExampleCard = styled.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	padding: 16px;
	margin-bottom: 16px;

	h3 {
		display: flex;
		align-items: center;
		font-size: 16px;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 8px;
	}

	.method {
		display: inline-block;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 600;
		margin-right: 8px;
	}

	.method.get {
		background: #dbeafe;
		color: #1e40af;
	}

	.method.post {
		background: #dcfce7;
		color: #166534;
	}

	.endpoint {
		font-family: 'Courier New', monospace;
		font-size: 14px;
		color: #4b5563;
		background: #f1f5f9;
		padding: 2px 6px;
		border-radius: 4px;
	}

	.description {
		font-size: 13px;
		color: #6b7280;
		margin: 8px 0;
		line-height: 1.4;
	}

	.body {
		font-family: 'Courier New', monospace;
		font-size: 13px;
		color: #374151;
		background: #f9fafb;
		padding: 12px;
		border-radius: 4px;
		border: 1px solid #e5e7eb;
		white-space: pre-wrap;
	}
`;

const CopyButton = styled.button`
	background: #f3f4f6;
	border: 1px solid #d1d5db;
	border-radius: 4px;
	padding: 6px 12px;
	font-size: 12px;
	color: #374151;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: #e5e7eb;
		border-color: #9ca3af;
	}

	&:active {
		background: #d1d5db;
	}
`;

const InfoBox = styled.div`
	background: #dbeafe;
	border: 1px solid #93c5fd;
	border-radius: 8px;
	padding: 20px;
	margin: 20px 0;

	h4 {
		display: flex;
		align-items: center;
		margin: 0 0 12px 0;
		font-size: 16px;
		font-weight: 600;
		color: #1e40af;
	}

	ul {
		margin: 12px 0;
		padding-left: 20px;
	}

	li {
		margin: 8px 0;
		font-size: 14px;
		color: #1e40af;
		line-height: 1.4;
	}

	a {
		text-decoration: none;

		&:hover {
			text-decoration: underline;
		}
	}
`;

interface APIDocsStepV8Props {
	renderProps: MFAFlowBaseRenderProps;
}

export const APIDocsStepV8: React.FC<APIDocsStepV8Props> = ({ renderProps }) => {
	const { credentials, mfaState } = renderProps;

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text).then(() => {
			// Show success feedback
			console.log(`${MODULE_TAG} Copied to clipboard: ${text}`);
		});
	};

	const apiExamples = [
		{
			title: 'Device Authentication Status',
			method: 'GET',
			endpoint: `/environments/${credentials.environmentId}/deviceAuthentications/{authenticationId}`,
			description: 'Check the status of an ongoing device authentication',
		},
		{
			title: 'Validate OTP Code',
			method: 'POST',
			endpoint: `/environments/${credentials.environmentId}/deviceAuthentications/{authenticationId}/otp`,
			description: 'Submit the OTP code received by the user',
			body: {
				otp: '123456',
			},
		},
		{
			title: 'Cancel Authentication',
			method: 'DELETE',
			endpoint: `/environments/${credentials.environmentId}/deviceAuthentications/{authenticationId}`,
			description: 'Cancel an ongoing device authentication',
		},
	];

	return (
		<StepContent>
			<h2>
				<FiBook style={{ marginRight: '8px', color: '#10b981' }} />
				API Documentation
			</h2>
			<p>
				Here are the API endpoints and examples for working with PingOne MFA Device Authentication.
				These APIs use the same access token you obtained during authentication.
			</p>

			<InfoBox>
				<h4>
					<FiCode style={{ marginRight: '8px', color: '#1e40af' }} />
					Authentication Headers
				</h4>
				<p>All API calls must include the following headers:</p>
				<div
					style={{
						background: '#f8fafc',
						padding: '12px',
						borderRadius: '6px',
						fontFamily: 'monospace',
						fontSize: '13px',
					}}
				>
					<div>
						Authorization: Bearer{' '}
						{credentials.userToken
							? `${credentials.userToken.substring(0, 20)}...`
							: 'YOUR_ACCESS_TOKEN'}
					</div>
					<div>Content-Type: application/json</div>
				</div>
				<CopyButton
					type="button"
					onClick={() =>
						copyToClipboard(`Authorization: Bearer ${credentials.userToken || 'YOUR_ACCESS_TOKEN'}`)
					}
				>
					<FiCopy size={12} style={{ marginRight: '4px' }} />
					Copy Header
				</CopyButton>
			</InfoBox>

			<div style={{ marginTop: '24px' }}>
				<h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
					API Endpoints
				</h3>

				{apiExamples.map((api, index) => (
					<ApiExampleCard key={index}>
						<h3>
							<span className={`method ${api.method.toLowerCase()}`}>{api.method}</span>
							<span className="endpoint">{api.endpoint}</span>
						</h3>
						<div className="description">{api.title}</div>
						<p className="description">{api.description}</p>
						{api.body && (
							<div>
								<div className="description" style={{ marginBottom: '6px', fontWeight: 500 }}>
									Request Body:
								</div>
								<div className="body">{JSON.stringify(api.body, null, 2)}</div>
							</div>
						)}
					</ApiExampleCard>
				))}
			</div>

			<InfoBox style={{ marginTop: '24px' }}>
				<h4>
					<FiExternalLink style={{ marginRight: '8px', color: '#1e40af' }} />
					Additional Resources
				</h4>
				<ul>
					<li>
						<a
							href="https://apidocs.pingidentity.com/pingone/mfa/v1/api/"
							target="_blank"
							rel="noopener noreferrer"
							style={{ color: '#1e40af', textDecoration: 'none' }}
						>
							PingOne MFA API Documentation
						</a>
					</li>
					<li>
						<a
							href="https://docs.pingidentity.com/pingone/mfa/"
							target="_blank"
							rel="noopener noreferrer"
							style={{ color: '#1e40af', textDecoration: 'none' }}
						>
							PingOne MFA Developer Guide
						</a>
					</li>
					<li>
						<a
							href="https://docs.pingidentity.com/pingone/p1_cloud__platform_main_landing_page.html"
							target="_blank"
							rel="noopener noreferrer"
							style={{ color: '#1e40af', textDecoration: 'none' }}
						>
							PingOne Platform Documentation
						</a>
					</li>
				</ul>
			</InfoBox>

			{mfaState.deviceId && (
				<div
					style={{
						marginTop: '20px',
						padding: '12px',
						background: '#fef3c7',
						border: '1px solid #fcd34d',
						borderRadius: '6px',
					}}
				>
					<div style={{ fontSize: '13px', color: '#92400e' }}>
						<strong>Current Session:</strong> Device ID {mfaState.deviceId} is ready for API calls
					</div>
				</div>
			)}
		</StepContent>
	);
};
