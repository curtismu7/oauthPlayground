import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';
import type { MFACredentials } from '@/v8/services/mfaServiceV8';

const MODULE_TAG = '[📱 MFA-ONE-TIME-V8]';

interface OneTimeDeviceState {
	deviceType: 'EMAIL' | 'SMS' | 'VOICE' | null;
	contactValue: string;
	deviceAuthId?: string;
	otpCheckUrl?: string;
	otpSent: boolean;
	otpCode: string;
	loading: boolean;
	error: string | null;
}

export default function MFAOneTimeDevicesV8() {
	const [credentials, setCredentials] = useState<MFACredentials>({
		environmentId: '',
		username: ''
	});
	
	const [deviceState, setDeviceState] = useState<OneTimeDeviceState>({
		deviceType: null,
		contactValue: '',
		otpSent: false,
		otpCode: '',
		loading: false,
		error: null
	});

	const [workerToken, setWorkerToken] = useState<string>('');
	const [showAdvanced, setShowAdvanced] = useState(false);

	const maskContact = (type: 'EMAIL' | 'SMS' | 'VOICE', value: string): string => {
		if (type === 'EMAIL') {
			const [username, domain] = value.split('@');
			if (username.length <= 2) return `${username}@${domain}`;
			return `${username.slice(0, 2)}•••@${domain}`;
		} else {
			// SMS/VOICE phone masking
			if (value.length <= 4) return value;
			const last4 = value.slice(-4);
			const prefix = value.slice(0, 3);
			return `${prefix}••••${last4}`;
		}
	};

	const handleSendOTP = async () => {
		if (!deviceState.deviceType || !deviceState.contactValue) {
			toastV8.error('Please select device type and enter contact information');
			return;
		}

		setDeviceState(prev => ({ ...prev, loading: true, error: null }));

		try {
			// Get worker token
			const token = workerToken || await MFAServiceV8.getWorkerToken();
			if (!token) {
				throw new Error('Worker token is required. Please configure worker token.');
			}

			// Initialize one-time device authentication
			const response = await MFAServiceV8.initializeOneTimeDeviceAuthentication({
				environmentId: credentials.environmentId,
				username: credentials.username,
				type: deviceState.deviceType,
				...(deviceState.deviceType === 'EMAIL' ? { email: deviceState.contactValue } : { phone: deviceState.contactValue }),
				workerToken: token
			});

			setDeviceState(prev => ({
				...prev,
				deviceAuthId: response.id,
				...(response._links?.['otp.check']?.href && { otpCheckUrl: response._links['otp.check'].href }),
				otpSent: true,
				loading: false
			}));

			toastV8.success(`OTP sent to ${maskContact(deviceState.deviceType, deviceState.contactValue)}`);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to send OTP';
			setDeviceState(prev => ({ ...prev, loading: false, error: errorMessage }));
			toastV8.error(errorMessage);
		}
	};

	const handleValidateOTP = async () => {
		if (!deviceState.otpCode || !deviceState.deviceAuthId) {
			toastV8.error('Please enter the OTP code');
			return;
		}

		setDeviceState(prev => ({ ...prev, loading: true, error: null }));

		try {
			const token = workerToken || await MFAServiceV8.getWorkerToken();
			
			const result = await MFAServiceV8.validateOTP({
				environmentId: credentials.environmentId,
				deviceAuthId: deviceState.deviceAuthId,
				otp: deviceState.otpCode,
				workerToken: token,
				...(deviceState.otpCheckUrl && { otpCheckUrl: deviceState.otpCheckUrl })
			});

			if (result.valid) {
				toastV8.success('OTP validated successfully! One-time MFA completed.');
				// Reset state for new attempt
				setDeviceState({
					deviceType: null,
					contactValue: '',
					otpSent: false,
					otpCode: '',
					loading: false,
					error: null
				});
			} else {
				setDeviceState(prev => ({
					...prev,
					loading: false,
					error: result.message || 'Invalid OTP code'
				}));
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to validate OTP';
			setDeviceState(prev => ({ ...prev, loading: false, error: errorMessage }));
			toastV8.error(errorMessage);
		}
	};

	const handleReset = () => {
		setDeviceState({
			deviceType: null,
			contactValue: '',
			otpSent: false,
			otpCode: '',
			loading: false,
			error: null
		});
	};

	return (
		<div className="max-w-4xl mx-auto p-6 space-y-6">
			{/* Header with Education */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<CardTitle className="text-2xl">MFA One-Time Devices (Phase 2)</CardTitle>
						<Badge variant="outline">Experimental</Badge>
						<Badge variant="secondary">Phase 2</Badge>
					</div>
					<CardDescription className="text-base">
						Test one-time MFA where your application controls device information instead of storing it in PingOne.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<Alert>
						<AlertDescription>
							<strong>📚 Important:</strong> This is <strong>Phase 2</strong> - One-time Device Authentication. 
							Use this when your organization maintains user contact details in your own database rather than storing MFA devices in PingOne.
						</AlertDescription>
					</Alert>

			<Tabs defaultValue="overview" className="w-full">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="comparison">Phase 1 vs Phase 2</TabsTrigger>
					<TabsTrigger value="test">Test One-Time MFA</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">One-Time Device Authentication</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid gap-4">
								<div className="p-4 border rounded-lg bg-blue-50">
									<h4 className="font-semibold text-blue-900">How it works:</h4>
									<ol className="list-decimal list-inside mt-2 space-y-1 text-sm text-blue-800">
										<li>Your app provides user's email/phone in the API call</li>
										<li>PingOne sends OTP without persisting the device</li>
										<li>OTP is validated using the same deviceAuthentication flow</li>
										<li>No MFA device is stored in PingOne</li>
									</ol>
								</div>
								
								<div className="p-4 border rounded-lg bg-green-50">
									<h4 className="font-semibold text-green-900">Use cases:</h4>
									<ul className="list-disc list-inside mt-2 space-y-1 text-sm text-green-800">
										<li>Organizations that maintain their own user database</li>
										<li>Privacy requirements to avoid storing contact info in PingOne</li>
										<li>Existing systems with user contact management</li>
										<li>Temporary or guest user scenarios</li>
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="comparison" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Phase 1 vs Phase 2 Comparison</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid md:grid-cols-3 gap-4">
								<div className="space-y-4">
									<div className="p-4 border rounded-lg">
										<Badge className="mb-2">Phase 1 - Standard Devices</Badge>
										<h4 className="font-semibold">PingOne-Managed Devices</h4>
										<ul className="text-sm mt-2 space-y-1">
											<li>• Devices stored in PingOne</li>
											<li>• Uses <code>selectedDevice.id</code></li>
											<li>• Device registration required</li>
											<li>• Device selection from PingOne list</li>
											<li>• Recommended for most use cases</li>
										</ul>
									</div>
								</div>
								
								<div className="space-y-4">
									<div className="p-4 border rounded-lg">
										<Badge variant="outline" className="mb-2">Phase 2 - One-Time Devices</Badge>
										<h4 className="font-semibold">App-Managed Contact Info</h4>
										<ul className="text-sm mt-2 space-y-1">
											<li>• No devices stored in PingOne</li>
											<li>• Uses <code>selectedDevice.oneTime</code></li>
											<li>• No device registration needed</li>
											<li>• Contact info from your database</li>
											<li>• For special requirements</li>
										</ul>
									</div>
								</div>
							</div>

							<Separator className="my-4" />

							<Alert>
								<AlertDescription>
									<strong>Recommendation:</strong> Start with Phase 1 (Standard Devices) for most implementations. 
									Use Phase 2 (One-Time Devices) only if you have specific requirements to avoid storing contact information in PingOne.
								</AlertDescription>
							</Alert>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="test" className="space-y-4">
					{/* Configuration Section */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Configuration</CardTitle>
							<CardDescription>
								Enter your PingOne credentials to test one-time MFA
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div>
									<Label htmlFor="environmentId">Environment ID</Label>
									<Input
										id="environmentId"
										value={credentials.environmentId}
										onChange={(e) => setCredentials(prev => ({ ...prev, environmentId: e.target.value }))}
										placeholder="Your PingOne Environment ID"
									/>
								</div>
								<div>
									<Label htmlFor="username">Username</Label>
									<Input
										id="username"
										value={credentials.username}
										onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
										placeholder="User to authenticate"
									/>
								</div>
							</div>

							<div>
								<Label htmlFor="workerToken">Worker Token (Optional)</Label>
								<Input
									id="workerToken"
									type="password"
									value={workerToken}
									onChange={(e) => setWorkerToken(e.target.value)}
									placeholder="Will auto-generate if not provided"
								/>
								<p className="text-xs text-gray-500 mt-1">
									Leave empty to use stored worker token
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Device Selection */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Device Configuration</CardTitle>
							<CardDescription>
								Choose how to send the one-time OTP
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<Button
									variant={deviceState.deviceType === 'EMAIL' ? 'default' : 'outline'}
									onClick={() => setDeviceState(prev => ({ ...prev, deviceType: 'EMAIL' }))}
									className="h-20 flex-col"
								>
									<span className="text-2xl mb-1">📧</span>
									<span>Email OTP</span>
								</Button>
								<Button
									variant={deviceState.deviceType === 'SMS' ? 'default' : 'outline'}
									onClick={() => setDeviceState(prev => ({ ...prev, deviceType: 'SMS' }))}
									className="h-20 flex-col"
								>
									<span className="text-2xl mb-1">📱</span>
									<span>SMS OTP</span>
								</Button>
							<Button
									variant={deviceState.deviceType === 'VOICE' ? 'default' : 'outline'}
									onClick={() => setDeviceState(prev => ({ ...prev, deviceType: 'VOICE' }))}
									className="h-20 flex-col"
								>
									<span className="text-2xl mb-1">📞</span>
									<span>Voice OTP</span>
								</Button>
							</div>
							

							{deviceState.deviceType && (
								<div>
									<Label htmlFor="contactValue">
										{deviceState.deviceType === 'EMAIL' ? 'Email Address' : deviceState.deviceType === 'VOICE' ? 'Phone Number (Voice)' : 'Phone Number'}
									</Label>
									<Input
										id="contactValue"
										type={deviceState.deviceType === 'EMAIL' ? 'email' : 'tel'}
										value={deviceState.contactValue}
										onChange={(e) => setDeviceState(prev => ({ ...prev, contactValue: e.target.value }))}
										placeholder={
											deviceState.deviceType === 'EMAIL' 
												? 'user@example.com' 
												: '+15551234567'
										}
									/>
								</div>
							)}

							{deviceState.error && (
								<Alert>
									<AlertDescription>{deviceState.error}</AlertDescription>
								</Alert>
							)}

							{/* OTP Sent Section */}
							{deviceState.otpSent && (
								<div className="space-y-4 p-4 bg-green-50 border rounded-lg">
									<Alert>
										<AlertDescription>
											OTP sent to {maskContact(deviceState.deviceType!, deviceState.contactValue)}
											{deviceState.otpCheckUrl && (
												<span className="block text-xs mt-1">
													Using server-provided validation URL
												</span>
											)}
										</AlertDescription>
									</Alert>

									<div>
										<Label htmlFor="otpCode">Enter OTP Code</Label>
										<Input
											id="otpCode"
											value={deviceState.otpCode}
											onChange={(e) => setDeviceState(prev => ({ ...prev, otpCode: e.target.value }))}
											placeholder="Enter the code you received"
											maxLength={6}
										/>
									</div>

									<div className="flex gap-2">
										<Button 
											onClick={handleValidateOTP}
											disabled={!deviceState.otpCode || deviceState.loading}
											className="flex-1"
										>
											{deviceState.loading ? 'Validating...' : 'Validate OTP'}
										</Button>
										<Button 
											variant="outline" 
											onClick={handleReset}
											disabled={deviceState.loading}
										>
											Reset
										</Button>
									</div>
								</div>
							)}

							{/* Send OTP Button */}
							{!deviceState.otpSent && deviceState.deviceType && deviceState.contactValue && (
								<Button 
									onClick={handleSendOTP}
									disabled={deviceState.loading || !credentials.environmentId || !credentials.username}
									className="w-full"
									size="lg"
								>
									{deviceState.loading ? 'Sending OTP...' : `Send OTP to ${maskContact(deviceState.deviceType, deviceState.contactValue)}`}
								</Button>
							)}
						</CardContent>
					</Card>

					{/* Advanced Section */}
					<Card>
						<CardHeader>
							<Button 
								variant="ghost" 
								onClick={() => setShowAdvanced(!showAdvanced)}
								className="w-full justify-between"
							>
								<span className="font-semibold">Advanced Information</span>
								<span>{showAdvanced ? '▼' : '▶'}</span>
							</Button>
						</CardHeader>
						{showAdvanced && (
							<CardContent className="space-y-4">
								<div className="text-sm space-y-2">
									<p><strong>API Endpoint:</strong> POST /{credentials.environmentId}/deviceAuthentications</p>
									<p><strong>Request Body:</strong></p>
									<pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
{`{
  "user": { "id": "${credentials.username || 'USER_ID'}" },
  "selectedDevice": {
    "oneTime": {
      "type": "${deviceState.deviceType || 'EMAIL'}",
      "${deviceState.deviceType === 'EMAIL' ? 'email' : 'phone'}": "${deviceState.contactValue || 'user@example.com'}"
    }
  }
}`}
									</pre>
									
									{deviceState.deviceAuthId && (
										<>
											<p><strong>Device Authentication ID:</strong> {deviceState.deviceAuthId}</p>
											{deviceState.otpCheckUrl && (
												<p><strong>OTP Check URL:</strong> {deviceState.otpCheckUrl}</p>
											)}
										</>
									)}
								</div>
							</CardContent>
						)}
					</Card>
				</TabsContent>
			</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}
