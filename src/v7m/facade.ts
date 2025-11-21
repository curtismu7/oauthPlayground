// src/v7m/facade.ts
// Simple facade to call V7M services from V7 flows when mock mode is enabled.

import {
	authorizeAccessDenied,
	authorizeIssueCode,
	V7MAuthorizeRequest,
} from '../services/v7m/V7MAuthorizeService';
import { introspectToken } from '../services/v7m/V7MIntrospectionService';
import {
	tokenExchangeAuthorizationCode,
	tokenExchangePassword,
	tokenExchangeRefreshToken,
	V7MAuthorizationCodeGrantRequest,
	V7MPasswordGrantRequest,
	V7MRefreshTokenGrantRequest,
} from '../services/v7m/V7MTokenService';
import { getUserInfoFromAccessToken } from '../services/v7m/V7MUserInfoService';

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
	V7MAuthorizeRequest,
	V7MAuthorizationCodeGrantRequest,
	V7MRefreshTokenGrantRequest,
	V7MPasswordGrantRequest,
};
