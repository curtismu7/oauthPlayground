import { AuthCodeConfig, FormErrors } from '../types';

export const validateConfig = (config: AuthCodeConfig): FormErrors => {
  const errors: FormErrors = {};

  if (!config.environmentId || config.environmentId.trim() === '') {
    errors.environmentId = 'Environment ID is required';
  }

  if (!config.clientId || config.clientId.trim() === '') {
    errors.clientId = 'Client ID is required';
  }

  if (!config.redirectUri || config.redirectUri.trim() === '') {
    errors.redirectUri = 'Redirect URI is required';
  } else if (!isValidUri(config.redirectUri)) {
    errors.redirectUri = 'Invalid URL format';
  }

  if (!config.scopes || config.scopes.length === 0) {
    errors.scopes = 'At least one scope is required';
  }

  return errors;
};

export const hasErrors = (errors: FormErrors): boolean => {
  return Object.keys(errors).length > 0;
};

const isValidUri = (uri: string): boolean => {
  try {
    new URL(uri);
    return true;
  } catch {
    return false;
  }
};
