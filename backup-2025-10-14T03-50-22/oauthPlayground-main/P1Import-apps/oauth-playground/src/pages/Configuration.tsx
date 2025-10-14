import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from '../components/Card';
import { FiSave, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const ConfigurationContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
    margin-bottom: 0.5rem;
  }
  
  p {
    color: ${({ theme }) => theme.colors.gray600};
    font-size: 1.1rem;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.gray700};
  }
  
  input, select, textarea {
    width: 100%;
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
    border: 1px solid ${({ theme }) => theme.colors.gray300};
    border-radius: 0.375rem;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    
    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.primary};
      box-shadow: 0 0 0 3px ${({ theme }) => `${theme.colors.primary}40`};
    }
    
    &::placeholder {
      color: ${({ theme }) => theme.colors.gray400};
    }
  }
  
  textarea {
    min-height: 120px;
    resize: vertical;
  }
  
  .form-text {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.gray600};
  }
  
  .invalid-feedback {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.danger};
  }
`;

const SaveButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1.25rem;
  font-size: 1rem;
  font-weight: 500;
  color: white;
  background-color: ${({ theme }) => theme.colors.primary};
  border: 1px solid transparent;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryDark};
  }
  
  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
  
  svg {
    margin-right: 0.5rem;
  }
`;

const Alert = styled.div`
  padding: 1rem;
  margin-bottom: 1.5rem;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  display: flex;
  align-items: flex-start;
  
  svg {
    margin-right: 0.75rem;
    margin-top: 0.2rem;
    flex-shrink: 0;
  }
  
  div {
    flex: 1;
  }
  
  h4 {
    margin-top: 0;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }
  
  p {
    margin: 0;
    font-size: 0.9375rem;
  }
  
  ${({ variant }) => {
		switch (variant) {
			case 'success':
				return `
          background-color: #f0fdf4;
          border-color: #bbf7d0;
          color: #166534;
          
          svg {
            color: #22c55e;
          }
        `;
			case 'danger':
				return `
          background-color: #fef2f2;
          border-color: #fecaca;
          color: #991b1b;
          
          svg {
            color: #ef4444;
          }
        `;
			case 'info':
			default:
				return `
          background-color: #eff6ff;
          border-color: #bfdbfe;
          color: #1e40af;
          
          svg {
            color: #3b82f6;
          }
        `;
		}
	}}
`;

const Configuration = () => {
	const [formData, setFormData] = useState({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		redirectUri: window.location.origin + '/callback',
		scopes: 'openid profile email',
		authEndpoint: 'https://auth.pingone.com/{envId}/as/authorize',
		tokenEndpoint: 'https://auth.pingone.com/{envId}/as/token',
		userInfoEndpoint: 'https://auth.pingone.com/{envId}/as/userinfo',
	});

	const [errors, setErrors] = useState({});
	const [isLoading, setIsLoading] = useState(false);
	const [saveStatus, setSaveStatus] = useState(null);

	// Load saved configuration on component mount
	useEffect(() => {
		const savedConfig = localStorage.getItem('pingone_config');
		if (savedConfig) {
			try {
				const parsedConfig = JSON.parse(savedConfig);
				setFormData((prev) => ({
					...prev,
					...parsedConfig,
				}));
			} catch (error) {
				console.error('Failed to load saved configuration:', error);
			}
		}
	}, []);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));

		// Clear error when field is edited
		if (errors[name]) {
			setErrors((prev) => ({
				...prev,
				[name]: null,
			}));
		}
	};

	const validateForm = () => {
		const newErrors = {};
		let isValid = true;

		if (!formData.environmentId) {
			newErrors.environmentId = 'Environment ID is required';
			isValid = false;
		}

		if (!formData.clientId) {
			newErrors.clientId = 'Client ID is required';
			isValid = false;
		}

		if (!formData.redirectUri) {
			newErrors.redirectUri = 'Redirect URI is required';
			isValid = false;
		} else if (!/^https?:\/\//.test(formData.redirectUri)) {
			newErrors.redirectUri = 'Redirect URI must start with http:// or https://';
			isValid = false;
		}

		setErrors(newErrors);
		return isValid;
	};

	const handleSubmit = (e) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		setIsLoading(true);
		setSaveStatus(null);

		// Simulate API call
		setTimeout(() => {
			try {
				// Format endpoints with environment ID
				const configToSave = {
					...formData,
					authEndpoint: formData.authEndpoint.replace('{envId}', formData.environmentId),
					tokenEndpoint: formData.tokenEndpoint.replace('{envId}', formData.environmentId),
					userInfoEndpoint: formData.userInfoEndpoint.replace('{envId}', formData.environmentId),
				};

				// Save to localStorage
				localStorage.setItem('pingone_config', JSON.stringify(configToSave));

				setSaveStatus({
					type: 'success',
					title: 'Configuration saved',
					message: 'Your PingOne configuration has been saved successfully.',
				});
			} catch (error) {
				console.error('Failed to save configuration:', error);
				setSaveStatus({
					type: 'danger',
					title: 'Error',
					message: 'Failed to save configuration. Please try again.',
				});
			} finally {
				setIsLoading(false);

				// Clear success message after 5 seconds
				if (saveStatus?.type === 'success') {
					setTimeout(() => {
						setSaveStatus(null);
					}, 5000);
				}
			}
		}, 1000);
	};

	return (
		<ConfigurationContainer>
			<PageHeader>
				<h1>PingOne Configuration</h1>
				<p>
					Configure your PingOne environment and application settings to get started with the OAuth
					Playground.
				</p>
			</PageHeader>

			{saveStatus && (
				<Alert variant={saveStatus.type}>
					{saveStatus.type === 'success' ? (
						<FiCheckCircle size={20} />
					) : (
						<FiAlertCircle size={20} />
					)}
					<div>
						<h4>{saveStatus.title}</h4>
						<p>{saveStatus.message}</p>
					</div>
				</Alert>
			)}

			<Card>
				<CardHeader>
					<h2>Environment Settings</h2>
					<p className="subtitle">Configure your PingOne environment and application details</p>
				</CardHeader>

				<CardBody>
					<form onSubmit={handleSubmit}>
						<FormGroup>
							<label htmlFor="environmentId">Environment ID</label>
							<input
								type="text"
								id="environmentId"
								name="environmentId"
								value={formData.environmentId}
								onChange={handleChange}
								placeholder="e.g., abc12345-6789-4abc-def0-1234567890ab"
								className={errors.environmentId ? 'is-invalid' : ''}
							/>
							{errors.environmentId && (
								<div className="invalid-feedback">{errors.environmentId}</div>
							)}
							<div className="form-text">
								Your PingOne Environment ID. You can find this in the PingOne Admin Console.
							</div>
						</FormGroup>

						<FormGroup>
							<label htmlFor="clientId">Client ID</label>
							<input
								type="text"
								id="clientId"
								name="clientId"
								value={formData.clientId}
								onChange={handleChange}
								placeholder="Enter your application's Client ID"
								className={errors.clientId ? 'is-invalid' : ''}
							/>
							{errors.clientId && <div className="invalid-feedback">{errors.clientId}</div>}
							<div className="form-text">The Client ID of your application in PingOne.</div>
						</FormGroup>

						<FormGroup>
							<label htmlFor="clientSecret">Client Secret (Optional)</label>
							<input
								type="password"
								id="clientSecret"
								name="clientSecret"
								value={formData.clientSecret}
								onChange={handleChange}
								placeholder="Enter your application's Client Secret"
							/>
							<div className="form-text">
								Only required for confidential clients using flows that require client
								authentication.
							</div>
						</FormGroup>

						<FormGroup>
							<label htmlFor="redirectUri">Redirect URI</label>
							<input
								type="url"
								id="redirectUri"
								name="redirectUri"
								value={formData.redirectUri}
								onChange={handleChange}
								className={errors.redirectUri ? 'is-invalid' : ''}
							/>
							{errors.redirectUri && <div className="invalid-feedback">{errors.redirectUri}</div>}
							<div className="form-text">
								The redirect URI registered in your PingOne application. Must match exactly.
							</div>
						</FormGroup>

						<FormGroup>
							<label htmlFor="scopes">Scopes</label>
							<input
								type="text"
								id="scopes"
								name="scopes"
								value={formData.scopes}
								onChange={handleChange}
								placeholder="openid profile email"
							/>
							<div className="form-text">
								Space-separated list of scopes to request. Common scopes: openid, profile, email,
								offline_access
							</div>
						</FormGroup>

						<h3 style={{ margin: '2rem 0 1rem', fontSize: '1.25rem' }}>Advanced Settings</h3>

						<FormGroup>
							<label htmlFor="authEndpoint">Authorization Endpoint</label>
							<input
								type="url"
								id="authEndpoint"
								name="authEndpoint"
								value={formData.authEndpoint}
								onChange={handleChange}
							/>
							<div className="form-text">
								The authorization endpoint URL. Use {'{envId}'} as a placeholder for the environment
								ID.
							</div>
						</FormGroup>

						<FormGroup>
							<label htmlFor="tokenEndpoint">Token Endpoint</label>
							<input
								type="url"
								id="tokenEndpoint"
								name="tokenEndpoint"
								value={formData.tokenEndpoint}
								onChange={handleChange}
							/>
							<div className="form-text">
								The token endpoint URL. Use {'{envId}'} as a placeholder for the environment ID.
							</div>
						</FormGroup>

						<FormGroup>
							<label htmlFor="userInfoEndpoint">UserInfo Endpoint</label>
							<input
								type="url"
								id="userInfoEndpoint"
								name="userInfoEndpoint"
								value={formData.userInfoEndpoint}
								onChange={handleChange}
							/>
							<div className="form-text">
								The UserInfo endpoint URL. Use {'{envId}'} as a placeholder for the environment ID.
							</div>
						</FormGroup>

						<div style={{ marginTop: '2rem' }}>
							<SaveButton type="submit" disabled={isLoading}>
								<FiSave />
								{isLoading ? 'Saving...' : 'Save Configuration'}
							</SaveButton>
						</div>
					</form>
				</CardBody>
			</Card>

			<Card style={{ marginTop: '2rem' }}>
				<CardHeader>
					<h2>Configuration Help</h2>
					<p className="subtitle">How to set up your PingOne application</p>
				</CardHeader>

				<CardBody>
					<h3 style={{ marginTop: 0 }}>Getting Started with PingOne</h3>
					<ol style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
						<li>
							Sign in to the{' '}
							<a href="https://admin.pingone.com" target="_blank" rel="noopener noreferrer">
								PingOne Admin Console
							</a>
						</li>
						<li>Select your environment or create a new one</li>
						<li>
							Navigate to <strong>Applications</strong> &gt; <strong>Add Application</strong>
						</li>
						<li>Choose the appropriate application type (e.g., Single Page App, Web App)</li>
						<li>Configure the following settings in your application:</li>
						<ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', margin: '0.5rem 0' }}>
							<li>
								Add the Redirect URI:{' '}
								<code>{formData.redirectUri || 'https://your-app.com/callback'}</code>
							</li>
							<li>Enable the appropriate grant types (flows) you plan to use</li>
							<li>Configure any required scopes</li>
						</ul>
						<li>Copy the Client ID and Client Secret (if applicable) to the form above</li>
						<li>Save your application configuration</li>
					</ol>

					<h3>Need Help?</h3>
					<ul style={{ paddingLeft: '1.5rem', marginBottom: 0 }}>
						<li>
							<a
								href="https://docs.pingidentity.com/bundle/pingone-oauth-20/page/lyc1469003009669.html"
								target="_blank"
								rel="noopener noreferrer"
							>
								PingOne OAuth 2.0 Documentation
							</a>
						</li>
						<li>
							<a
								href="https://docs.pingidentity.com/bundle/pingone-openidconnect/page/lyc1469003009669.html"
								target="_blank"
								rel="noopener noreferrer"
							>
								PingOne OpenID Connect Documentation
							</a>
						</li>
						<li>
							<a
								href="https://support.pingidentity.com/s/"
								target="_blank"
								rel="noopener noreferrer"
							>
								Ping Identity Support
							</a>
						</li>
					</ul>
				</CardBody>
			</Card>
		</ConfigurationContainer>
	);
};

export default Configuration;
