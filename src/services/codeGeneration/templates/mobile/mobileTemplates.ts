/**
 * Mobile Templates
 * React Native, Flutter, Swift Native, Kotlin Native
 */

export class ReactNativeTemplates {
	static authorization(config: any): string {
		return `// React Native - Authorization
import React, { useState } from 'react';
import { View, Button, Alert } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * OAuth 2.0 Authorization with React Native
 * Uses Expo AuthSession for OAuth flow
 */

const config = {
  environmentId: '${config.environmentId}',
  clientId: '${config.clientId}',
  redirectUri: '${config.redirectUri}',
};

export const AuthScreen = () => {
  const [loading, setLoading] = useState(false);

  const generateCodeVerifier = async (): Promise<string> => {
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    return Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, randomBytes);
  };

  const login = async () => {
    setLoading(true);
    try {
      const codeVerifier = await generateCodeVerifier();
      const codeChallenge = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        codeVerifier
      );

      await AsyncStorage.setItem('pkce_verifier', codeVerifier);

      const authUrl = \`https://auth.pingone.com/\${config.environmentId}/as/authorize?\` +
        \`client_id=\${config.clientId}&\` +
        \`redirect_uri=\${config.redirectUri}&\` +
        \`response_type=code&\` +
        \`scope=openid profile email&\` +
        \`code_challenge=\${codeChallenge}&\` +
        \`code_challenge_method=S256\`;

      const result = await AuthSession.startAsync({ authUrl });

      if (result.type === 'success') {
        const { code } = result.params;
        console.log('Authorization code:', code);
        // Exchange code for tokens
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Button title="Login with PingOne" onPress={login} disabled={loading} />
    </View>
  );
};`;
	}

	static workerToken(config: any): string {
		return `// React Native - Worker Token
import AsyncStorage from '@react-native-async-storage/async-storage';

const config = {
  environmentId: '${config.environmentId}',
  clientId: '${config.clientId}',
  clientSecret: 'YOUR_CLIENT_SECRET',
};

export const getWorkerToken = async (): Promise<string> => {
  try {
    const response = await fetch(
      \`https://auth.pingone.com/\${config.environmentId}/as/token\`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: config.clientId,
          client_secret: config.clientSecret,
        }).toString(),
      }
    );

    const data = await response.json();
    await AsyncStorage.setItem('worker_token', data.access_token);
    return data.access_token;
  } catch (error) {
    console.error('Failed to get worker token:', error);
    throw error;
  }
};`;
	}

	static deviceSelection(config: any): string {
		return `// React Native - Device Selection
import React, { useState, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, Text } from 'react-native';

interface Device {
  id: string;
  type: string;
  name: string;
  status: string;
}

export const DeviceList = ({ userId, accessToken, onSelect }: any) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await fetch(
        \`https://api.pingone.com/v1/environments/${config.environmentId}/users/\${userId}/devices\`,
        {
          headers: {
            'Authorization': \`Bearer \${accessToken}\`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      setDevices(data._embedded?.devices || []);
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FlatList
      data={devices}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => onSelect(item.id)}>
          <View style={{ padding: 16 }}>
            <Text>{item.type} - {item.name}</Text>
            <Text>{item.status}</Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
};`;
	}

	static mfaChallenge(config: any): string {
		return `// React Native - MFA Challenge
import React, { useState } from 'react';
import { View, Button, Text, Alert } from 'react-native';

export const MFAChallenge = ({ userId, deviceId, accessToken }: any) => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const sendChallenge = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        \`https://api.pingone.com/v1/environments/${config.environmentId}/users/\${userId}/devices/\${deviceId}/otp\`,
        {
          method: 'POST',
          headers: {
            'Authorization': \`Bearer \${accessToken}\`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        setSent(true);
        Alert.alert('Success', 'Challenge code sent!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send challenge');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Button
        title={sent ? 'Code Sent!' : 'Send Code'}
        onPress={sendChallenge}
        disabled={loading || sent}
      />
    </View>
  );
};`;
	}

	static mfaVerification(config: any): string {
		return `// React Native - MFA Verification
import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';

export const MFAVerification = ({ userId, deviceId, accessToken, onSuccess }: any) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const verifyCode = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        \`https://api.pingone.com/v1/environments/${config.environmentId}/users/\${userId}/devices/\${deviceId}/otp/verify\`,
        {
          method: 'POST',
          headers: {
            'Authorization': \`Bearer \${accessToken}\`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ otp: code }),
        }
      );

      const data = await response.json();
      if (data.status === 'VERIFIED') {
        Alert.alert('Success', 'Verification successful!');
        onSuccess();
      } else {
        Alert.alert('Error', 'Invalid code');
      }
    } catch (error) {
      Alert.alert('Error', 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TextInput
        value={code}
        onChangeText={setCode}
        placeholder="Enter 6-digit code"
        keyboardType="number-pad"
        maxLength={6}
      />
      <Button
        title="Verify"
        onPress={verifyCode}
        disabled={loading || code.length !== 6}
      />
    </View>
  );
};`;
	}

	static deviceRegistration(config: any): string {
		return `// React Native - Device Registration
import React, { useState } from 'react';
import { View, TextInput, Button, Picker, Alert } from 'react-native';

export const DeviceRegistration = ({ userId, accessToken, onSuccess }: any) => {
  const [type, setType] = useState('SMS');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const registerDevice = async () => {
    setLoading(true);
    try {
      const payload: any = {
        type,
        name: name || \`My \${type} Device\`,
      };

      if (type === 'SMS') payload.phone = phone;
      if (type === 'EMAIL') payload.email = email;

      const response = await fetch(
        \`https://api.pingone.com/v1/environments/${config.environmentId}/users/\${userId}/devices\`,
        {
          method: 'POST',
          headers: {
            'Authorization': \`Bearer \${accessToken}\`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        const device = await response.json();
        Alert.alert('Success', 'Device registered!');
        onSuccess(device);
      }
    } catch (error) {
      Alert.alert('Error', 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Picker selectedValue={type} onValueChange={setType}>
        <Picker.Item label="SMS" value="SMS" />
        <Picker.Item label="Email" value="EMAIL" />
        <Picker.Item label="Authenticator" value="TOTP" />
      </Picker>
      <TextInput value={name} onChangeText={setName} placeholder="Device name" />
      {type === 'SMS' && (
        <TextInput value={phone} onChangeText={setPhone} placeholder="+1234567890" />
      )}
      {type === 'EMAIL' && (
        <TextInput value={email} onChangeText={setEmail} placeholder="email@example.com" />
      )}
      <Button title="Register" onPress={registerDevice} disabled={loading} />
    </View>
  );
};`;
	}
}

export class FlutterTemplates {
	static authorization(config: any): string {
		return `// Flutter - Authorization
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'dart:convert';
import 'dart:math';
import 'package:crypto/crypto.dart';

/**
 * OAuth 2.0 Authorization with Flutter
 */

class AuthService {
  final storage = FlutterSecureStorage();
  final config = {
    'environmentId': '${config.environmentId}',
    'clientId': '${config.clientId}',
    'redirectUri': '${config.redirectUri}',
  };

  String generateCodeVerifier() {
    final random = Random.secure();
    final values = List<int>.generate(32, (i) => random.nextInt(256));
    return base64UrlEncode(values).replaceAll('=', '');
  }

  String generateCodeChallenge(String verifier) {
    final bytes = utf8.encode(verifier);
    final digest = sha256.convert(bytes);
    return base64UrlEncode(digest.bytes).replaceAll('=', '');
  }

  Future<void> login() async {
    try {
      final codeVerifier = generateCodeVerifier();
      final codeChallenge = generateCodeChallenge(codeVerifier);
      final state = generateCodeVerifier();

      await storage.write(key: 'pkce_verifier', value: codeVerifier);
      await storage.write(key: 'oauth_state', value: state);

      final authUrl = Uri.parse(
        'https://auth.pingone.com/\${config['environmentId']}/as/authorize'
      ).replace(queryParameters: {
        'client_id': config['clientId']!,
        'redirect_uri': config['redirectUri']!,
        'response_type': 'code',
        'scope': 'openid profile email',
        'code_challenge': codeChallenge,
        'code_challenge_method': 'S256',
        'state': state,
      });

      // Launch URL in browser
      print('Auth URL: $authUrl');
    } catch (e) {
      print('Login failed: $e');
    }
  }
}

class LoginButton extends StatelessWidget {
  final AuthService authService = AuthService();

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: () => authService.login(),
      child: Text('Login with PingOne'),
    );
  }
}`;
	}

	static workerToken(config: any): string {
		return `// Flutter - Worker Token
import 'package:http/http.dart' as http;
import 'dart:convert';

class WorkerTokenService {
  final config = {
    'environmentId': '${config.environmentId}',
    'clientId': '${config.clientId}',
    'clientSecret': 'YOUR_CLIENT_SECRET',
  };

  Future<String> getWorkerToken() async {
    try {
      final response = await http.post(
        Uri.parse('https://auth.pingone.com/\${config['environmentId']}/as/token'),
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: {
          'grant_type': 'client_credentials',
          'client_id': config['clientId']!,
          'client_secret': config['clientSecret']!,
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['access_token'];
      } else {
        throw Exception('Failed to get worker token');
      }
    } catch (e) {
      print('Error: $e');
      rethrow;
    }
  }
}`;
	}

	static deviceSelection(config: any): string {
		return `// Flutter - Device Selection
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class Device {
  final String id;
  final String type;
  final String name;
  final String status;

  Device({required this.id, required this.type, required this.name, required this.status});

  factory Device.fromJson(Map<String, dynamic> json) {
    return Device(
      id: json['id'],
      type: json['type'],
      name: json['name'],
      status: json['status'],
    );
  }
}

class DeviceListWidget extends StatefulWidget {
  final String userId;
  final String accessToken;
  final Function(String) onDeviceSelect;

  DeviceListWidget({required this.userId, required this.accessToken, required this.onDeviceSelect});

  @override
  _DeviceListWidgetState createState() => _DeviceListWidgetState();
}

class _DeviceListWidgetState extends State<DeviceListWidget> {
  List<Device> devices = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    fetchDevices();
  }

  Future<void> fetchDevices() async {
    try {
      final response = await http.get(
        Uri.parse('https://api.pingone.com/v1/environments/${config.environmentId}/users/\${widget.userId}/devices'),
        headers: {
          'Authorization': 'Bearer \${widget.accessToken}',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final deviceList = (data['_embedded']['devices'] as List)
            .map((d) => Device.fromJson(d))
            .toList();
        setState(() {
          devices = deviceList;
          loading = false;
        });
      }
    } catch (e) {
      print('Error: $e');
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return CircularProgressIndicator();

    return ListView.builder(
      itemCount: devices.length,
      itemBuilder: (context, index) {
        final device = devices[index];
        return ListTile(
          title: Text('\${device.type} - \${device.name}'),
          subtitle: Text(device.status),
          onTap: () => widget.onDeviceSelect(device.id),
        );
      },
    );
  }
}`;
	}

	static mfaChallenge(config: any): string {
		return `// Flutter - MFA Challenge
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class MFAChallengeWidget extends StatefulWidget {
  final String userId;
  final String deviceId;
  final String accessToken;

  MFAChallengeWidget({required this.userId, required this.deviceId, required this.accessToken});

  @override
  _MFAChallengeWidgetState createState() => _MFAChallengeWidgetState();
}

class _MFAChallengeWidgetState extends State<MFAChallengeWidget> {
  bool loading = false;
  bool sent = false;

  Future<void> sendChallenge() async {
    setState(() => loading = true);

    try {
      final response = await http.post(
        Uri.parse('https://api.pingone.com/v1/environments/${config.environmentId}/users/\${widget.userId}/devices/\${widget.deviceId}/otp'),
        headers: {
          'Authorization': 'Bearer \${widget.accessToken}',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        setState(() => sent = true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Challenge code sent!')),
        );
      }
    } catch (e) {
      print('Error: $e');
    } finally {
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: (loading || sent) ? null : sendChallenge,
      child: Text(sent ? 'Code Sent!' : loading ? 'Sending...' : 'Send Code'),
    );
  }
}`;
	}

	static mfaVerification(config: any): string {
		return `// Flutter - MFA Verification
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class MFAVerificationWidget extends StatefulWidget {
  final String userId;
  final String deviceId;
  final String accessToken;
  final Function() onSuccess;

  MFAVerificationWidget({
    required this.userId,
    required this.deviceId,
    required this.accessToken,
    required this.onSuccess,
  });

  @override
  _MFAVerificationWidgetState createState() => _MFAVerificationWidgetState();
}

class _MFAVerificationWidgetState extends State<MFAVerificationWidget> {
  final TextEditingController codeController = TextEditingController();
  bool loading = false;

  Future<void> verifyCode() async {
    setState(() => loading = true);

    try {
      final response = await http.post(
        Uri.parse('https://api.pingone.com/v1/environments/${config.environmentId}/users/\${widget.userId}/devices/\${widget.deviceId}/otp/verify'),
        headers: {
          'Authorization': 'Bearer \${widget.accessToken}',
          'Content-Type': 'application/json',
        },
        body: json.encode({'otp': codeController.text}),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['status'] == 'VERIFIED') {
          widget.onSuccess();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Invalid code')),
          );
        }
      }
    } catch (e) {
      print('Error: $e');
    } finally {
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TextField(
          controller: codeController,
          decoration: InputDecoration(labelText: 'Enter 6-digit code'),
          keyboardType: TextInputType.number,
          maxLength: 6,
        ),
        ElevatedButton(
          onPressed: loading ? null : verifyCode,
          child: Text(loading ? 'Verifying...' : 'Verify'),
        ),
      ],
    );
  }
}`;
	}

	static deviceRegistration(config: any): string {
		return `// Flutter - Device Registration
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class DeviceRegistrationWidget extends StatefulWidget {
  final String userId;
  final String accessToken;
  final Function(dynamic) onSuccess;

  DeviceRegistrationWidget({
    required this.userId,
    required this.accessToken,
    required this.onSuccess,
  });

  @override
  _DeviceRegistrationWidgetState createState() => _DeviceRegistrationWidgetState();
}

class _DeviceRegistrationWidgetState extends State<DeviceRegistrationWidget> {
  String deviceType = 'SMS';
  final TextEditingController phoneController = TextEditingController();
  final TextEditingController emailController = TextEditingController();
  final TextEditingController nameController = TextEditingController();
  bool loading = false;

  Future<void> registerDevice() async {
    setState(() => loading = true);

    try {
      final payload = {
        'type': deviceType,
        'name': nameController.text.isEmpty ? 'My $deviceType Device' : nameController.text,
      };

      if (deviceType == 'SMS') payload['phone'] = phoneController.text;
      if (deviceType == 'EMAIL') payload['email'] = emailController.text;

      final response = await http.post(
        Uri.parse('https://api.pingone.com/v1/environments/${config.environmentId}/users/\${widget.userId}/devices'),
        headers: {
          'Authorization': 'Bearer \${widget.accessToken}',
          'Content-Type': 'application/json',
        },
        body: json.encode(payload),
      );

      if (response.statusCode == 200) {
        final device = json.decode(response.body);
        widget.onSuccess(device);
      }
    } catch (e) {
      print('Error: $e');
    } finally {
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        DropdownButton<String>(
          value: deviceType,
          items: ['SMS', 'EMAIL', 'TOTP'].map((type) {
            return DropdownMenuItem(value: type, child: Text(type));
          }).toList(),
          onChanged: (value) => setState(() => deviceType = value!),
        ),
        TextField(
          controller: nameController,
          decoration: InputDecoration(labelText: 'Device Name'),
        ),
        if (deviceType == 'SMS')
          TextField(
            controller: phoneController,
            decoration: InputDecoration(labelText: 'Phone Number'),
            keyboardType: TextInputType.phone,
          ),
        if (deviceType == 'EMAIL')
          TextField(
            controller: emailController,
            decoration: InputDecoration(labelText: 'Email'),
            keyboardType: TextInputType.emailAddress,
          ),
        ElevatedButton(
          onPressed: loading ? null : registerDevice,
          child: Text(loading ? 'Registering...' : 'Register'),
        ),
      ],
    );
  }
}`;
	}
}
