// src/v7m/routes.tsx
// Route definitions for V7M flows. Consumer should import and mount these under a
// "Mock OAuth and OIDC flows" menu group.
import React from 'react';
import V7MClientCredentials from './pages/V7MClientCredentials';
import V7MDeviceAuthorization from './pages/V7MDeviceAuthorization';
import V7MImplicitFlow from './pages/V7MImplicitFlow';
import V7MOAuthAuthCode from './pages/V7MOAuthAuthCode';
import V7MROPC from './pages/V7MROPC';

export type V7MRoute = {
	path: string;
	title: string;
	element: React.ReactElement;
	menuGroup: 'Mock OAuth and OIDC flows';
};

export const V7M_ROUTES: V7MRoute[] = [
	{
		path: '/v7m/oauth/authorization-code',
		title: 'V7M OAuth Authorization Code',
		element: <V7MOAuthAuthCode oidc={false} title="V7M OAuth Authorization Code" />,
		menuGroup: 'Mock OAuth and OIDC flows',
	},
	{
		path: '/v7m/oidc/authorization-code',
		title: 'V7M OIDC Authorization Code',
		element: <V7MOAuthAuthCode oidc={true} title="V7M OIDC Authorization Code" />,
		menuGroup: 'Mock OAuth and OIDC flows',
	},
	{
		path: '/v7m/oauth/device-authorization',
		title: 'V7M Device Authorization',
		element: <V7MDeviceAuthorization />,
		menuGroup: 'Mock OAuth and OIDC flows',
	},
	{
		path: '/v7m/oauth/client-credentials',
		title: 'V7M Client Credentials',
		element: <V7MClientCredentials />,
		menuGroup: 'Mock OAuth and OIDC flows',
	},
	{
		path: '/v7m/oauth/implicit',
		title: 'V7M OAuth Implicit Flow',
		element: <V7MImplicitFlow oidc={false} title="V7M OAuth Implicit Flow" />,
		menuGroup: 'Mock OAuth and OIDC flows',
	},
	{
		path: '/v7m/oidc/implicit',
		title: 'V7M OIDC Implicit Flow',
		element: <V7MImplicitFlow oidc={true} title="V7M OIDC Implicit Flow" />,
		menuGroup: 'Mock OAuth and OIDC flows',
	},
	{
		path: '/v7m/oauth/ropc',
		title: 'V7M Resource Owner Password Credentials',
		element: <V7MROPC oidc={false} title="V7M Resource Owner Password Credentials" />,
		menuGroup: 'Mock OAuth and OIDC flows',
	},
	{
		path: '/v7m/oidc/ropc',
		title: 'V7M OIDC Resource Owner Password Credentials',
		element: <V7MROPC oidc={true} title="V7M OIDC Resource Owner Password Credentials" />,
		menuGroup: 'Mock OAuth and OIDC flows',
	},
];
