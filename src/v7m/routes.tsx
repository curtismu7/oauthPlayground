// src/v7m/routes.tsx
// Route definitions for V7M flows (V9-compliant). Consumer should import and mount these under a
// "Mock OAuth and OIDC flows" menu group.
// NOTE: Active routes are registered in App.tsx under /v7/* paths. This file is a reference manifest.
import React from 'react';
import V7MClientCredentialsV9 from '../v7/pages/V7MClientCredentialsV9';
import V7MDeviceAuthorizationV9 from '../v7/pages/V7MDeviceAuthorizationV9';
import V7MImplicitFlowV9 from '../v7/pages/V7MImplicitFlowV9';
import V7MOAuthAuthCodeV9 from '../v7/pages/V7MOAuthAuthCodeV9';
import V7MROPCV9 from '../v7/pages/V7MROPCV9';

export type V7MRoute = {
	path: string;
	title: string;
	element: React.ReactElement;
	menuGroup: 'Mock OAuth and OIDC flows';
};

export const V7M_ROUTES: V7MRoute[] = [
	{
		path: '/v7/oauth/authorization-code',
		title: 'V7M OAuth Authorization Code',
		element: <V7MOAuthAuthCodeV9 oidc={false} title="V7M OAuth Authorization Code" />,
		menuGroup: 'Mock OAuth and OIDC flows',
	},
	{
		path: '/v7/oidc/authorization-code',
		title: 'V7M OIDC Authorization Code',
		element: <V7MOAuthAuthCodeV9 oidc={true} title="V7M OIDC Authorization Code" />,
		menuGroup: 'Mock OAuth and OIDC flows',
	},
	{
		path: '/v7/oauth/device-authorization',
		title: 'V7M Device Authorization',
		element: <V7MDeviceAuthorizationV9 />,
		menuGroup: 'Mock OAuth and OIDC flows',
	},
	{
		path: '/v7/oauth/client-credentials',
		title: 'V7M Client Credentials',
		element: <V7MClientCredentialsV9 />,
		menuGroup: 'Mock OAuth and OIDC flows',
	},
	{
		path: '/v7/oauth/implicit',
		title: 'V7M OAuth Implicit Flow',
		element: <V7MImplicitFlowV9 oidc={false} title="V7M OAuth Implicit Flow" />,
		menuGroup: 'Mock OAuth and OIDC flows',
	},
	{
		path: '/v7/oidc/implicit',
		title: 'V7M OIDC Implicit Flow',
		element: <V7MImplicitFlowV9 oidc={true} title="V7M OIDC Implicit Flow" />,
		menuGroup: 'Mock OAuth and OIDC flows',
	},
	{
		path: '/v7/oauth/ropc',
		title: 'V7M Resource Owner Password Credentials',
		element: <V7MROPCV9 oidc={false} title="V7M Resource Owner Password Credentials" />,
		menuGroup: 'Mock OAuth and OIDC flows',
	},
	{
		path: '/v7/oidc/ropc',
		title: 'V7M OIDC Resource Owner Password Credentials',
		element: <V7MROPCV9 oidc={true} title="V7M OIDC Resource Owner Password Credentials" />,
		menuGroup: 'Mock OAuth and OIDC flows',
	},
];
