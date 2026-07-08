import { OAuthConfig, FormErrors } from '../types';

export const validateConfig = (config: OAuthConfig): FormErrors => {
  const errors: FormErrors = {};

  if (!config.environmentId.trim()) {
    errors.environmentId = 'Environment ID is required';
  }

  if (!config.clientId.trim()) {
    errors.clientId = 'Client ID is required';
  }

  if (!config.redirectUri.trim()) {
    errors.redirectUri = 'Redirect URI is required';
  } else if (!isValidUri(config.redirectUri)) {
    errors.redirectUri = 'Invalid redirect URI format';
  }

  if (config.scopes.length === 0) {
    errors.scopes = 'At least one scope is required';
  }

  return errors;
};

const isValidUri = (uri: string): boolean => {
  try {
    new URL(uri);
    return true;
  } catch {
    return false;
  }
};

export const hasErrors = (errors: FormErrors): boolean => {
  return Object.keys(errors).length > 0;
};
