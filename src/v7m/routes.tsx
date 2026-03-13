// src/v7m/routes.tsx
// Route definitions for V7M flows (V9-compliant). Consumer should import and mount these under a
// "Mock OAuth and OIDC flows" menu group.
// NOTE: Canonical routes are under /flows/*-v9; flows and services live in pages/flows/v9 and services/v9/mock.
import React from 'react';
import { V7MClientCredentialsV9 } from '../pages/flows/v9/V7MClientCredentialsV9';
import { V7MDeviceAuthorizationV9 } from '../pages/flows/v9/V7MDeviceAuthorizationV9';
import { V7MImplicitFlowV9 } from '../pages/flows/v9/V7MImplicitFlowV9';
import { V7MOAuthAuthCodeV9 } from '../pages/flows/v9/V7MOAuthAuthCodeV9';
import { V7MROPCV9 } from '../pages/flows/v9/V7MROPCV9';

export type V7MRoute = {
	path: string;
	title: string;
	element: React.ReactElement;
	menuGroup: 'Mock OAuth and OIDC flows';
};

export const V7M_ROUTES: V7MRoute[] = [
	{
		path: '/flows/oauth-authorization-code-v9',
		title: 'V7M OAuth Authorization Code',
		element: <V7MOAuthAuthCodeV9 oidc={false} title="V7M OAuth Authorization Code" />,
		menuGroup: 'Mock OAuth and OIDC flows',
	},
	{
		path: '/flows/oidc-authorization-code-v9',
		title: 'V7M OIDC Authorization Code',
		element: <V7MOAuthAuthCodeV9 oidc={true} title="V7M OIDC Authorization Code" />,
		menuGroup: 'Mock OAuth and OIDC flows',
	},
	{
		path: '/flows/device-authorization-v9',
		title: 'V7M Device Authorization',
		element: <V7MDeviceAuthorizationV9 />,
		menuGroup: 'Mock OAuth and OIDC flows',
	},
	{
		path: '/flows/client-credentials-v9',
		title: 'V7M Client Credentials',
		element: <V7MClientCredentialsV9 />,
		menuGroup: 'Mock OAuth and OIDC flows',
	},
	{
		path: '/flows/implicit-v9',
		title: 'V7M OAuth Implicit Flow',
		element: <V7MImplicitFlowV9 oidc={false} title="V7M OAuth Implicit Flow" />,
		menuGroup: 'Mock OAuth and OIDC flows',
	},
	{
		path: '/flows/oidc-implicit-v9',
		title: 'V7M OIDC Implicit Flow',
		element: <V7MImplicitFlowV9 oidc={true} title="V7M OIDC Implicit Flow" />,
		menuGroup: 'Mock OAuth and OIDC flows',
	},
	{
		path: '/flows/oauth-ropc-v9',
		title: 'V7M Resource Owner Password Credentials',
		element: <V7MROPCV9 oidc={false} title="V7M Resource Owner Password Credentials" />,
		menuGroup: 'Mock OAuth and OIDC flows',
	},
	{
		path: '/flows/oidc-ropc-v9',
		title: 'V7M OIDC Resource Owner Password Credentials',
		element: <V7MROPCV9 oidc={true} title="V7M OIDC Resource Owner Password Credentials" />,
		menuGroup: 'Mock OAuth and OIDC flows',
	},
];
