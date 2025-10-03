// src/pages/flows/PingOneMFAFlowV5.tsx
import React, { useState } from 'react';
import { FiInfo, FiKey, FiShield, FiCheckCircle, FiSmartphone, FiMail, FiLock, FiPhone } from 'react-icons/fi';

const PingOneMFAFlowV5: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [deviceRegistered, setDeviceRegistered] = useState(false);
  const [selectedMfaMethod, setSelectedMfaMethod] = useState('sms');
  const [mfaVerified, setMfaVerified] = useState(false);
  const [tokens, setTokens] = useState<any>(null);

  const mfaMethods = [
    { id: 'sms', label: 'SMS Verification', icon: <FiSmartphone />, description: 'Receive a code via SMS' },
    { id: 'email', label: 'Email Verification', icon: <FiMail />, description: 'Receive a code via email' },
    { id: 'totp', label: 'TOTP Authenticator', icon: <FiLock />, description: 'Use your authenticator app' },
    { id: 'push', label: 'Push Notification', icon: <FiPhone />, description: 'Approve via mobile app' },
  ];

  const handleDeviceRegistration = () => {
    setTimeout(() => {
      setDeviceRegistered(true);
      setCurrentStep(1);
    }, 1000);
  };

  const handleMfaSelection = () => {
    setCurrentStep(2);
  };

  const handleMfaVerification = () => {
    setTimeout(() => {
      setMfaVerified(true);
      setCurrentStep(3);
    }, 1000);
  };

  const handleTokenExchange = () => {
    setTimeout(() => {
      setTokens({
        access_token: 'access_token_' + Date.now(),
        id_token: 'id_token_' + Date.now(),
        token_type: 'Bearer',
        expires_in: 3600,
        mfa_verified: true,
        mfa_method: selectedMfaMethod,
      });
      setCurrentStep(4);
    }, 1000);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FiInfo className="text-blue-500" />
              Step 0: Introduction & Setup
            </h3>
            <p className="text-gray-600 mb-4">
              Welcome to the PingOne MFA Flow V5. This interactive flow demonstrates how to integrate multi-factor authentication into OAuth flows.
            </p>
            <div className="bg-blue-50 p-4 rounded">
              <h4 className="font-semibold mb-2">What you'll learn:</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Device registration for MFA</li>
                <li>MFA method selection</li>
                <li>MFA verification process</li>
                <li>Token exchange with MFA context</li>
              </ul>
            </div>
            <button
              onClick={() => setCurrentStep(1)}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Start MFA Flow
            </button>
          </div>
        );

      case 1:
        return (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FiKey className="text-green-500" />
              Step 1: Device Registration
            </h3>
            {!deviceRegistered ? (
              <div>
                <p className="text-gray-600 mb-4">
                  Register your device to enable MFA authentication. This step simulates device registration with PingOne.
                </p>
                <button
                  onClick={handleDeviceRegistration}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Register Device
                </button>
              </div>
            ) : (
              <div className="bg-green-50 p-4 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <FiCheckCircle className="text-green-500" />
                  <span className="font-semibold text-green-700">Device Registered Successfully!</span>
                </div>
                <p className="text-sm text-green-600">Your device is now registered for MFA authentication.</p>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FiShield className="text-purple-500" />
              Step 2: Select MFA Method
            </h3>
            <p className="text-gray-600 mb-4">Choose your preferred multi-factor authentication method:</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {mfaMethods.map((method) => (
                <div
                  key={method.id}
                  onClick={() => setSelectedMfaMethod(method.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedMfaMethod === method.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{method.icon}</span>
                    <div>
                      <h4 className="font-semibold">{method.label}</h4>
                      <p className="text-sm text-gray-600">{method.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleMfaSelection}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Confirm MFA Method
            </button>
          </div>
        );

      case 3:
        return (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FiShield className="text-orange-500" />
              Step 3: MFA Verification
            </h3>
            {!mfaVerified ? (
              <div>
                <p className="text-gray-600 mb-4">
                  Enter the verification code sent to your {mfaMethods.find(m => m.id === selectedMfaMethod)?.label.toLowerCase()}.
                </p>
                <div className="max-w-xs mx-auto">
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    className="w-full p-3 text-center text-xl font-mono border-2 border-gray-300 rounded focus:border-orange-500 focus:outline-none"
                    maxLength={6}
                  />
                  <button
                    onClick={handleMfaVerification}
                    className="w-full mt-3 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                  >
                    Verify Code
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-4">✅</div>
                <h4 className="text-xl font-bold text-green-700 mb-2">MFA Verification Successful!</h4>
                <p className="text-gray-600">Your identity has been verified using {mfaMethods.find(m => m.id === selectedMfaMethod)?.label}.</p>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FiKey className="text-blue-500" />
              Step 4: Token Exchange
            </h3>
            {!tokens ? (
              <div>
                <p className="text-gray-600 mb-4">
                  Exchange your MFA-verified authorization for access tokens.
                </p>
                <button
                  onClick={handleTokenExchange}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Exchange Tokens
                </button>
              </div>
            ) : (
              <div className="bg-green-50 p-4 rounded">
                <h4 className="font-semibold mb-2 text-green-700">✅ Tokens Received Successfully</h4>
                <div className="font-mono text-sm bg-white p-2 rounded border">
                  <div><strong>Access Token:</strong> {tokens.access_token.substring(0, 20)}...</div>
                  <div><strong>Token Type:</strong> {tokens.token_type}</div>
                  <div><strong>MFA Verified:</strong> {tokens.mfa_verified ? 'Yes' : 'No'}</div>
                  <div><strong>MFA Method:</strong> {tokens.mfa_method}</div>
                </div>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FiCheckCircle className="text-green-500" />
              Step 5: Token Introspection
            </h3>
            {tokens && (
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-semibold mb-2">Token Details</h4>
                <div className="font-mono text-sm">
                  <div><strong>Token:</strong> {tokens.access_token}</div>
                  <div><strong>Expires:</strong> {tokens.expires_in} seconds</div>
                  <div><strong>MFA Context:</strong> Verified via {tokens.mfa_method}</div>
                </div>
              </div>
            )}
          </div>
        );

      case 6:
        return (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FiCheckCircle className="text-green-500" />
              Flow Complete!
            </h3>
            <div className="bg-green-50 p-6 rounded-lg text-center">
              <div className="text-4xl mb-4">🎉</div>
              <h4 className="text-xl font-bold text-green-700 mb-4">Congratulations!</h4>
              <p className="text-green-600 mb-4">
                You have successfully completed the PingOne MFA Flow with enhanced security through multi-factor authentication.
              </p>
              <ul className="text-left text-green-700 space-y-1">
                <li>✅ Device registered for MFA</li>
                <li>✅ MFA method selected: {mfaMethods.find(m => m.id === selectedMfaMethod)?.label}</li>
                <li>✅ MFA verification completed</li>
                <li>✅ Tokens exchanged with MFA context</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-lg shadow-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold inline-block mb-2">
                V5 Flow
              </div>
              <h1 className="text-2xl font-bold">PingOne MFA Flow</h1>
              <p className="text-green-100 mt-1">
                Interactive MFA authentication with PingOne
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{currentStep + 1}</div>
              <div className="text-sm text-green-200">of 7 steps</div>
            </div>
          </div>
        </div>

        {/* Step Content */}
        {renderStepContent()}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-4 py-2 bg-gray-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
          >
            Previous Step
          </button>

          <button
            onClick={() => setCurrentStep(Math.min(6, currentStep + 1))}
            disabled={currentStep === 6}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700"
          >
            {currentStep === 6 ? 'Complete' : 'Next Step'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PingOneMFAFlowV5;
