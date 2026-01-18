/**
 * @file P1MFASamples.tsx
 * @module pages
 * @description Main page for P1MFA SDK sample applications
 * @version 1.0.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { FIDO2SampleApp } from '@/samples/p1mfa/fido2/FIDO2SampleApp';
import { SMSSampleApp } from '@/samples/p1mfa/sms/SMSSampleApp';

export const P1MFASamples: React.FC = () => {
	return (
		<div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
			<h1 style={{ marginBottom: '2rem' }}>P1MFA SDK Sample Applications</h1>

			<div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
				<h2>About P1MFA SDK</h2>
				<p style={{ lineHeight: '1.6', color: '#6c757d' }}>
					The P1MFA SDK is a simplified wrapper for PingOne MFA operations that makes it easy to
					integrate FIDO2 and SMS MFA into your applications. These sample applications demonstrate
					complete registration and authentication flows for both device types.
				</p>
				<p style={{ lineHeight: '1.6', color: '#6c757d', marginTop: '1rem' }}>
					<strong>Features:</strong>
				</p>
				<ul style={{ lineHeight: '1.8', color: '#6c757d' }}>
					<li>Simple, intuitive API</li>
					<li>Type-safe with TypeScript</li>
					<li>Comprehensive error handling</li>
					<li>Automatic token management</li>
					<li>Educational UI with step-by-step guidance</li>
				</ul>
			</div>

			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
				<div style={{ padding: '1.5rem', border: '2px solid #8b5cf6', borderRadius: '8px' }}>
					<h3 style={{ marginBottom: '1rem' }}>🔗 Integrated Sample</h3>
					<p style={{ marginBottom: '1rem', color: '#6c757d' }}>
						Complete end-to-end flow: OIDC Sign-in → MFA Enrollment → MFA Authentication.
						Demonstrates both policy-driven and step-up authentication patterns.
					</p>
					<Link
						to="/samples/p1mfa/integrated"
						style={{
							display: 'inline-block',
							padding: '0.75rem 1.5rem',
							backgroundColor: '#8b5cf6',
							color: 'white',
							textDecoration: 'none',
							borderRadius: '4px',
						}}
					>
						Open Integrated Sample
					</Link>
				</div>

				<div style={{ padding: '1.5rem', border: '2px solid #007bff', borderRadius: '8px' }}>
					<h3 style={{ marginBottom: '1rem' }}>FIDO2 Sample App</h3>
					<p style={{ marginBottom: '1rem', color: '#6c757d' }}>
						Demonstrates FIDO2/WebAuthn device registration and authentication flows using
						platform authenticators (TouchID, FaceID, Windows Hello) or security keys.
					</p>
					<Link
						to="/samples/p1mfa/fido2"
						style={{
							display: 'inline-block',
							padding: '0.75rem 1.5rem',
							backgroundColor: '#007bff',
							color: 'white',
							textDecoration: 'none',
							borderRadius: '4px',
						}}
					>
						Open FIDO2 Sample
					</Link>
				</div>

				<div style={{ padding: '1.5rem', border: '2px solid #28a745', borderRadius: '8px' }}>
					<h3 style={{ marginBottom: '1rem' }}>SMS Sample App</h3>
					<p style={{ marginBottom: '1rem', color: '#6c757d' }}>
						Demonstrates SMS device registration and authentication flows with OTP (One-Time
						Password) verification.
					</p>
					<Link
						to="/samples/p1mfa/sms"
						style={{
							display: 'inline-block',
							padding: '0.75rem 1.5rem',
							backgroundColor: '#28a745',
							color: 'white',
							textDecoration: 'none',
							borderRadius: '4px',
						}}
					>
						Open SMS Sample
					</Link>
				</div>
			</div>

			<div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
				<h3 style={{ marginBottom: '1rem' }}>Prerequisites</h3>
				<ul style={{ lineHeight: '1.8' }}>
					<li>PingOne environment with MFA enabled</li>
					<li>Device Authentication Policy configured</li>
					<li>Worker token credentials (Client ID and Secret)</li>
					<li>For FIDO2: Browser with WebAuthn support (Chrome, Firefox, Safari, Edge)</li>
					<li>For SMS: SMS provider configured in PingOne</li>
				</ul>
			</div>
		</div>
	);
};
