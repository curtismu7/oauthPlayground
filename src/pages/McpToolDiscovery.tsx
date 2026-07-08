// src/pages/McpToolDiscovery.tsx

import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Card, CardBody } from '../components/Card';
import { usePageScroll } from '../hooks/usePageScroll';
import { COLORS } from '../platform/ColorStandards';
import PlatformFlowHeader from '../platform/platformFlowHeaderService';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ToolDef {
	name: string;
	server: string;
	category: string;
	description: string;
	inputParams?: string[];
	readOnly?: boolean;
}

interface ExternalServer {
	name: string;
	description: string;
	url: string;
	author: string;
}

// ─── Tool Catalog ─────────────────────────────────────────────────────────────

const ALL_TOOLS: ToolDef[] = [
	// PingOne Server (70 tools)
	// Auth (5)
	{
		name: 'pingone.auth.login',
		server: 'PingOne',
		category: 'Auth',
		description: 'Authenticate a user via username/password credentials',
		inputParams: ['username', 'password', 'environmentId'],
		readOnly: false,
	},
	{
		name: 'pingone.auth.refresh',
		server: 'PingOne',
		category: 'Auth',
		description: 'Obtain a new access token from a refresh token',
		inputParams: ['refreshToken'],
		readOnly: false,
	},
	{
		name: 'pingone.auth.logout',
		server: 'PingOne',
		category: 'Auth',
		description: 'Revoke an access or refresh token',
		inputParams: ['token'],
		readOnly: false,
	},
	{
		name: 'pingone.auth.userinfo',
		server: 'PingOne',
		category: 'Auth',
		description: 'Retrieve OIDC UserInfo for an access token',
		inputParams: ['accessToken'],
		readOnly: true,
	},
	{
		name: 'pingone.auth.challenge',
		server: 'PingOne',
		category: 'Auth',
		description: 'Initiate a multi-factor authentication challenge',
		inputParams: ['sessionId', 'challengeType'],
		readOnly: false,
	},
	// OIDC (5)
	{
		name: 'pingone_oidc_config',
		server: 'PingOne',
		category: 'OIDC',
		description: 'Get OIDC configuration for the environment',
		inputParams: ['environmentId'],
		readOnly: true,
	},
	{
		name: 'pingone_oidc_discovery',
		server: 'PingOne',
		category: 'OIDC',
		description: 'Fetch the .well-known/openid-configuration document',
		inputParams: ['environmentId', 'region'],
		readOnly: true,
	},
	{
		name: 'pingone_oidc_keys',
		server: 'PingOne',
		category: 'OIDC',
		description: 'Fetch JWKS (JSON Web Key Set) for token verification',
		inputParams: ['environmentId'],
		readOnly: true,
	},
	{
		name: 'pingone_validate_id_token',
		server: 'PingOne',
		category: 'OIDC',
		description: 'Validate an ID token signature and claims',
		inputParams: ['idToken'],
		readOnly: true,
	},
	{
		name: 'pingone_decode_id_token',
		server: 'PingOne',
		category: 'OIDC',
		description: 'Decode (without verification) an ID token',
		inputParams: ['idToken'],
		readOnly: true,
	},
	// Worker & Apps (10)
	{
		name: 'pingone.workerToken.issue',
		server: 'PingOne',
		category: 'Worker & Apps',
		description: 'Exchange client credentials for a worker token',
		inputParams: ['clientId', 'clientSecret', 'scopes'],
		readOnly: false,
	},
	{
		name: 'pingone.applications.list',
		server: 'PingOne',
		category: 'Worker & Apps',
		description: 'List all application registrations in the environment',
		inputParams: ['environmentId', 'filter'],
		readOnly: true,
	},
	{
		name: 'pingone_get_application',
		server: 'PingOne',
		category: 'Worker & Apps',
		description: 'Get an application by ID',
		inputParams: ['environmentId', 'applicationId'],
		readOnly: true,
	},
	{
		name: 'pingone_get_application_resources',
		server: 'PingOne',
		category: 'Worker & Apps',
		description: 'Get resource/scope configuration for an application',
		inputParams: ['environmentId', 'applicationId'],
		readOnly: true,
	},
	{
		name: 'pingone_create_application',
		server: 'PingOne',
		category: 'Worker & Apps',
		description: 'Create a new OAuth application',
		inputParams: ['environmentId', 'name', 'type'],
		readOnly: false,
	},
	{
		name: 'pingone_update_application',
		server: 'PingOne',
		category: 'Worker & Apps',
		description: 'Update application configuration',
		inputParams: ['environmentId', 'applicationId', 'updates'],
		readOnly: false,
	},
	{
		name: 'pingone_delete_application',
		server: 'PingOne',
		category: 'Worker & Apps',
		description: 'Delete an application',
		inputParams: ['environmentId', 'applicationId'],
		readOnly: false,
	},
	{
		name: 'pingone_list_app_secrets',
		server: 'PingOne',
		category: 'Worker & Apps',
		description: 'List secrets for an application',
		inputParams: ['environmentId', 'applicationId'],
		readOnly: true,
	},
	{
		name: 'pingone_create_app_secret',
		server: 'PingOne',
		category: 'Worker & Apps',
		description: 'Create a new application secret',
		inputParams: ['environmentId', 'applicationId'],
		readOnly: false,
	},
	{
		name: 'pingone_rotate_app_secret',
		server: 'PingOne',
		category: 'Worker & Apps',
		description: 'Rotate an application secret',
		inputParams: ['environmentId', 'applicationId', 'secretId'],
		readOnly: false,
	},
	// Users & Population (15)
	{
		name: 'pingone_list_users',
		server: 'PingOne',
		category: 'Users & Population',
		description: 'List users in a population',
		inputParams: ['environmentId', 'populationId', 'filter', 'limit'],
		readOnly: true,
	},
	{
		name: 'pingone_get_user',
		server: 'PingOne',
		category: 'Users & Population',
		description: 'Get user details by ID',
		inputParams: ['environmentId', 'userId'],
		readOnly: true,
	},
	{
		name: 'pingone_create_user',
		server: 'PingOne',
		category: 'Users & Population',
		description: 'Create a new user',
		inputParams: ['environmentId', 'populationId', 'email', 'password'],
		readOnly: false,
	},
	{
		name: 'pingone_update_user',
		server: 'PingOne',
		category: 'Users & Population',
		description: 'Update user attributes',
		inputParams: ['environmentId', 'userId', 'updates'],
		readOnly: false,
	},
	{
		name: 'pingone_delete_user',
		server: 'PingOne',
		category: 'Users & Population',
		description: 'Delete a user',
		inputParams: ['environmentId', 'userId'],
		readOnly: false,
	},
	{
		name: 'pingone_set_user_password',
		server: 'PingOne',
		category: 'Users & Population',
		description: 'Set or reset user password',
		inputParams: ['environmentId', 'userId', 'password'],
		readOnly: false,
	},
	{
		name: 'pingone_verify_user_password',
		server: 'PingOne',
		category: 'Users & Population',
		description: 'Verify a user password without logging in',
		inputParams: ['environmentId', 'userId', 'password'],
		readOnly: true,
	},
	{
		name: 'pingone_list_user_devices',
		server: 'PingOne',
		category: 'Users & Population',
		description: 'List all registered devices for a user',
		inputParams: ['environmentId', 'userId'],
		readOnly: true,
	},
	{
		name: 'pingone_unenroll_device',
		server: 'PingOne',
		category: 'Users & Population',
		description: 'Unenroll a device from a user',
		inputParams: ['environmentId', 'userId', 'deviceId'],
		readOnly: false,
	},
	{
		name: 'pingone_list_user_identities',
		server: 'PingOne',
		category: 'Users & Population',
		description: 'List linked identities for a user',
		inputParams: ['environmentId', 'userId'],
		readOnly: true,
	},
	{
		name: 'pingone_link_user_identity',
		server: 'PingOne',
		category: 'Users & Population',
		description: 'Link an external identity to user',
		inputParams: ['environmentId', 'userId', 'identityProviderId'],
		readOnly: false,
	},
	{
		name: 'pingone_unlink_user_identity',
		server: 'PingOne',
		category: 'Users & Population',
		description: 'Unlink an external identity from user',
		inputParams: ['environmentId', 'userId', 'identityId'],
		readOnly: false,
	},
	{
		name: 'pingone_list_populations',
		server: 'PingOne',
		category: 'Users & Population',
		description: 'List all populations in an environment',
		inputParams: ['environmentId'],
		readOnly: true,
	},
	{
		name: 'pingone_get_population',
		server: 'PingOne',
		category: 'Users & Population',
		description: 'Get population details',
		inputParams: ['environmentId', 'populationId'],
		readOnly: true,
	},
	{
		name: 'pingone_create_population',
		server: 'PingOne',
		category: 'Users & Population',
		description: 'Create a new population',
		inputParams: ['environmentId', 'name', 'description'],
		readOnly: false,
	},
	// MFA & Verification (10)
	{
		name: 'pingone_list_user_mfa_devices',
		server: 'PingOne',
		category: 'MFA & Verification',
		description: 'List MFA devices registered for a user',
		inputParams: ['environmentId', 'userId'],
		readOnly: true,
	},
	{
		name: 'pingone_register_mfa_device',
		server: 'PingOne',
		category: 'MFA & Verification',
		description: 'Register a new MFA device',
		inputParams: ['environmentId', 'userId', 'deviceType'],
		readOnly: false,
	},
	{
		name: 'pingone_verify_otp',
		server: 'PingOne',
		category: 'MFA & Verification',
		description: 'Verify a one-time password',
		inputParams: ['environmentId', 'userId', 'otp'],
		readOnly: true,
	},
	{
		name: 'pingone_send_otp',
		server: 'PingOne',
		category: 'MFA & Verification',
		description: 'Send OTP via email or SMS',
		inputParams: ['environmentId', 'userId', 'deliveryMethod'],
		readOnly: false,
	},
	{
		name: 'pingone_get_device_activation_code',
		server: 'PingOne',
		category: 'MFA & Verification',
		description: 'Get activation code for device enrollment',
		inputParams: ['environmentId', 'userId'],
		readOnly: true,
	},
	{
		name: 'pingone_validate_device_activation',
		server: 'PingOne',
		category: 'MFA & Verification',
		description: 'Validate device activation code',
		inputParams: ['environmentId', 'userId', 'activationCode'],
		readOnly: false,
	},
	{
		name: 'pingone_push_notification_approval',
		server: 'PingOne',
		category: 'MFA & Verification',
		description: 'Approve/deny a push notification approval request',
		inputParams: ['environmentId', 'requestId', 'approved'],
		readOnly: false,
	},
	{
		name: 'pingone_list_push_notifications',
		server: 'PingOne',
		category: 'MFA & Verification',
		description: 'List pending push notifications for a user',
		inputParams: ['environmentId', 'userId'],
		readOnly: true,
	},
	{
		name: 'pingone_backup_codes_generate',
		server: 'PingOne',
		category: 'MFA & Verification',
		description: 'Generate backup codes for a user',
		inputParams: ['environmentId', 'userId'],
		readOnly: false,
	},
	{
		name: 'pingone_backup_codes_list',
		server: 'PingOne',
		category: 'MFA & Verification',
		description: 'List remaining backup codes for a user',
		inputParams: ['environmentId', 'userId'],
		readOnly: true,
	},
	// Policies & Rules (10)
	{
		name: 'pingone_list_sign_on_policies',
		server: 'PingOne',
		category: 'Policies & Rules',
		description: 'List sign-on policies for an environment',
		inputParams: ['environmentId'],
		readOnly: true,
	},
	{
		name: 'pingone_get_sign_on_policy',
		server: 'PingOne',
		category: 'Policies & Rules',
		description: 'Get details of a sign-on policy',
		inputParams: ['environmentId', 'policyId'],
		readOnly: true,
	},
	{
		name: 'pingone_create_sign_on_policy',
		server: 'PingOne',
		category: 'Policies & Rules',
		description: 'Create a new sign-on policy',
		inputParams: ['environmentId', 'name', 'rules'],
		readOnly: false,
	},
	{
		name: 'pingone_update_sign_on_policy',
		server: 'PingOne',
		category: 'Policies & Rules',
		description: 'Update a sign-on policy',
		inputParams: ['environmentId', 'policyId', 'updates'],
		readOnly: false,
	},
	{
		name: 'pingone_delete_sign_on_policy',
		server: 'PingOne',
		category: 'Policies & Rules',
		description: 'Delete a sign-on policy',
		inputParams: ['environmentId', 'policyId'],
		readOnly: false,
	},
	{
		name: 'pingone_list_password_policies',
		server: 'PingOne',
		category: 'Policies & Rules',
		description: 'List password policies for an environment',
		inputParams: ['environmentId'],
		readOnly: true,
	},
	{
		name: 'pingone_get_password_policy',
		server: 'PingOne',
		category: 'Policies & Rules',
		description: 'Get details of a password policy',
		inputParams: ['environmentId', 'policyId'],
		readOnly: true,
	},
	{
		name: 'pingone_update_password_policy',
		server: 'PingOne',
		category: 'Policies & Rules',
		description: 'Update a password policy',
		inputParams: ['environmentId', 'policyId', 'updates'],
		readOnly: false,
	},
	{
		name: 'pingone_list_mfa_policies',
		server: 'PingOne',
		category: 'Policies & Rules',
		description: 'List MFA policies for an environment',
		inputParams: ['environmentId'],
		readOnly: true,
	},
	{
		name: 'pingone_get_mfa_policy',
		server: 'PingOne',
		category: 'Policies & Rules',
		description: 'Get details of an MFA policy',
		inputParams: ['environmentId', 'policyId'],
		readOnly: true,
	},
	// Attributes & Resources (8)
	{
		name: 'pingone_list_custom_attributes',
		server: 'PingOne',
		category: 'Attributes & Resources',
		description: 'List custom user attributes in a population',
		inputParams: ['environmentId', 'populationId'],
		readOnly: true,
	},
	{
		name: 'pingone_create_custom_attribute',
		server: 'PingOne',
		category: 'Attributes & Resources',
		description: 'Create a custom user attribute',
		inputParams: ['environmentId', 'populationId', 'name', 'type'],
		readOnly: false,
	},
	{
		name: 'pingone_update_custom_attribute',
		server: 'PingOne',
		category: 'Attributes & Resources',
		description: 'Update a custom attribute definition',
		inputParams: ['environmentId', 'populationId', 'attributeId', 'updates'],
		readOnly: false,
	},
	{
		name: 'pingone_list_resources',
		server: 'PingOne',
		category: 'Attributes & Resources',
		description: 'List resource servers in an environment',
		inputParams: ['environmentId'],
		readOnly: true,
	},
	{
		name: 'pingone_get_resource',
		server: 'PingOne',
		category: 'Attributes & Resources',
		description: 'Get resource server details',
		inputParams: ['environmentId', 'resourceId'],
		readOnly: true,
	},
	{
		name: 'pingone_create_resource',
		server: 'PingOne',
		category: 'Attributes & Resources',
		description: 'Create a new resource server',
		inputParams: ['environmentId', 'name', 'scopes'],
		readOnly: false,
	},
	{
		name: 'pingone_list_resource_scopes',
		server: 'PingOne',
		category: 'Attributes & Resources',
		description: 'List scopes for a resource server',
		inputParams: ['environmentId', 'resourceId'],
		readOnly: true,
	},
	{
		name: 'pingone_add_resource_scope',
		server: 'PingOne',
		category: 'Attributes & Resources',
		description: 'Add a new scope to a resource server',
		inputParams: ['environmentId', 'resourceId', 'name', 'description'],
		readOnly: false,
	},
	// Webhooks & Events (7)
	{
		name: 'pingone_list_webhooks',
		server: 'PingOne',
		category: 'Webhooks & Events',
		description: 'List webhooks configured for an environment',
		inputParams: ['environmentId'],
		readOnly: true,
	},
	{
		name: 'pingone_create_webhook',
		server: 'PingOne',
		category: 'Webhooks & Events',
		description: 'Create a new webhook',
		inputParams: ['environmentId', 'url', 'events'],
		readOnly: false,
	},
	{
		name: 'pingone_update_webhook',
		server: 'PingOne',
		category: 'Webhooks & Events',
		description: 'Update webhook configuration',
		inputParams: ['environmentId', 'webhookId', 'updates'],
		readOnly: false,
	},
	{
		name: 'pingone_delete_webhook',
		server: 'PingOne',
		category: 'Webhooks & Events',
		description: 'Delete a webhook',
		inputParams: ['environmentId', 'webhookId'],
		readOnly: false,
	},
	{
		name: 'pingone_test_webhook',
		server: 'PingOne',
		category: 'Webhooks & Events',
		description: 'Send a test event to a webhook',
		inputParams: ['environmentId', 'webhookId'],
		readOnly: false,
	},
	{
		name: 'pingone_list_events',
		server: 'PingOne',
		category: 'Webhooks & Events',
		description: 'List recent audit events',
		inputParams: ['environmentId', 'limit', 'filter'],
		readOnly: true,
	},
	{
		name: 'pingone_get_event',
		server: 'PingOne',
		category: 'Webhooks & Events',
		description: 'Get details of a specific audit event',
		inputParams: ['environmentId', 'eventId'],
		readOnly: true,
	},

	// Memory Server (6 tools)
	{
		name: 'memory.create',
		server: 'Memory',
		category: 'Memory Operations',
		description: 'Create a new memory entry',
		inputParams: ['key', 'value'],
		readOnly: false,
	},
	{
		name: 'memory.read',
		server: 'Memory',
		category: 'Memory Operations',
		description: 'Read a memory entry by key',
		inputParams: ['key'],
		readOnly: true,
	},
	{
		name: 'memory.update',
		server: 'Memory',
		category: 'Memory Operations',
		description: 'Update an existing memory entry',
		inputParams: ['key', 'value'],
		readOnly: false,
	},
	{
		name: 'memory.delete',
		server: 'Memory',
		category: 'Memory Operations',
		description: 'Delete a memory entry',
		inputParams: ['key'],
		readOnly: false,
	},
	{
		name: 'memory.list',
		server: 'Memory',
		category: 'Memory Operations',
		description: 'List all memory entries',
		inputParams: [],
		readOnly: true,
	},
	{
		name: 'memory.clear',
		server: 'Memory',
		category: 'Memory Operations',
		description: 'Clear all memory entries',
		inputParams: [],
		readOnly: false,
	},

	// Filesystem Server (11 tools)
	{
		name: 'fs.read_file',
		server: 'Filesystem',
		category: 'File Operations',
		description: 'Read the contents of a file',
		inputParams: ['path'],
		readOnly: true,
	},
	{
		name: 'fs.write_file',
		server: 'Filesystem',
		category: 'File Operations',
		description: 'Write or overwrite a file',
		inputParams: ['path', 'content'],
		readOnly: false,
	},
	{
		name: 'fs.append_file',
		server: 'Filesystem',
		category: 'File Operations',
		description: 'Append content to a file',
		inputParams: ['path', 'content'],
		readOnly: false,
	},
	{
		name: 'fs.delete_file',
		server: 'Filesystem',
		category: 'File Operations',
		description: 'Delete a file',
		inputParams: ['path'],
		readOnly: false,
	},
	{
		name: 'fs.list_directory',
		server: 'Filesystem',
		category: 'File Operations',
		description: 'List files and directories in a path',
		inputParams: ['path'],
		readOnly: true,
	},
	{
		name: 'fs.create_directory',
		server: 'Filesystem',
		category: 'File Operations',
		description: 'Create a new directory',
		inputParams: ['path'],
		readOnly: false,
	},
	{
		name: 'fs.copy_file',
		server: 'Filesystem',
		category: 'File Operations',
		description: 'Copy a file to a new location',
		inputParams: ['source', 'destination'],
		readOnly: false,
	},
	{
		name: 'fs.move_file',
		server: 'Filesystem',
		category: 'File Operations',
		description: 'Move or rename a file',
		inputParams: ['source', 'destination'],
		readOnly: false,
	},
	{
		name: 'fs.get_file_info',
		server: 'Filesystem',
		category: 'File Operations',
		description: 'Get metadata about a file',
		inputParams: ['path'],
		readOnly: true,
	},
	{
		name: 'fs.search_files',
		server: 'Filesystem',
		category: 'File Operations',
		description: 'Search for files matching a pattern',
		inputParams: ['pattern', 'path'],
		readOnly: true,
	},
	{
		name: 'fs.file_permissions',
		server: 'Filesystem',
		category: 'File Operations',
		description: 'Get or set file permissions',
		inputParams: ['path', 'mode'],
		readOnly: false,
	},

	// Fetch Server (9 tools)
	{
		name: 'fetch.get',
		server: 'Fetch',
		category: 'HTTP Requests',
		description: 'Perform an HTTP GET request',
		inputParams: ['url', 'headers'],
		readOnly: true,
	},
	{
		name: 'fetch.post',
		server: 'Fetch',
		category: 'HTTP Requests',
		description: 'Perform an HTTP POST request',
		inputParams: ['url', 'body', 'headers'],
		readOnly: false,
	},
	{
		name: 'fetch.put',
		server: 'Fetch',
		category: 'HTTP Requests',
		description: 'Perform an HTTP PUT request',
		inputParams: ['url', 'body', 'headers'],
		readOnly: false,
	},
	{
		name: 'fetch.delete',
		server: 'Fetch',
		category: 'HTTP Requests',
		description: 'Perform an HTTP DELETE request',
		inputParams: ['url', 'headers'],
		readOnly: false,
	},
	{
		name: 'fetch.patch',
		server: 'Fetch',
		category: 'HTTP Requests',
		description: 'Perform an HTTP PATCH request',
		inputParams: ['url', 'body', 'headers'],
		readOnly: false,
	},
	{
		name: 'fetch.head',
		server: 'Fetch',
		category: 'HTTP Requests',
		description: 'Perform an HTTP HEAD request',
		inputParams: ['url', 'headers'],
		readOnly: true,
	},
	{
		name: 'fetch.download',
		server: 'Fetch',
		category: 'HTTP Requests',
		description: 'Download a file from a URL',
		inputParams: ['url', 'destination'],
		readOnly: true,
	},
	{
		name: 'fetch.json',
		server: 'Fetch',
		category: 'HTTP Requests',
		description: 'Fetch and parse JSON from a URL',
		inputParams: ['url', 'headers'],
		readOnly: true,
	},
	{
		name: 'fetch.query_params',
		server: 'Fetch',
		category: 'HTTP Requests',
		description: 'Build and encode URL query parameters',
		inputParams: ['params'],
		readOnly: true,
	},

	// JWT Verifier (5 tools - stub)
	{
		name: 'jwt.verify',
		server: 'JWT Verifier',
		category: 'JWT Operations',
		description: 'Verify a JWT signature using a key or JWKS',
		inputParams: ['token', 'publicKey', 'algorithms'],
		readOnly: true,
	},
	{
		name: 'jwt.decode',
		server: 'JWT Verifier',
		category: 'JWT Operations',
		description: 'Decode a JWT without verification',
		inputParams: ['token'],
		readOnly: true,
	},
	{
		name: 'jwt.validate_claims',
		server: 'JWT Verifier',
		category: 'JWT Operations',
		description: 'Validate JWT claims (exp, iat, aud, iss)',
		inputParams: ['token', 'expectedIssuer', 'expectedAudience'],
		readOnly: true,
	},
	{
		name: 'jwt.get_header',
		server: 'JWT Verifier',
		category: 'JWT Operations',
		description: 'Extract JWT header (alg, kid, etc)',
		inputParams: ['token'],
		readOnly: true,
	},
	{
		name: 'jwt.get_payload',
		server: 'JWT Verifier',
		category: 'JWT Operations',
		description: 'Extract JWT payload claims',
		inputParams: ['token'],
		readOnly: true,
	},

	// OAuth Simulator (6 tools - stub)
	{
		name: 'oauth.authorization_endpoint',
		server: 'OAuth Simulator',
		category: 'OAuth Flow Simulation',
		description: 'Simulate OAuth authorization endpoint',
		inputParams: ['client_id', 'redirect_uri', 'scope', 'state'],
		readOnly: true,
	},
	{
		name: 'oauth.token_endpoint',
		server: 'OAuth Simulator',
		category: 'OAuth Flow Simulation',
		description: 'Simulate OAuth token endpoint',
		inputParams: ['grant_type', 'code', 'client_id', 'client_secret'],
		readOnly: true,
	},
	{
		name: 'oauth.userinfo_endpoint',
		server: 'OAuth Simulator',
		category: 'OAuth Flow Simulation',
		description: 'Simulate userinfo endpoint',
		inputParams: ['access_token'],
		readOnly: true,
	},
	{
		name: 'oauth.revoke_endpoint',
		server: 'OAuth Simulator',
		category: 'OAuth Flow Simulation',
		description: 'Simulate token revocation',
		inputParams: ['token'],
		readOnly: false,
	},
	{
		name: 'oauth.introspect_endpoint',
		server: 'OAuth Simulator',
		category: 'OAuth Flow Simulation',
		description: 'Simulate token introspection',
		inputParams: ['token'],
		readOnly: true,
	},
	{
		name: 'oauth.jwks_endpoint',
		server: 'OAuth Simulator',
		category: 'OAuth Flow Simulation',
		description: 'Simulate JWKS endpoint for token signing keys',
		inputParams: [],
		readOnly: true,
	},

	// Security & Compliance (6 tools - stub)
	{
		name: 'security.scan_jwt',
		server: 'Security & Compliance',
		category: 'Security Analysis',
		description: 'Scan JWT for security vulnerabilities',
		inputParams: ['token'],
		readOnly: true,
	},
	{
		name: 'security.check_oauth_config',
		server: 'Security & Compliance',
		category: 'Security Analysis',
		description: 'Check OAuth configuration for best practices',
		inputParams: ['configuration'],
		readOnly: true,
	},
	{
		name: 'security.validate_redirect_uri',
		server: 'Security & Compliance',
		category: 'Security Analysis',
		description: 'Validate redirect URI against IETF specifications',
		inputParams: ['uri'],
		readOnly: true,
	},
	{
		name: 'security.check_pkce',
		server: 'Security & Compliance',
		category: 'Security Analysis',
		description: 'Verify PKCE implementation',
		inputParams: ['code_challenge', 'code_verifier'],
		readOnly: true,
	},
	{
		name: 'security.audit_token_claims',
		server: 'Security & Compliance',
		category: 'Security Analysis',
		description: 'Audit token claims for compliance',
		inputParams: ['token', 'policy'],
		readOnly: true,
	},
	{
		name: 'security.generate_secure_string',
		server: 'Security & Compliance',
		category: 'Security Analysis',
		description: 'Generate cryptographically secure random string',
		inputParams: ['length', 'charset'],
		readOnly: true,
	},
	// OAuth/OIDC Server — provider-agnostic flows (18 tools)
	{
		name: 'oauth_discover',
		server: 'OAuth/OIDC',
		category: 'Discovery',
		description: 'Resolve OAuth/OIDC endpoints via OIDC discovery, PingOne preset, or explicit overrides',
		inputParams: ['issuerUrl', 'pingoneEnvironmentId', 'pingoneRegion'],
		readOnly: true,
	},
	{
		name: 'oauth_decode_jwt',
		server: 'OAuth/OIDC',
		category: 'Token Utils',
		description: 'Decode a JWT header and payload without signature verification',
		inputParams: ['token'],
		readOnly: true,
	},
	{
		name: 'oauth_verify_jwt',
		server: 'OAuth/OIDC',
		category: 'Token Utils',
		description: 'Verify a JWT signature against a JWKS endpoint',
		inputParams: ['token', 'jwksUri', 'issuer', 'audience'],
		readOnly: true,
	},
	{
		name: 'oauth_password_grant',
		server: 'OAuth/OIDC',
		category: 'Grant',
		description: 'Resource Owner Password Credentials grant (RFC 6749 §4.3)',
		inputParams: ['username', 'password', 'scope'],
		readOnly: false,
	},
	{
		name: 'oauth_refresh_token',
		server: 'OAuth/OIDC',
		category: 'Grant',
		description: 'Exchange a refresh token for a new access token (RFC 6749 §6)',
		inputParams: ['refreshToken', 'scope'],
		readOnly: false,
	},
	{
		name: 'oauth_client_credentials',
		server: 'OAuth/OIDC',
		category: 'Grant',
		description: 'Machine-to-machine client credentials grant (RFC 6749 §4.4)',
		inputParams: ['scope', 'audience', 'resource'],
		readOnly: false,
	},
	{
		name: 'oauth_build_authorization_url',
		server: 'OAuth/OIDC',
		category: 'Authorization Code',
		description: 'Build an authorization URL with PKCE (RFC 6749 §4.1.1 / RFC 7636)',
		inputParams: ['clientId', 'redirectUri', 'scope', 'state'],
		readOnly: true,
	},
	{
		name: 'oauth_exchange_authorization_code',
		server: 'OAuth/OIDC',
		category: 'Authorization Code',
		description: 'Exchange an authorization code for tokens (RFC 6749 §4.1.3)',
		inputParams: ['code', 'redirectUri', 'codeVerifier'],
		readOnly: false,
	},
	{
		name: 'oauth_token_exchange',
		server: 'OAuth/OIDC',
		category: 'Token Exchange',
		description: 'RFC 8693 token exchange: subject/actor tokens to a delegated token with act claim',
		inputParams: ['subjectToken', 'actorToken', 'audience', 'scope'],
		readOnly: false,
	},
	{
		name: 'oauth_device_authorization',
		server: 'OAuth/OIDC',
		category: 'Device',
		description: 'Start the device authorization flow (RFC 8628)',
		inputParams: ['scope'],
		readOnly: false,
	},
	{
		name: 'oauth_poll_device_token',
		server: 'OAuth/OIDC',
		category: 'Device',
		description: 'Poll for the device flow access token (RFC 8628 §3.4)',
		inputParams: ['deviceCode'],
		readOnly: false,
	},
	{
		name: 'oauth_backchannel_authentication',
		server: 'OAuth/OIDC',
		category: 'CIBA',
		description: 'Initiate CIBA backchannel authentication (OpenID Connect CIBA)',
		inputParams: ['scope', 'loginHint', 'bindingMessage'],
		readOnly: false,
	},
	{
		name: 'oauth_poll_ciba_token',
		server: 'OAuth/OIDC',
		category: 'CIBA',
		description: 'Poll for the CIBA token using auth_req_id',
		inputParams: ['authReqId'],
		readOnly: false,
	},
	{
		name: 'oauth_pushed_authorization_request',
		server: 'OAuth/OIDC',
		category: 'PAR',
		description: 'Pushed Authorization Request, returns request_uri (RFC 9126)',
		inputParams: ['redirectUri', 'scope', 'codeChallenge'],
		readOnly: false,
	},
	{
		name: 'oauth_generate_dpop_proof',
		server: 'OAuth/OIDC',
		category: 'DPoP',
		description: 'Generate a DPoP proof JWT binding a request to a key (RFC 9449)',
		inputParams: ['htm', 'htu', 'accessToken'],
		readOnly: true,
	},
	{
		name: 'oauth_introspect_token',
		server: 'OAuth/OIDC',
		category: 'Token Lifecycle',
		description: 'Introspect a token active status and claims (RFC 7662)',
		inputParams: ['token', 'tokenTypeHint'],
		readOnly: true,
	},
	{
		name: 'oauth_revoke_token',
		server: 'OAuth/OIDC',
		category: 'Token Lifecycle',
		description: 'Revoke an access or refresh token (RFC 7009)',
		inputParams: ['token', 'tokenTypeHint'],
		readOnly: false,
	},
	{
		name: 'oauth_userinfo',
		server: 'OAuth/OIDC',
		category: 'OIDC',
		description: 'Fetch OIDC UserInfo claims for an access token',
		inputParams: ['accessToken'],
		readOnly: true,
	},
];

const EXTERNAL_SERVERS: ExternalServer[] = [
	{
		name: 'johnidm/mcp-auth-oidc',
		description: 'OIDC provider implementation for MCP authentication flows',
		url: 'https://github.com/johnidm/mcp-auth-oidc',
		author: 'johnidm',
	},
	{
		name: 'NapthaAI/http-oauth-mcp-server',
		description: 'HTTP client with OAuth 2.0 support for MCP',
		url: 'https://github.com/NapthaAI/http-oauth-mcp-server',
		author: 'NapthaAI',
	},
	{
		name: 'giantswarm/mcp-oauth',
		description: 'OAuth 2.0 integration tools for MCP servers',
		url: 'https://github.com/giantswarm/mcp-oauth',
		author: 'Giant Swarm',
	},
	{
		name: 'modelcontextprotocol/servers/postgres',
		description: 'PostgreSQL database interaction through MCP',
		url: 'https://github.com/modelcontextprotocol/servers',
		author: 'Model Context Protocol',
	},
	{
		name: 'modelcontextprotocol/servers/sqlite',
		description: 'SQLite database interaction through MCP',
		url: 'https://github.com/modelcontextprotocol/servers',
		author: 'Model Context Protocol',
	},
	{
		name: 'modelcontextprotocol/servers/github',
		description: 'GitHub API access through MCP',
		url: 'https://github.com/modelcontextprotocol/servers',
		author: 'Model Context Protocol',
	},
];

// ─── Styled Components ─────────────────────────────────────────────────────────

const Container = styled.div`
	max-width: 90rem;
	margin: 0 auto;
	padding: 1.5rem;
`;

const SearchContainer = styled.div`
	display: flex;
	gap: 1rem;
	margin-bottom: 2rem;
	flex-wrap: wrap;
`;

const SearchInput = styled.input`
	flex: 1;
	min-width: 200px;
	padding: 0.75rem;
	border: 1px solid ${COLORS.BORDER.GRAY};
	border-radius: 0.375rem;
	font-size: 0.875rem;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: ${COLORS.PRIMARY.BLUE};
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const FilterButtons = styled.div`
	display: flex;
	gap: 0.5rem;
	flex-wrap: wrap;
	margin-bottom: 2rem;
`;

const FilterButton = styled.button<{ $active: boolean }>`
	padding: 0.5rem 1rem;
	border: 1px solid ${({ $active }) => ($active ? COLORS.PRIMARY.BLUE : COLORS.BORDER.GRAY)};
	background-color: ${({ $active }) => ($active ? COLORS.PRIMARY.BLUE : 'white')};
	color: ${({ $active }) => ($active ? 'white' : COLORS.TEXT.GRAY_DARK)};
	border-radius: 0.375rem;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		border-color: ${COLORS.PRIMARY.BLUE};
		background-color: ${({ $active }) => ($active ? COLORS.PRIMARY.BLUE_DARK : COLORS.BG.GRAY_LIGHT)};
	}
`;

const StatsText = styled.div`
	font-size: 0.875rem;
	color: ${COLORS.TEXT.GRAY_MEDIUM};
	margin-bottom: 1.5rem;
`;

const ToolGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
	gap: 1rem;
	margin-bottom: 3rem;
`;

const ToolCard = styled.div`
	background: white;
	padding: 1rem;
	border-radius: 0.375rem;
	border: 1px solid ${COLORS.BORDER.GRAY_LIGHT};
	transition: all 0.2s;

	&:hover {
		border-color: ${COLORS.BORDER.INFO};
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	}
`;

const ToolName = styled.div`
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	font-weight: 600;
	color: ${COLORS.PRIMARY.BLUE};
	margin-bottom: 0.5rem;
	word-break: break-word;
`;

const ToolServer = styled.span<{ $server: string }>`
	display: inline-block;
	padding: 0.25rem 0.75rem;
	background: ${({ $server }) => {
		switch ($server) {
			case 'PingOne':
				return '#e0f2fe';
			case 'Memory':
				return '#f0fdf4';
			case 'Filesystem':
				return '#fef3c7';
			case 'Fetch':
				return '#f3e8ff';
			case 'JWT Verifier':
				return '#fee2e2';
			case 'OAuth Simulator':
				return '#fce7f3';
			case 'Security & Compliance':
				return '#ecfdf5';
			default:
				return COLORS.BG.GRAY_LIGHT;
		}
	}};
	color: ${({ $server }) => {
		switch ($server) {
			case 'PingOne':
				return '#0369a1';
			case 'Memory':
				return '#15803d';
			case 'Filesystem':
				return '#b45309';
			case 'Fetch':
				return '#7c3aed';
			case 'JWT Verifier':
				return '#991b1b';
			case 'OAuth Simulator':
				return '#be185d';
			case 'Security & Compliance':
				return '#065f46';
			default:
				return COLORS.TEXT.GRAY_DARK;
		}
	}};
	border-radius: 0.25rem;
	font-size: 0.65rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	margin-right: 0.5rem;
	margin-bottom: 0.5rem;
`;

const ToolCategory = styled.span`
	display: inline-block;
	padding: 0.125rem 0.5rem;
	background: ${COLORS.BG.INFO_LIGHT};
	color: ${COLORS.TEXT.INFO};
	border-radius: 0.25rem;
	font-size: 0.65rem;
	font-weight: 600;
	margin-bottom: 0.5rem;
`;

const ToolDescription = styled.div`
	font-size: 0.875rem;
	color: ${COLORS.TEXT.GRAY_MEDIUM};
	line-height: 1.4;
	margin-bottom: 0.75rem;
`;

const ToolMeta = styled.div`
	display: flex;
	gap: 0.5rem;
	flex-wrap: wrap;
	font-size: 0.75rem;
	color: ${COLORS.TEXT.GRAY_MEDIUM};
`;

const ParamPill = styled.span`
	background: ${COLORS.BG.GRAY_LIGHT};
	padding: 0.25rem 0.5rem;
	border-radius: 0.25rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

const ExternalSection = styled.div`
	margin-top: 3rem;
	padding-top: 2rem;
	border-top: 2px solid ${COLORS.BORDER.GRAY};
`;

const ExternalTitle = styled.h3`
	margin: 0 0 1.5rem 0;
	font-size: 1.25rem;
	font-weight: 600;
	color: ${COLORS.TEXT.GRAY_DARK};
`;

const ExternalGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: 1rem;
`;

const ExternalCard = styled.a`
	display: block;
	padding: 1rem;
	background: white;
	border: 1px solid ${COLORS.BORDER.GRAY_LIGHT};
	border-radius: 0.375rem;
	text-decoration: none;
	color: inherit;
	transition: all 0.2s;

	&:hover {
		border-color: ${COLORS.BORDER.INFO};
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	}
`;

const ExternalName = styled.div`
	font-weight: 600;
	color: ${COLORS.PRIMARY.BLUE};
	margin-bottom: 0.5rem;
	word-break: break-word;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
`;

const ExternalAuthor = styled.div`
	font-size: 0.75rem;
	color: ${COLORS.TEXT.GRAY_MEDIUM};
	margin-bottom: 0.5rem;
`;

const ExternalDescription = styled.div`
	font-size: 0.875rem;
	color: ${COLORS.TEXT.GRAY_MEDIUM};
	line-height: 1.4;
`;

// ─── Component ─────────────────────────────────────────────────────────────

const McpToolDiscovery: React.FC = () => {
	usePageScroll();

	const [searchText, setSearchText] = useState('');
	const [selectedServer, setSelectedServer] = useState<string>('All');

	const servers = useMemo(() => {
		const serverSet = new Set(ALL_TOOLS.map((t) => t.server));
		return ['All', ...Array.from(serverSet).sort()];
	}, []);

	const filteredTools = useMemo(() => {
		return ALL_TOOLS.filter((tool) => {
			const matchesServer = selectedServer === 'All' || tool.server === selectedServer;
			const matchesSearch =
				searchText === '' ||
				tool.name.toLowerCase().includes(searchText.toLowerCase()) ||
				tool.description.toLowerCase().includes(searchText.toLowerCase()) ||
				tool.category.toLowerCase().includes(searchText.toLowerCase());
			return matchesServer && matchesSearch;
		});
	}, [searchText, selectedServer]);

	const toolsByServer = useMemo(() => {
		const grouped: Record<string, ToolDef[]> = {};
		filteredTools.forEach((tool) => {
			if (!grouped[tool.server]) grouped[tool.server] = [];
			grouped[tool.server].push(tool);
		});
		return grouped;
	}, [filteredTools]);

	return (
		<Container>
			<PlatformFlowHeader flowId="mcp-tool-discovery" />

			<Card>
				<CardBody>
					<h2 style={{ margin: '0 0 1.5rem 0', color: COLORS.TEXT.GRAY_DARK }}>
						MCP Tool Discovery
					</h2>
					<p style={{ fontSize: '0.875rem', color: COLORS.TEXT.GRAY_MEDIUM, marginBottom: '2rem' }}>
						Explore all available MCP tools across multiple servers. Filter by server, search by name or
						description, and discover tool capabilities.
					</p>

					<SearchContainer>
						<SearchInput
							type="text"
							placeholder="Search tools by name, category, or description..."
							value={searchText}
							onChange={(e) => setSearchText(e.target.value)}
						/>
					</SearchContainer>

					<div style={{ marginBottom: '1.5rem' }}>
						<div style={{ fontSize: '0.875rem', color: COLORS.TEXT.GRAY_MEDIUM, marginBottom: '0.75rem' }}>
							Filter by Server:
						</div>
						<FilterButtons>
							{servers.map((server) => (
								<FilterButton
									key={server}
									$active={selectedServer === server}
									onClick={() => setSelectedServer(server)}
								>
									{server}
								</FilterButton>
							))}
						</FilterButtons>
					</div>

					<StatsText>
						Showing {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''} from{' '}
						{Object.keys(toolsByServer).length} server{Object.keys(toolsByServer).length !== 1 ? 's' : ''}
					</StatsText>

					{Object.entries(toolsByServer).map(([server, tools]) => (
						<div key={server} style={{ marginBottom: '2.5rem' }}>
							<h3 style={{ margin: '0 0 1rem 0', color: COLORS.TEXT.GRAY_DARK, fontSize: '1rem' }}>
								{server} ({tools.length})
							</h3>
							<ToolGrid>
								{tools.map((tool) => (
									<ToolCard key={tool.name}>
										<div style={{ marginBottom: '0.5rem' }}>
											<ToolServer $server={tool.server}>{tool.server}</ToolServer>
											<ToolCategory>{tool.category}</ToolCategory>
										</div>
										<ToolName>{tool.name}</ToolName>
										<ToolDescription>{tool.description}</ToolDescription>
										{tool.inputParams && tool.inputParams.length > 0 && (
											<ToolMeta>
												{tool.inputParams.map((param) => (
													<ParamPill key={param}>{param}</ParamPill>
												))}
											</ToolMeta>
										)}
										{tool.readOnly !== undefined && (
											<ToolMeta style={{ marginTop: '0.5rem' }}>
												<span>{tool.readOnly ? ' Read-only' : '✏️ Modifying'}</span>
											</ToolMeta>
										)}
									</ToolCard>
								))}
							</ToolGrid>
						</div>
					))}

					<ExternalSection>
						<ExternalTitle>External MCP Servers</ExternalTitle>
						<ExternalGrid>
							{EXTERNAL_SERVERS.map((server) => (
								<ExternalCard key={server.name} href={server.url} target="_blank" rel="noopener noreferrer">
									<ExternalName>{server.name}</ExternalName>
									<ExternalAuthor>By {server.author}</ExternalAuthor>
									<ExternalDescription>{server.description}</ExternalDescription>
								</ExternalCard>
							))}
						</ExternalGrid>
					</ExternalSection>
				</CardBody>
			</Card>
		</Container>
	);
};

export default McpToolDiscovery;
