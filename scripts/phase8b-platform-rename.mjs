#!/usr/bin/env node
/**
 * Phase 8b: rename platform V9* file paths and symbols across src/, scripts/, docs/.
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'coverage']);
const SKIP_EXT = new Set(['.png', '.jpg', '.svg', '.woff', '.woff2', '.map']);

const REPLACEMENTS = [
  // Import paths (longest first)
  ['components/ModernMessagingComponents', 'components/ModernMessagingComponents'],
  ['platform/ModernMessagingService', 'platform/ModernMessagingService'],
  ['platform/FlowRestartButton', 'platform/FlowRestartButton'],
  ['platform/CredentialStorageService', 'platform/CredentialStorageService'],
  ['platform/UnifiedRedirectUriService', 'platform/UnifiedRedirectUriService'],
  ['platform/AppDiscoveryService', 'platform/AppDiscoveryService'],
  ['platform/WorkerTokenStatusService', 'platform/WorkerTokenStatusService'],
  ['platform/MFARedirectUriService', 'platform/MFARedirectUriService'],
  ['platform/core/FlowCredentialService', 'platform/core/FlowCredentialService'],
  ['platform/RedirectUriService', 'platform/RedirectUriService'],
  ['platform/LoggingService', 'platform/LoggingService'],
  ['platform/platformComprehensiveCredentialsService', 'platform/platformComprehensiveCredentialsService'],
  ['platform/platformCredentialValidationService', 'platform/platformCredentialValidationService'],
  ['platform/platformFlowCompletionService', 'platform/platformFlowCompletionService'],
  ['platform/modalPresentationService', 'platform/modalPresentationService'],
  ['platform/platformFlowHeaderService', 'platform/platformFlowHeaderService'],
  // Symbols (longest first)
  ['ModernMessagingProvider', 'ModernMessagingProvider'],
  ['ModernMessagingComponents', 'ModernMessagingComponents'],
  ['ModernMessagingService', 'ModernMessagingService'],
  ['PlatformComprehensiveCredentialsService', 'PlatformComprehensiveCredentialsService'],
  ['PlatformComprehensiveCredentialsProps', 'PlatformComprehensiveCredentialsProps'],
  ['PlatformCredentialValidationService', 'PlatformCredentialValidationService'],
  ['UseCredentialValidationReturn', 'UseCredentialValidationReturn'],
  ['UseCredentialValidationOptions', 'UseCredentialValidationOptions'],
  ['validateFlowCredentials', 'validateFlowCredentials'],
  ['useCredentialValidation', 'useCredentialValidation'],
  ['WorkerTokenStatusService', 'WorkerTokenStatusService'],
  ['UnifiedRedirectUriService', 'UnifiedRedirectUriService'],
  ['CredentialStorageService', 'CredentialStorageService'],
  ['ModalPresentationService', 'ModalPresentationService'],
  ['PlatformFlowCompletionService', 'PlatformFlowCompletionService'],
  ['PlatformFlowCompletionProps', 'PlatformFlowCompletionProps'],
  ['FlowRestartButtonProps', 'FlowRestartButtonProps'],
  ['FlowRestartButton', 'FlowRestartButton'],
  ['FLOW_REDIRECT_URI_MAPPING', 'FLOW_REDIRECT_URI_MAPPING'],
  ['FlowRedirectUriConfig', 'FlowRedirectUriConfig'],
  ['MFARedirectUriService', 'MFARedirectUriService'],
  ['FlowCredentialService', 'FlowCredentialService'],
  ['AppDiscoveryService', 'AppDiscoveryService'],
  ['AppDiscoveryResult', 'AppDiscoveryResult'],
  ['FLOW_CREDENTIAL_CONFIGS', 'FLOW_CREDENTIAL_CONFIGS'],
  ['FlowCredentialConfig', 'FlowCredentialConfig'],
  ['FlowCredentials', 'FlowCredentials'],
  ['RedirectUriService', 'RedirectUriService'],
  ['DiscoveredApp', 'DiscoveredApp'],
  ['PlatformFlowHeaderProps', 'PlatformFlowHeaderProps'],
  ['getPlatformFlowConfig', 'getPlatformFlowConfig'],
  ['CredentialValues', 'CredentialValues'],
  ['CredentialInput', 'CredentialInput'],
  ['getWorkerTokenExpirationWarning', 'getWorkerTokenExpirationWarning'],
  ['getTokenStatusBadgeStyle', 'getTokenStatusBadgeStyle'],
  ['checkWorkerTokenStatusSync', 'checkWorkerTokenStatusSync'],
  ['checkWorkerTokenStatus', 'checkWorkerTokenStatus'],
  ['validateWorkerToken', 'validateWorkerToken'],
  ['formatTimeRemaining', 'formatTimeRemaining'],
  ['getTokenStatusColor', 'getTokenStatusColor'],
  ['getTokenStatusIcon', 'getTokenStatusIcon'],
  ['TokenStatusInfo', 'TokenStatusInfo'],
  ['WorkerTokenStatus', 'WorkerTokenStatus'],
  ['CredentialSaveOptions', 'CredentialSaveOptions'],
  ['PlatformCredentials', 'PlatformCredentials'],
  ['PlatformLoggingService', 'PlatformLoggingService'],
  ['PlatformFlowHeader', 'PlatformFlowHeader'],
];

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else files.push(p);
  }
  return files;
}

function shouldProcess(file) {
  const ext = path.extname(file);
  if (SKIP_EXT.has(ext)) return false;
  if (file.endsWith('.bak')) return false;
  return (
    file.includes(`${path.sep}src${path.sep}`) ||
    file.includes(`${path.sep}scripts${path.sep}`) ||
    file.includes(`${path.sep}docs${path.sep}`)
  );
}

let changed = 0;
for (const file of walk(ROOT)) {
  if (!shouldProcess(file)) continue;
  let text = fs.readFileSync(file, 'utf8');
  const orig = text;
  for (const [from, to] of REPLACEMENTS) {
    text = text.split(from).join(to);
  }
  if (text !== orig) {
    fs.writeFileSync(file, text);
    changed++;
  }
}

console.log(`Updated ${changed} files`);
