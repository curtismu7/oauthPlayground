// src/services/fido2Service.ts
// FIDO2/WebAuthn Service for Passkey Registration and Authentication

export interface FIDO2Credential {
  id: string;
  type: 'public-key';
  rawId: ArrayBuffer;
  response: {
    attestationObject: ArrayBuffer;
    clientDataJSON: ArrayBuffer;
  };
}

export interface FIDO2RegistrationResult {
  success: boolean;
  credentialId?: string;
  publicKey?: string;
  error?: string;
  userHandle?: string;
}

export interface FIDO2AuthenticationResult {
  success: boolean;
  credentialId?: string;
  signature?: string;
  error?: string;
  userHandle?: string;
}

export interface FIDO2Config {
  rpId: string;
  rpName: string;
  userDisplayName: string;
  userName: string;
  userHandle: string;
  challenge: string;
  timeout?: number;
  attestation?: 'none' | 'indirect' | 'direct';
  authenticatorSelection?: {
    authenticatorAttachment?: 'platform' | 'cross-platform';
    userVerification?: 'required' | 'preferred' | 'discouraged';
    residentKey?: 'required' | 'preferred' | 'discouraged';
  };
}

/**
 * FIDO2Service - Handles WebAuthn credential creation and verification
 * 
 * This service provides:
 * 1. Passkey registration using WebAuthn API
 * 2. Passkey authentication/verification
 * 3. Support for both platform and cross-platform authenticators
 * 4. Proper error handling and user feedback
 */
export class FIDO2Service {
  private static readonly DEFAULT_TIMEOUT = 60000; // 60 seconds
  private static readonly DEFAULT_RP_ID = window.location.hostname;

  /**
   * Check if WebAuthn is supported in the current browser
   */
  static isWebAuthnSupported(): boolean {
    return !!(
      window.PublicKeyCredential &&
      window.navigator.credentials &&
      window.navigator.credentials.create &&
      window.navigator.credentials.get
    );
  }

  /**
   * Get WebAuthn capabilities
   */
  static getCapabilities(): {
    webAuthnSupported: boolean;
    platformAuthenticator: boolean;
    crossPlatformAuthenticator: boolean;
    userVerification: boolean;
  } {
    const supported = this.isWebAuthnSupported();
    
    return {
      webAuthnSupported: supported,
      platformAuthenticator: supported && this.isPlatformAuthenticatorSupported(),
      crossPlatformAuthenticator: supported && this.isCrossPlatformAuthenticatorSupported(),
      userVerification: supported
    };
  }

  /**
   * Register a new FIDO2 credential (passkey)
   */
  static async registerCredential(config: FIDO2Config): Promise<FIDO2RegistrationResult> {
    try {
      if (!this.isWebAuthnSupported()) {
        return {
          success: false,
          error: 'WebAuthn is not supported in this browser'
        };
      }

      console.log('🔐 [FIDO2] Starting credential registration', {
        rpId: config.rpId,
        rpName: config.rpName,
        userName: config.userName
      });

      // Convert challenge from base64 to ArrayBuffer
      const challengeBuffer = this.base64ToArrayBuffer(config.challenge);

      // Create credential creation options
      const createOptions: CredentialCreationOptions = {
        publicKey: {
          rp: {
            id: config.rpId,
            name: config.rpName
          },
          user: {
            id: new TextEncoder().encode(config.userHandle),
            name: config.userName,
            displayName: config.userDisplayName
          },
          challenge: challengeBuffer,
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 }, // ES256
            { type: 'public-key', alg: -257 } // RS256
          ],
          timeout: config.timeout || this.DEFAULT_TIMEOUT,
          attestation: config.attestation || 'none',
          authenticatorSelection: {
            authenticatorAttachment: config.authenticatorSelection?.authenticatorAttachment,
            userVerification: config.authenticatorSelection?.userVerification || 'preferred',
            residentKey: config.authenticatorSelection?.residentKey || 'preferred'
          }
        }
      };

      // Create the credential
      const credential = await navigator.credentials.create(createOptions) as PublicKeyCredential;
      
      if (!credential) {
        return {
          success: false,
          error: 'Credential creation was cancelled or failed'
        };
      }

      // Extract credential data
      const response = credential.response as AuthenticatorAttestationResponse;
      const credentialId = this.arrayBufferToBase64(credential.rawId);
      const publicKey = this.arrayBufferToBase64(response.publicKey || new ArrayBuffer(0));
      const attestationObject = this.arrayBufferToBase64(response.attestationObject);
      const clientDataJSON = this.arrayBufferToBase64(response.clientDataJSON);

      console.log('✅ [FIDO2] Credential registered successfully', {
        credentialId: credentialId.substring(0, 20) + '...',
        hasPublicKey: !!publicKey,
        hasAttestation: !!attestationObject
      });

      return {
        success: true,
        credentialId,
        publicKey,
        userHandle: config.userHandle
      };

    } catch (error: any) {
      console.error('❌ [FIDO2] Credential registration failed:', error);
      
      let errorMessage = 'Credential registration failed';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Registration was cancelled or not allowed';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'This authenticator is not supported';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Security error during registration';
      } else if (error.name === 'InvalidStateError') {
        errorMessage = 'Authenticator is already registered';
      } else if (error.name === 'ConstraintError') {
        errorMessage = 'Authenticator does not meet requirements';
      } else if (error.name === 'TimeoutError') {
        errorMessage = 'Registration timed out';
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Authenticate using an existing FIDO2 credential
   */
  static async authenticateCredential(
    credentialId: string,
    challenge: string,
    rpId?: string
  ): Promise<FIDO2AuthenticationResult> {
    try {
      if (!this.isWebAuthnSupported()) {
        return {
          success: false,
          error: 'WebAuthn is not supported in this browser'
        };
      }

      console.log('🔐 [FIDO2] Starting credential authentication', {
        credentialId: credentialId.substring(0, 20) + '...',
        rpId: rpId || this.DEFAULT_RP_ID
      });

      // Convert challenge and credential ID to ArrayBuffers
      const challengeBuffer = this.base64ToArrayBuffer(challenge);
      const credentialIdBuffer = this.base64ToArrayBuffer(credentialId);

      // Create authentication options
      const getOptions: CredentialRequestOptions = {
        publicKey: {
          challenge: challengeBuffer,
          allowCredentials: [{
            type: 'public-key',
            id: credentialIdBuffer,
            transports: ['usb', 'nfc', 'ble', 'internal']
          }],
          timeout: this.DEFAULT_TIMEOUT,
          userVerification: 'preferred',
          rpId: rpId || this.DEFAULT_RP_ID
        }
      };

      // Get the credential
      const credential = await navigator.credentials.get(getOptions) as PublicKeyCredential;
      
      if (!credential) {
        return {
          success: false,
          error: 'Authentication was cancelled or failed'
        };
      }

      // Extract authentication data
      const response = credential.response as AuthenticatorAssertionResponse;
      const signature = this.arrayBufferToBase64(response.signature);
      const authenticatorData = this.arrayBufferToBase64(response.authenticatorData);
      const clientDataJSON = this.arrayBufferToBase64(response.clientDataJSON);

      console.log('✅ [FIDO2] Credential authenticated successfully', {
        credentialId: credentialId.substring(0, 20) + '...',
        hasSignature: !!signature
      });

      return {
        success: true,
        credentialId,
        signature,
        userHandle: response.userHandle ? this.arrayBufferToBase64(response.userHandle) : undefined
      };

    } catch (error: any) {
      console.error('❌ [FIDO2] Credential authentication failed:', error);
      
      let errorMessage = 'Authentication failed';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Authentication was cancelled or not allowed';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'This authenticator is not supported';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Security error during authentication';
      } else if (error.name === 'InvalidStateError') {
        errorMessage = 'Authenticator is not registered';
      } else if (error.name === 'ConstraintError') {
        errorMessage = 'Authenticator does not meet requirements';
      } else if (error.name === 'TimeoutError') {
        errorMessage = 'Authentication timed out';
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Generate a random challenge for registration or authentication
   */
  static generateChallenge(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.arrayBufferToBase64(array.buffer);
  }

  /**
   * Check if platform authenticator is supported
   */
  private static isPlatformAuthenticatorSupported(): boolean {
    try {
      return PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * Check if cross-platform authenticator is supported
   */
  private static isCrossPlatformAuthenticatorSupported(): boolean {
    // Cross-platform authenticators are generally supported if WebAuthn is supported
    return this.isWebAuthnSupported();
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 string to ArrayBuffer
   */
  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Get user-friendly device type name
   */
  static getDeviceTypeName(authenticatorAttachment?: string): string {
    switch (authenticatorAttachment) {
      case 'platform':
        return 'Built-in Authenticator (Touch ID, Face ID, Windows Hello)';
      case 'cross-platform':
        return 'External Security Key (YubiKey, etc.)';
      default:
        return 'Security Key';
    }
  }

  /**
   * Get setup instructions for different authenticator types
   */
  static getSetupInstructions(authenticatorAttachment?: string): string[] {
    switch (authenticatorAttachment) {
      case 'platform':
        return [
          'Use your device\'s built-in authenticator',
          'Touch ID, Face ID, or Windows Hello will be used',
          'Follow the on-screen prompts to complete setup'
        ];
      case 'cross-platform':
        return [
          'Insert your external security key (YubiKey, etc.)',
          'Touch the key when prompted',
          'Follow the browser prompts to complete setup'
        ];
      default:
        return [
          'Use any compatible security key or authenticator',
          'Follow the on-screen prompts',
          'Complete the setup process'
        ];
    }
  }
}

export default FIDO2Service;



