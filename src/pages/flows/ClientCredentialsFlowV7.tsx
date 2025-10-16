// src/pages/flows/ClientCredentialsFlowV7.tsx
// V7.0.0 OAuth 2.0 Client Credentials Flow - Enhanced Service Architecture with Modern UI/UX

import React from 'react';
import { usePageScroll } from '../../hooks/usePageScroll';
import { useClientCredentialsFlowController } from '../../hooks/useClientCredentialsFlowController';
import { AuthMethod } from '../../services/authMethodService';
import ClientCredentialsFlowV6 from './ClientCredentialsFlowV6';

interface ClientCredentialsFlowV7Props {
  // Add any props if needed
}

const ClientCredentialsFlowV7: React.FC<ClientCredentialsFlowV7Props> = () => {
  // Initialize page scroll management
  usePageScroll();
  
  // Initialize client credentials flow controller with V7 settings
  const controller = useClientCredentialsFlowController({
    flowKey: 'client-credentials-v7',
  });
  
  // Set default auth method
  const [selectedAuthMethod, setSelectedAuthMethod] = React.useState<AuthMethod>('client_secret_basic');
  
  // Update local storage when auth method changes
  React.useEffect(() => {
    localStorage.setItem('client_credentials_v7_auth_method', selectedAuthMethod);
  }, [selectedAuthMethod]);
  
  return (
    <ClientCredentialsFlowV6 
      flowKey="client-credentials-v7"
      flowVersion="V7"
      flowTitle="Client Credentials (V7)"
      selectedAuthMethod={selectedAuthMethod}
      onAuthMethodChange={setSelectedAuthMethod}
    />
  );
};

export default ClientCredentialsFlowV7;
