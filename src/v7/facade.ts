// src/v7m/facade.ts
// Simple facade to call V7M services from V7 flows when mock mode is enabled.

import {
	authorizeAccessDenied,
	authorizeIssueCode,
	V9MockAuthorizeRequest,
} from '../services/v9/mock/V9MockAuthorizeService';
import { introspectToken } from '../services/v9/mock/V9MockIntrospectionService';
import {
	tokenExchangeAuthorizationCode,
	tokenExchangePassword,
	tokenExchangeRefreshToken,
	V9MockAuthorizationCodeGrantRequest,
	V9MockPasswordGrantRequest,
	V9MockRefreshTokenGrantRequest,
} from '../services/v9/mock/V9MockTokenService';
import { getUserInfoFromAccessToken } from '../services/v9/mock/V9MockUserInfoService';

export const V7MFacade = {
	authorizeIssueCode,
	authorizeAccessDenied,
	tokenExchangeAuthorizationCode,
	tokenExchangeRefreshToken,
	tokenExchangePassword,
	getUserInfoFromAccessToken,
	introspectToken,
};

export type {
	V9MockAuthorizeRequest,
	V9MockAuthorizationCodeGrantRequest,
	V9MockRefreshTokenGrantRequest,
	V9MockPasswordGrantRequest,
};
