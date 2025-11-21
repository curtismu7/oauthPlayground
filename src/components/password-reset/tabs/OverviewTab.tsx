// src/components/password-reset/tabs/OverviewTab.tsx
// Overview tab component for password reset operations

import React from 'react';
import { FiAlertCircle, FiBook, FiExternalLink } from '../../../services/commonImportsService';
import {
	Alert,
	Card,
	DocumentationLink,
	DocumentationSection,
} from '../shared/PasswordResetSharedComponents';

const HELIOMART_ACCENT_START = '#F59E0B';

export const OverviewTab: React.FC = () => {
	return (
		<>
			<Card>
				<h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', color: '#1F2937' }}>
					Password Operations Overview
				</h2>
				<p style={{ color: '#6B7280', marginBottom: '2rem', lineHeight: '1.6' }}>
					This page demonstrates all PingOne password operations. Each operation uses different{' '}
					<strong>Content-Type headers</strong> to specify the action. Choose an operation from the
					tabs above to see details and try it out.
				</p>

				<Alert $type="info" style={{ marginBottom: '2rem' }}>
					<FiAlertCircle />
					<div>
						<strong>Important: Content-Type Headers</strong>
						<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
							Each password operation requires a specific <code>Content-Type</code> header (e.g.,{' '}
							<code>application/vnd.pingidentity.password.recover+json</code>). The Content-Type
							determines which operation PingOne performs. Always check the API documentation for
							the correct header.
						</p>
					</div>
				</Alert>

				<div style={{ display: 'grid', gap: '1.5rem' }}>
					<div>
						<h3 style={{ marginBottom: '0.5rem', color: HELIOMART_ACCENT_START }}>
							🔐 Recover Password
						</h3>
						<p style={{ color: '#6B7280', lineHeight: '1.6', marginBottom: '0.5rem' }}>
							<strong>Requires:</strong> Recovery code (sent via email/SMS) + New password
						</p>
						<p style={{ color: '#6B7280', lineHeight: '1.6', marginBottom: '0.5rem' }}>
							<strong>Content-Type:</strong>{' '}
							<code
								style={{
									background: '#F3F4F6',
									padding: '0.25rem 0.5rem',
									borderRadius: '0.25rem',
									fontSize: '0.875rem',
								}}
							>
								application/vnd.pingidentity.password.recover+json
							</code>
						</p>
						<p style={{ color: '#6B7280', lineHeight: '1.6' }}>
							For users who have forgotten their password. They request a recovery code via
							email/SMS, then use the code to reset their password.
						</p>
						<DocumentationLink
							href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#user-passwords"
							target="_blank"
							rel="noopener noreferrer"
						>
							<FiBook />
							View API Documentation
							<FiExternalLink size={14} />
						</DocumentationLink>
					</div>

					<div>
						<h3 style={{ marginBottom: '0.5rem', color: HELIOMART_ACCENT_START }}>
							🔒 Force Password Change
						</h3>
						<p style={{ color: '#6B7280', lineHeight: '1.6', marginBottom: '0.5rem' }}>
							<strong>Requires:</strong> Worker token (admin operation)
						</p>
						<p style={{ color: '#6B7280', lineHeight: '1.6', marginBottom: '0.5rem' }}>
							<strong>Content-Type:</strong>{' '}
							<code
								style={{
									background: '#F3F4F6',
									padding: '0.25rem 0.5rem',
									borderRadius: '0.25rem',
									fontSize: '0.875rem',
								}}
							>
								application/vnd.pingidentity.password.forceChange+json
							</code>
						</p>
						<p
							style={{
								color: '#DC2626',
								lineHeight: '1.6',
								fontWeight: 600,
								marginBottom: '0.5rem',
							}}
						>
							⚠️ <strong>Puts user in password change state</strong> - User must change password on
							next sign-on
						</p>
						<p style={{ color: '#6B7280', lineHeight: '1.6' }}>
							For help desk or admin operations. Forces a user to change their password on their
							next sign-on.
						</p>
						<DocumentationLink
							href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#user-passwords"
							target="_blank"
							rel="noopener noreferrer"
						>
							<FiBook />
							View API Documentation
							<FiExternalLink size={14} />
						</DocumentationLink>
					</div>

					<div>
						<h3 style={{ marginBottom: '0.5rem', color: HELIOMART_ACCENT_START }}>
							✏️ Change Password
						</h3>
						<p style={{ color: '#6B7280', lineHeight: '1.6', marginBottom: '0.5rem' }}>
							<strong>Requires:</strong> User access token + Old password + New password
						</p>
						<p style={{ color: '#6B7280', lineHeight: '1.6', marginBottom: '0.5rem' }}>
							<strong>Content-Type:</strong>{' '}
							<code
								style={{
									background: '#F3F4F6',
									padding: '0.25rem 0.5rem',
									borderRadius: '0.25rem',
									fontSize: '0.875rem',
								}}
							>
								application/vnd.pingidentity.password.change+json
							</code>
						</p>
						<p style={{ color: '#6B7280', lineHeight: '1.6' }}>
							For authenticated users who know their current password and want to change it.
							Requires user's access token (not worker token).
						</p>
						<DocumentationLink
							href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#user-passwords"
							target="_blank"
							rel="noopener noreferrer"
						>
							<FiBook />
							View API Documentation
							<FiExternalLink size={14} />
						</DocumentationLink>
					</div>

					<div>
						<h3 style={{ marginBottom: '0.5rem', color: HELIOMART_ACCENT_START }}>
							✅ Update Password (Set Value)
						</h3>
						<p style={{ color: '#6B7280', lineHeight: '1.6', marginBottom: '0.5rem' }}>
							<strong>Requires:</strong> Worker token + New password
						</p>
						<p style={{ color: '#6B7280', lineHeight: '1.6', marginBottom: '0.5rem' }}>
							<strong>Content-Type:</strong>{' '}
							<code
								style={{
									background: '#F3F4F6',
									padding: '0.25rem 0.5rem',
									borderRadius: '0.25rem',
									fontSize: '0.875rem',
								}}
							>
								application/vnd.pingidentity.password.set-value+json
							</code>
						</p>
						<p
							style={{
								color: '#22C55E',
								lineHeight: '1.6',
								fontWeight: 600,
								marginBottom: '0.5rem',
							}}
						>
							✅ <strong>Recommended for admin password resets</strong> - Sets password without
							recovery code and does NOT force password change state
						</p>
						<p style={{ color: '#6B7280', lineHeight: '1.6' }}>
							Admin operation to set a user's password directly. Does not require recovery code and
							does not put the user in a forced password change state.
						</p>
						<DocumentationLink
							href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#user-passwords"
							target="_blank"
							rel="noopener noreferrer"
						>
							<FiBook />
							View API Documentation
							<FiExternalLink size={14} />
						</DocumentationLink>
					</div>

					<div>
						<h3 style={{ marginBottom: '0.5rem', color: HELIOMART_ACCENT_START }}>
							🔍 Check Password
						</h3>
						<p style={{ color: '#6B7280', lineHeight: '1.6', marginBottom: '0.5rem' }}>
							<strong>Requires:</strong> Worker token + Password to verify
						</p>
						<p style={{ color: '#6B7280', lineHeight: '1.6', marginBottom: '0.5rem' }}>
							<strong>Content-Type:</strong>{' '}
							<code
								style={{
									background: '#F3F4F6',
									padding: '0.25rem 0.5rem',
									borderRadius: '0.25rem',
									fontSize: '0.875rem',
								}}
							>
								application/vnd.pingidentity.password.check+json
							</code>
						</p>
						<p style={{ color: '#6B7280', lineHeight: '1.6' }}>
							Verify if a provided password matches the user's current password. Useful for
							validation before allowing password changes.
						</p>
						<DocumentationLink
							href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#user-passwords"
							target="_blank"
							rel="noopener noreferrer"
						>
							<FiBook />
							View API Documentation
							<FiExternalLink size={14} />
						</DocumentationLink>
					</div>

					<div>
						<h3 style={{ marginBottom: '0.5rem', color: HELIOMART_ACCENT_START }}>
							🔓 Unlock Password
						</h3>
						<p style={{ color: '#6B7280', lineHeight: '1.6', marginBottom: '0.5rem' }}>
							<strong>Requires:</strong> Worker token
						</p>
						<p style={{ color: '#6B7280', lineHeight: '1.6', marginBottom: '0.5rem' }}>
							<strong>Content-Type:</strong>{' '}
							<code
								style={{
									background: '#F3F4F6',
									padding: '0.25rem 0.5rem',
									borderRadius: '0.25rem',
									fontSize: '0.875rem',
								}}
							>
								application/json
							</code>
						</p>
						<p style={{ color: '#6B7280', lineHeight: '1.6' }}>
							Unlock a user's account that has been locked due to failed login attempts. Admin
							operation.
						</p>
						<DocumentationLink
							href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#user-passwords"
							target="_blank"
							rel="noopener noreferrer"
						>
							<FiBook />
							View API Documentation
							<FiExternalLink size={14} />
						</DocumentationLink>
					</div>

					<div>
						<h3 style={{ marginBottom: '0.5rem', color: HELIOMART_ACCENT_START }}>
							📊 Read Password State
						</h3>
						<p style={{ color: '#6B7280', lineHeight: '1.6', marginBottom: '0.5rem' }}>
							<strong>Requires:</strong> Worker token
						</p>
						<p style={{ color: '#6B7280', lineHeight: '1.6', marginBottom: '0.5rem' }}>
							<strong>Method:</strong> GET (no special Content-Type)
						</p>
						<p style={{ color: '#6B7280', lineHeight: '1.6' }}>
							Retrieve the current password state information for a user, including lock status,
							expiration, and change requirements.
						</p>
						<DocumentationLink
							href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#user-passwords"
							target="_blank"
							rel="noopener noreferrer"
						>
							<FiBook />
							View API Documentation
							<FiExternalLink size={14} />
						</DocumentationLink>
					</div>
				</div>
			</Card>

			<Card style={{ marginTop: '2rem' }}>
				<h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#1F2937' }}>
					User Lookup with Filter Parameters
				</h2>

				<Alert $type="info" style={{ marginBottom: '1.5rem' }}>
					<FiAlertCircle />
					<div>
						<strong>How User Lookup Works:</strong>
						<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
							This application uses PingOne Management API with filter parameters to look up users
							by username, email, or user ID. The lookup supports three methods: direct ID lookup
							(fastest), filter by username, and filter by email.
							<strong>
								{' '}
								If multiple users match (e.g., same email), the first user is returned.
							</strong>
						</p>
					</div>
				</Alert>

				<div style={{ marginBottom: '1.5rem' }}>
					<h3 style={{ marginBottom: '1rem', color: '#1F2937', fontSize: '1.125rem' }}>
						Filter Examples
					</h3>

					<div
						style={{
							background: '#F9FAFB',
							border: '1px solid #E5E7EB',
							borderRadius: '0.5rem',
							padding: '1rem',
							marginBottom: '1rem',
						}}
					>
						<h4 style={{ marginBottom: '0.5rem', color: '#374151', fontSize: '1rem' }}>
							1. Lookup by Username
						</h4>
						<code
							style={{
								display: 'block',
								background: '#FFFFFF',
								padding: '0.75rem',
								borderRadius: '0.375rem',
								fontSize: '0.875rem',
								border: '1px solid #E5E7EB',
								marginTop: '0.5rem',
								whiteSpace: 'pre-wrap',
								wordBreak: 'break-all',
							}}
						>
							GET /v1/environments/&#123;envID&#125;/users?filter=username%20eq%20%22curtis7%22
						</code>
						<p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6B7280' }}>
							<strong>Note:</strong> Use lowercase{' '}
							<code
								style={{
									background: '#F3F4F6',
									padding: '0.125rem 0.25rem',
									borderRadius: '0.25rem',
								}}
							>
								username
							</code>{' '}
							(not userName). Filter must be URL-encoded: spaces become{' '}
							<code
								style={{
									background: '#F3F4F6',
									padding: '0.125rem 0.25rem',
									borderRadius: '0.25rem',
								}}
							>
								%20
							</code>
							, quotes become{' '}
							<code
								style={{
									background: '#F3F4F6',
									padding: '0.125rem 0.25rem',
									borderRadius: '0.25rem',
								}}
							>
								%22
							</code>
						</p>
					</div>

					<div
						style={{
							background: '#F9FAFB',
							border: '1px solid #E5E7EB',
							borderRadius: '0.5rem',
							padding: '1rem',
							marginBottom: '1rem',
						}}
					>
						<h4 style={{ marginBottom: '0.5rem', color: '#374151', fontSize: '1rem' }}>
							2. Lookup by Email
						</h4>
						<code
							style={{
								display: 'block',
								background: '#FFFFFF',
								padding: '0.75rem',
								borderRadius: '0.375rem',
								fontSize: '0.875rem',
								border: '1px solid #E5E7EB',
								marginTop: '0.5rem',
								whiteSpace: 'pre-wrap',
								wordBreak: 'break-all',
							}}
						>
							GET
							/v1/environments/&#123;envID&#125;/users?filter=email%20eq%20%22cmuir%40pingone.com%22
						</code>
						<p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6B7280' }}>
							<strong>Note:</strong> The @ symbol must be URL-encoded as{' '}
							<code
								style={{
									background: '#F3F4F6',
									padding: '0.125rem 0.25rem',
									borderRadius: '0.25rem',
								}}
							>
								%40
							</code>
							. If multiple users have the same email, the first user is returned.
						</p>
					</div>

					<div
						style={{
							background: '#F9FAFB',
							border: '1px solid #E5E7EB',
							borderRadius: '0.5rem',
							padding: '1rem',
							marginBottom: '1rem',
						}}
					>
						<h4 style={{ marginBottom: '0.5rem', color: '#374151', fontSize: '1rem' }}>
							3. Direct Lookup by User ID
						</h4>
						<code
							style={{
								display: 'block',
								background: '#FFFFFF',
								padding: '0.75rem',
								borderRadius: '0.375rem',
								fontSize: '0.875rem',
								border: '1px solid #E5E7EB',
								marginTop: '0.5rem',
								whiteSpace: 'pre-wrap',
								wordBreak: 'break-all',
							}}
						>
							GET /v1/environments/&#123;envID&#125;/users/5adc497b-dde7-44c6-a003-9b84f8038ff9
						</code>
						<p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6B7280' }}>
							<strong>Fastest method:</strong> Direct ID lookup doesn't require a filter parameter
							and returns a single user immediately.
						</p>
					</div>

					<div
						style={{
							background: '#FEF3C7',
							border: '1px solid #FCD34D',
							borderRadius: '0.5rem',
							padding: '1rem',
							marginBottom: '1rem',
						}}
					>
						<h4 style={{ marginBottom: '0.5rem', color: '#92400E', fontSize: '1rem' }}>
							💡 URL Encoding in JavaScript
						</h4>
						<code
							style={{
								display: 'block',
								background: '#FFFFFF',
								padding: '0.75rem',
								borderRadius: '0.375rem',
								fontSize: '0.875rem',
								border: '1px solid #FCD34D',
								marginTop: '0.5rem',
								whiteSpace: 'pre-wrap',
								wordBreak: 'break-all',
							}}
						>
							{`const filter = 'username eq "curtis7"';
const url = \`/users?filter=\${encodeURIComponent(filter)}\`;
// Result: /users?filter=username%20eq%20%22curtis7%22`}
						</code>
						<p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#92400E' }}>
							Always use{' '}
							<code
								style={{
									background: '#FEF3C7',
									padding: '0.125rem 0.25rem',
									borderRadius: '0.25rem',
								}}
							>
								encodeURIComponent()
							</code>{' '}
							to properly encode filter values.
						</p>
					</div>
				</div>

				<Alert $type="info">
					<FiAlertCircle />
					<div>
						<strong>Filter Syntax (SCIM-style):</strong>
						<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
							PingOne Management API uses SCIM-style filter syntax with GET requests. The format is:{' '}
							<code
								style={{
									background: '#F3F4F6',
									padding: '0.125rem 0.25rem',
									borderRadius: '0.25rem',
								}}
							>
								attribute eq "value"
							</code>
							where{' '}
							<code
								style={{
									background: '#F3F4F6',
									padding: '0.125rem 0.25rem',
									borderRadius: '0.25rem',
								}}
							>
								eq
							</code>{' '}
							means "equals". Values must be enclosed in double quotes and the entire filter must be
							URL-encoded.
						</p>
						<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
							<strong>Supported filter attributes:</strong>{' '}
							<code
								style={{
									background: '#F3F4F6',
									padding: '0.125rem 0.25rem',
									borderRadius: '0.25rem',
								}}
							>
								username
							</code>
							,
							<code
								style={{
									background: '#F3F4F6',
									padding: '0.125rem 0.25rem',
									borderRadius: '0.25rem',
								}}
							>
								email
							</code>
							,
							<code
								style={{
									background: '#F3F4F6',
									padding: '0.125rem 0.25rem',
									borderRadius: '0.25rem',
								}}
							>
								name.given
							</code>
							,
							<code
								style={{
									background: '#F3F4F6',
									padding: '0.125rem 0.25rem',
									borderRadius: '0.25rem',
								}}
							>
								name.family
							</code>
							,
							<code
								style={{
									background: '#F3F4F6',
									padding: '0.125rem 0.25rem',
									borderRadius: '0.25rem',
								}}
							>
								enabled
							</code>
							, and more.
						</p>
					</div>
				</Alert>

				<DocumentationSection>
					<DocumentationLink
						href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#get-read-user-or-users"
						target="_blank"
						rel="noopener noreferrer"
					>
						<FiBook />
						PingOne API: Read User or Users (with SCIM filters)
						<FiExternalLink size={14} />
					</DocumentationLink>
				</DocumentationSection>
			</Card>
		</>
	);
};
