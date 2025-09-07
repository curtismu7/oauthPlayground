import React, { useState } from 'react';
import styled from 'styled-components';
import JSONHighlighter from './JSONHighlighter';

const TemplatesContainer = styled.div`
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const TemplatesHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

const TemplatesTitle = styled.h3`
  margin: 0;
  color: #1f2937;
  font-size: 1.25rem;
`;

const TemplateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const TemplateCard = styled.div<{ $selected: boolean }>`
  border: 2px solid ${({ $selected }) => $selected ? '#3b82f6' : '#e5e7eb'};
  border-radius: 0.5rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  background: ${({ $selected }) => $selected ? '#eff6ff' : 'white'};
  
  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
`;

const TemplateName = styled.h4`
  margin: 0 0 0.5rem 0;
  color: #1f2937;
  font-size: 1.125rem;
`;

const TemplateDescription = styled.p`
  margin: 0 0 1rem 0;
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
`;

const TemplateFeatures = styled.ul`
  margin: 0;
  padding-left: 1.25rem;
  list-style: none;
`;

const FeatureItem = styled.li`
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
  
  &::before {
    content: '✓';
    color: #10b981;
    font-weight: bold;
    margin-right: 0.5rem;
  }
`;

const Button = styled.button<{ $variant: 'primary' | 'secondary' | 'success' }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  
  ${({ $variant }) => {
    switch ($variant) {
      case 'primary':
        return `
          background-color: #3b82f6;
          color: white;
          &:hover { background-color: #2563eb; }
        `;
      case 'secondary':
        return `
          background-color: #6b7280;
          color: white;
          &:hover { background-color: #4b5563; }
        `;
      case 'success':
        return `
          background-color: #10b981;
          color: white;
          &:hover { background-color: #059669; }
        `;
    }
  }}
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const ConfigPreview = styled.pre`
  background: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  overflow-x: auto;
  margin: 1rem 0;
  max-height: 300px;
  overflow-y: auto;
`;

const Alert = styled.div<{ $type: 'info' | 'success' | 'warning' }>`
  padding: 0.75rem;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  
  ${({ $type }) => {
    switch ($type) {
      case 'info':
        return `
          background-color: #dbeafe;
          color: #1e40af;
          border: 1px solid #93c5fd;
        `;
      case 'success':
        return `
          background-color: #dcfce7;
          color: #166534;
          border: 1px solid #86efac;
        `;
      case 'warning':
        return `
          background-color: #fef3c7;
          color: #92400e;
          border: 1px solid #fde68a;
        `;
    }
  }}
`;

interface FlowTemplate {
  id: string;
  name: string;
  description: string;
  flowType: string;
  features: string[];
  configuration: Record<string, unknown>;
  isDefault?: boolean;
}

const FLOW_TEMPLATES: FlowTemplate[] = [
  {
    id: 'auth-code-pkce',
    name: 'Authorization Code with PKCE',
    description: 'Most secure OAuth 2.0 flow with PKCE for public clients',
    flowType: 'authorization_code',
    features: [
      'PKCE code challenge',
      'State parameter validation',
      'Nonce for ID tokens',
      'Refresh token support',
      'Secure redirect handling'
    ],
    configuration: {
      response_type: 'code',
      grant_type: 'authorization_code',
      code_challenge_method: 'S256',
      scope: 'openid profile email',
      use_pkce: true,
      use_state: true,
      use_nonce: true,
      redirect_uri: 'http://localhost:3000/callback'
    }
  },
  {
    id: 'implicit-flow',
    name: 'Implicit Flow',
    description: 'Simplified flow for single-page applications',
    flowType: 'implicit',
    features: [
      'Direct token response',
      'No client secret required',
      'State parameter validation',
      'Nonce for ID tokens'
    ],
    configuration: {
      response_type: 'token id_token',
      scope: 'openid profile email',
      use_state: true,
      use_nonce: true,
      redirect_uri: 'http://localhost:3000/callback'
    }
  },
  {
    id: 'hybrid-flow',
    name: 'Hybrid Flow',
    description: 'Combines authorization code and implicit flows',
    flowType: 'hybrid',
    features: [
      'Authorization code + tokens',
      'PKCE support',
      'State parameter validation',
      'Nonce for ID tokens',
      'Refresh token support'
    ],
    configuration: {
      response_type: 'code id_token',
      grant_type: 'authorization_code',
      code_challenge_method: 'S256',
      scope: 'openid profile email',
      use_pkce: true,
      use_state: true,
      use_nonce: true,
      redirect_uri: 'http://localhost:3000/callback'
    }
  },
  {
    id: 'client-credentials',
    name: 'Client Credentials',
    description: 'Machine-to-machine authentication flow',
    flowType: 'client_credentials',
    features: [
      'No user interaction required',
      'Client secret authentication',
      'Direct token issuance',
      'API access tokens'
    ],
    configuration: {
      grant_type: 'client_credentials',
      scope: 'api:read api:write',
      client_authentication: 'client_secret_post'
    }
  },
  {
    id: 'device-code',
    name: 'Device Code Flow',
    description: 'For devices with limited input capabilities',
    flowType: 'device_code',
    features: [
      'Device code generation',
      'User code display',
      'Polling for completion',
      'Refresh token support'
    ],
    configuration: {
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      scope: 'openid profile email',
      device_code_endpoint: '/device/code',
      polling_interval: 5
    }
  },
  {
    id: 'custom-secure',
    name: 'Custom Secure Flow',
    description: 'Highly customized secure configuration',
    flowType: 'authorization_code',
    features: [
      'Custom scopes',
      'Advanced PKCE settings',
      'Custom claims',
      'Enhanced security headers',
      'Token binding'
    ],
    configuration: {
      response_type: 'code',
      grant_type: 'authorization_code',
      code_challenge_method: 'S256',
      scope: 'openid profile email custom:read custom:write',
      use_pkce: true,
      use_state: true,
      use_nonce: true,
      custom_claims: ['custom_claim_1', 'custom_claim_2'],
      security_headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      },
      redirect_uri: 'http://localhost:3000/callback'
    }
  }
];

const FlowConfigurationTemplates: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<FlowTemplate | null>(null);
  const [message, setMessage] = useState<{ type: 'info' | 'success' | 'warning'; text: string } | null>(null);

  const handleTemplateSelect = (template: FlowTemplate) => {
    setSelectedTemplate(template);
    setMessage(null);
  };

  const handleApplyTemplate = () => {
    if (!selectedTemplate) {
      setMessage({ type: 'warning', text: 'Please select a template first' });
      return;
    }

    // Store the template configuration
    try {
      localStorage.setItem('oauth_flow_template', JSON.stringify(selectedTemplate));
      setMessage({ 
        type: 'success', 
        text: `Template "${selectedTemplate.name}" applied successfully. You can now use this configuration in your OAuth flows.` 
      });
    } catch (error) {
      setMessage({ 
        type: 'warning', 
        text: 'Failed to save template configuration' 
      });
    }
  };

  const handleExportTemplate = () => {
    if (!selectedTemplate) {
      setMessage({ type: 'warning', text: 'Please select a template first' });
      return;
    }

    const exportData = {
      ...selectedTemplate,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flow-template-${selectedTemplate.id}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setMessage({ type: 'success', text: 'Template exported successfully' });
  };

  const handleImportTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const template = JSON.parse(e.target?.result as string);
        
        // Validate template structure
        if (!template.id || !template.name || !template.configuration) {
          throw new Error('Invalid template format');
        }

        // Add to templates (in a real app, this would be stored in a database)
        setMessage({ type: 'success', text: `Template "${template.name}" imported successfully` });
        
        // Reset file input
        event.target.value = '';
      } catch (error) {
        setMessage({ 
          type: 'warning', 
          text: `Import failed: ${error instanceof Error ? error.message : 'Invalid file format'}` 
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <TemplatesContainer>
      <TemplatesHeader>
        <TemplatesTitle>Flow Configuration Templates</TemplatesTitle>
        <div>
          <input
            type="file"
            accept=".json"
            onChange={handleImportTemplate}
            style={{ display: 'none' }}
            id="import-template"
          />
          <label htmlFor="import-template">
            <Button $variant="secondary" as="span">
              Import Template
            </Button>
          </label>
        </div>
      </TemplatesHeader>

      {message && (
        <Alert $type={message.type}>
          {message.text}
        </Alert>
      )}

      <TemplateGrid>
        {FLOW_TEMPLATES.map((template) => (
          <TemplateCard
            key={template.id}
            $selected={selectedTemplate?.id === template.id}
            onClick={() => handleTemplateSelect(template)}
          >
            <TemplateName>{template.name}</TemplateName>
            <TemplateDescription>{template.description}</TemplateDescription>
            <TemplateFeatures>
              {template.features.map((feature, index) => (
                <FeatureItem key={index}>{feature}</FeatureItem>
              ))}
            </TemplateFeatures>
          </TemplateCard>
        ))}
      </TemplateGrid>

      {selectedTemplate && (
        <div>
          <h4>Configuration Preview</h4>
          <ConfigPreview>
            <JSONHighlighter data={selectedTemplate.configuration} />
          </ConfigPreview>
          
          <ButtonGroup>
            <Button $variant="primary" onClick={handleApplyTemplate}>
              Apply Template
            </Button>
            <Button $variant="success" onClick={handleExportTemplate}>
              Export Template
            </Button>
          </ButtonGroup>
        </div>
      )}
    </TemplatesContainer>
  );
};

export default FlowConfigurationTemplates;
